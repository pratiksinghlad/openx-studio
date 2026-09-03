import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type {
  ScenarioRoadGeometry,
  ScenarioFrame,
  ScenarioObjectState,
  ScenarioMetadata,
} from '../types/simulation.ts';
import {
  getLaneColor,
  getLaneZOffset,
  createStripGeometry,
  createRoadMarkMesh,
  createFallbackBoundaryMarks,
} from './geometryUtils.ts';
import { createEntityMesh, resolveEntityVisualType } from './entityMeshBuilder.ts';
import type { EntityVisualType } from './entityMeshBuilder.ts';
import { createRoadFeatureMesh } from './roadFeatureMeshBuilder.ts';

export * from './types.ts';
import {
  CameraMode,
  ViewTheme,
  CameraConfig,
  CAMERA_MODES,
  VIEW_THEMES,
  DEFAULT_CAMERA_CONFIG,
} from './types.ts';


export class ScenarioRenderer {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;

  private cameraConfig: CameraConfig;
  private defaultCameraPosition: THREE.Vector3;
  private defaultCameraTarget: THREE.Vector3;

  private ambientLight: THREE.HemisphereLight;
  private sunLight: THREE.DirectionalLight;
  private ground: THREE.Mesh;

  private roadGroup = new THREE.Group();
  private markGroup = new THREE.Group();
  private objectGroup = new THREE.Group();
  private entityGroup = new THREE.Group();
  private trailGroup = new THREE.Group();

  private entityMeshes: Map<number, THREE.Group> = new Map();
  private entityTargetStates: Map<number, ScenarioObjectState> = new Map();
  private entityTrails: Map<number, THREE.Vector3[]> = new Map();
  private entityLabels: Map<number, { sprite: THREE.Sprite; canvas: HTMLCanvasElement; texture: THREE.CanvasTexture }> = new Map();
  private entityVisualTypes: Map<number, EntityVisualType> = new Map();
  private metadataCategoryMap = new Map<string, string>();

  private cameraMode: CameraMode = CAMERA_MODES.ORBIT;
  private currentTheme: ViewTheme = VIEW_THEMES.LIGHT;
  private egoVehicleId: number | null = null;
  private hasFramedInitialEntity = false;
  private isDestroyed = false;
  private animationFrameId: number | null = null;
  private baselineDistance = 0;

  constructor(
    container: HTMLElement,
    initialTheme: ViewTheme = VIEW_THEMES.LIGHT,
    customCameraConfig?: Partial<CameraConfig>
  ) {
    this.container = container;
    this.currentTheme = initialTheme;
    this.cameraConfig = {
      ...DEFAULT_CAMERA_CONFIG,
      ...customCameraConfig,
      birdsEyeOffsetFactors: {
        ...DEFAULT_CAMERA_CONFIG.birdsEyeOffsetFactors,
        ...customCameraConfig?.birdsEyeOffsetFactors,
      },
      initialPosition: {
        ...DEFAULT_CAMERA_CONFIG.initialPosition,
        ...customCameraConfig?.initialPosition,
      },
      initialTarget: {
        ...DEFAULT_CAMERA_CONFIG.initialTarget,
        ...customCameraConfig?.initialTarget,
      },
    };

    this.defaultCameraPosition = new THREE.Vector3(
      this.cameraConfig.initialPosition.x,
      this.cameraConfig.initialPosition.y,
      this.cameraConfig.initialPosition.z
    );
    this.defaultCameraTarget = new THREE.Vector3(
      this.cameraConfig.initialTarget.x,
      this.cameraConfig.initialTarget.y,
      this.cameraConfig.initialTarget.z
    );

    // Setup Scene
    this.scene = new THREE.Scene();

    // Setup Camera
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(
      this.cameraConfig.fov,
      width / height,
      this.cameraConfig.near,
      this.cameraConfig.far
    );
    this.camera.up.set(0, 0, 1); // Z-up coordinate system
    this.camera.position.copy(this.defaultCameraPosition);

    // Setup WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      logarithmicDepthBuffer: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    // Setup Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = this.cameraConfig.dampingFactor;
    this.controls.target.copy(this.defaultCameraTarget);
    this.controls.maxPolarAngle = this.cameraConfig.orbitMaxPolarAngle;
    this.controls.minPolarAngle = this.cameraConfig.orbitMinPolarAngle;

    // High-Clarity Balanced Lighting (Industry standard for automotive/robotics digital twins)
    this.ambientLight = new THREE.HemisphereLight('#ffffff', '#94a3b8', 1.0);
    this.sunLight = new THREE.DirectionalLight('#ffffff', 0.85);
    this.sunLight.position.set(60, 40, 100);
    this.scene.add(this.ambientLight, this.sunLight);
    this.scene.add(this.sunLight.target);

    // Ground Plane (Large and dynamic to cover any scenario coordinates)
    const groundGeo = new THREE.PlaneGeometry(60000, 60000);
    const groundMat = new THREE.MeshStandardMaterial({
      color: '#f8fafc',
      roughness: 0.95,
      metalness: 0.0,
    });
    this.ground = new THREE.Mesh(groundGeo, groundMat);
    this.ground.position.z = -0.1;
    this.scene.add(this.ground);

    // Add Scene Groups
    this.scene.add(
      this.roadGroup,
      this.markGroup,
      this.objectGroup,
      this.entityGroup,
      this.trailGroup
    );

    // Apply theme colors
    this.applyTheme(initialTheme);

    // Start Render Loop
    this.startLoop();
  }

  public getTheme(): ViewTheme {
    return this.currentTheme;
  }

  public setTheme(theme: ViewTheme) {
    this.currentTheme = theme;
    this.applyTheme(theme);
  }

  private applyTheme(theme: ViewTheme) {
    if (theme === VIEW_THEMES.LIGHT) {
      // Daylight sky & ground with distant fog beyond the scenario road bounds
      this.scene.background = new THREE.Color('#f8fafc');
      this.scene.fog = new THREE.Fog('#f8fafc', 800, 6000);
      (this.ground.material as THREE.MeshStandardMaterial).color.set('#f8fafc');
      this.ambientLight.color.set('#ffffff');
      this.ambientLight.groundColor.set('#94a3b8');
      this.ambientLight.intensity = 1.0;
      this.sunLight.intensity = 0.85;
    } else {
      // Night view with subtle celestial ambient
      this.scene.background = new THREE.Color('#0f172a');
      this.scene.fog = new THREE.Fog('#0f172a', 800, 6000);
      (this.ground.material as THREE.MeshStandardMaterial).color.set('#0b0f19');
      this.ambientLight.color.set('#bae6fd');
      this.ambientLight.groundColor.set('#0f172a');
      this.ambientLight.intensity = 0.75;
      this.sunLight.intensity = 0.7;
    }
  }

  public getFocusEntityData(): { position: THREE.Vector3; heading: number } | null {
    if (this.egoVehicleId !== null) {
      const egoGroup = this.entityMeshes.get(this.egoVehicleId);
      if (egoGroup) {
        return { position: egoGroup.position.clone(), heading: egoGroup.rotation.z };
      }
      const egoState = this.entityTargetStates.get(this.egoVehicleId);
      if (egoState) {
        return { position: new THREE.Vector3(egoState.x, egoState.y, egoState.z), heading: egoState.h };
      }
    }

    if (this.entityMeshes.size > 0) {
      const firstGroup = this.entityMeshes.values().next().value;
      if (firstGroup) {
        return { position: firstGroup.position.clone(), heading: firstGroup.rotation.z };
      }
    }

    if (this.entityTargetStates.size > 0) {
      const firstState = this.entityTargetStates.values().next().value;
      if (firstState) {
        return { position: new THREE.Vector3(firstState.x, firstState.y, firstState.z), heading: firstState.h };
      }
    }

    return null;
  }

  public getFocusPosition(): THREE.Vector3 | null {
    const data = this.getFocusEntityData();
    return data ? data.position : null;
  }

  public calculateHeadingAligned3DView(focusPos: THREE.Vector3, heading: number) {
    const behindDist = this.cameraConfig.orbitBehindDistance;
    const lateralDist = this.cameraConfig.orbitLateralDistance;
    const height = this.cameraConfig.orbitHeight;
    const lookAhead = this.cameraConfig.orbitLookAheadDistance;

    const cosH = Math.cos(heading);
    const sinH = Math.sin(heading);

    // Place camera behind and to the rear-quarter side relative to vehicle heading
    const camX = focusPos.x - cosH * behindDist + sinH * lateralDist;
    const camY = focusPos.y - sinH * behindDist - cosH * lateralDist;
    const camZ = focusPos.z + height;

    // Look ahead of vehicle in direction of travel so vehicle drives bottom -> up
    const targetX = focusPos.x + cosH * lookAhead;
    const targetY = focusPos.y + sinH * lookAhead;
    const targetZ = focusPos.z + 1.0;

    return {
      cameraPosition: new THREE.Vector3(camX, camY, camZ),
      cameraTarget: new THREE.Vector3(targetX, targetY, targetZ),
    };
  }

  public resetToDefaultView() {
    const focusData = this.getFocusEntityData();
    if (focusData) {
      const view = this.calculateHeadingAligned3DView(focusData.position, focusData.heading);
      this.defaultCameraTarget.copy(view.cameraTarget);
      this.defaultCameraPosition.copy(view.cameraPosition);
    }
    this.camera.up.set(0, 0, 1);
    this.controls.target.copy(this.defaultCameraTarget);
    this.camera.position.copy(this.defaultCameraPosition);
    this.camera.lookAt(this.controls.target);
    this.controls.enableRotate = true;
    this.controls.maxPolarAngle = this.cameraConfig.orbitMaxPolarAngle;
    this.controls.minPolarAngle = this.cameraConfig.orbitMinPolarAngle;
    this.controls.update();
    this.baselineDistance = this.camera.position.distanceTo(this.controls.target);
  }

  public setCameraMode(mode: CameraMode) {
    this.cameraMode = mode;
    const focusData = this.getFocusEntityData();
    const focusPos = focusData ? focusData.position : this.controls.target;
    const heading = focusData ? focusData.heading : 0;

    if (mode === CAMERA_MODES.ORBIT) {
      this.camera.up.set(0, 0, 1);
      this.controls.enabled = true;
      this.controls.enableRotate = true;
      this.controls.enablePan = true;
      this.controls.enableZoom = true;
      this.resetToDefaultView();
    } else if (mode === CAMERA_MODES.TOP_DOWN) {
      this.camera.up.set(Math.cos(heading), Math.sin(heading), 0);
      this.controls.enabled = true;
      this.controls.enableRotate = false;
      this.controls.enablePan = true;
      this.controls.enableZoom = true;
      this.controls.target.set(focusPos.x, focusPos.y, 0);
      this.camera.position.set(focusPos.x, focusPos.y, this.cameraConfig.topDownHeight);
      this.camera.lookAt(this.controls.target);
      this.controls.update();
    } else if (mode === CAMERA_MODES.FOLLOW_EGO) {
      this.camera.up.set(0, 0, 1);
      this.controls.enabled = false;
      const behindDist = this.cameraConfig.followOffsetDistance;
      const heightOffset = this.cameraConfig.followHeight;
      this.camera.position.set(
        focusPos.x - Math.cos(heading) * behindDist,
        focusPos.y - Math.sin(heading) * behindDist,
        focusPos.z + heightOffset
      );
      this.controls.target.set(
        focusPos.x + Math.cos(heading) * this.cameraConfig.followLookAheadDistance,
        focusPos.y + Math.sin(heading) * this.cameraConfig.followLookAheadDistance,
        focusPos.z + this.cameraConfig.followTargetHeight
      );
      this.camera.lookAt(this.controls.target);
    }
  }

  public centerCameraOnEntities(): boolean {
    const focusData = this.getFocusEntityData();
    if (!focusData) return false;

    const view = this.calculateHeadingAligned3DView(focusData.position, focusData.heading);
    this.defaultCameraTarget.copy(view.cameraTarget);
    this.defaultCameraPosition.copy(view.cameraPosition);

    if (this.cameraMode === CAMERA_MODES.ORBIT) {
      this.resetToDefaultView();
    }
    return true;
  }

  public setScenarioMetadata(metadata: ScenarioMetadata | null) {
    this.metadataCategoryMap.clear();
    if (metadata?.vehicles) {
      for (const v of metadata.vehicles) {
        this.metadataCategoryMap.set(v.name.toLowerCase().trim(), v.category.toLowerCase().trim());
      }
    }
    // Re-evaluate any already instantiated entities
    for (const [id, target] of this.entityTargetStates.entries()) {
      const newType = resolveEntityVisualType(target, this.metadataCategoryMap);
      if (this.entityVisualTypes.get(id) !== newType) {
        const oldGroup = this.entityMeshes.get(id);
        if (oldGroup) this.entityGroup.remove(oldGroup);
        const newGroup = this.createEntityMesh(target);
        this.entityMeshes.set(id, newGroup);
        this.entityVisualTypes.set(id, newType);
        this.entityGroup.add(newGroup);
      }
    }
  }

  public setRoadGeometry(roadGeometry: ScenarioRoadGeometry) {
    this.clearRoadScene();

    // 1. Build Lane Surfaces with elevated sidewalks and paver materials
    for (const surface of roadGeometry.lane_surfaces) {
      const zOffset = getLaneZOffset(surface.lane_type);
      const geo = createStripGeometry(surface.left_boundary, surface.right_boundary, zOffset);
      if (!geo) continue;

      const mat = new THREE.MeshStandardMaterial({
        color: getLaneColor(surface.lane_type),
        roughness: 0.95,
        metalness: 0.0,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geo, mat);
      this.roadGroup.add(mesh);
    }

    // 2. Build Road Marks (Pure bright white & yellow)
    for (const mark of roadGeometry.road_marks) {
      const mesh = createRoadMarkMesh(mark.points, mark.width, mark.color);
      if (mesh) {
        this.markGroup.add(mesh);
      }
    }

    // If no explicit road marks, generate fallback boundaries
    if (this.markGroup.children.length === 0) {
      const fallbackMarks = createFallbackBoundaryMarks(roadGeometry.lane_surfaces);
      for (const m of fallbackMarks) {
        this.markGroup.add(m);
      }
    }

    // 3. Build Road Feature Boxes / Objects (Crosswalks, buildings, trees, poles, barriers)
    for (const box of roadGeometry.road_feature_boxes) {
      const featureMesh = createRoadFeatureMesh(box);
      this.objectGroup.add(featureMesh);
    }

    // Center camera on road or existing entities
    if (!this.centerCameraOnEntities()) {
      this.centerCameraOnRoad();
    }
  }

  private centerCameraOnRoad() {
    const box = new THREE.Box3().setFromObject(this.roadGroup);
    if (!box.isEmpty()) {
      const center = new THREE.Vector3();
      box.getCenter(center);
      const size = new THREE.Vector3();
      box.getSize(size);

      // Clamp dimension so the camera doesn't zoom out into space for 10km highways
      const maxDim = Math.min(
        this.cameraConfig.maxBoundDimension,
        Math.max(size.x, size.y, this.cameraConfig.minBoundDimension)
      );

      let targetCenter = center;
      if (Math.max(size.x, size.y) > this.cameraConfig.maxBoundDimension) {
        // Center near the starting bounds rather than the center of a 10km highway
        targetCenter = new THREE.Vector3(box.min.x + maxDim * 0.5, box.min.y + maxDim * 0.5, 0);
      }

      this.defaultCameraTarget.copy(targetCenter);
      this.defaultCameraPosition.set(
        targetCenter.x + maxDim * this.cameraConfig.birdsEyeOffsetFactors.x,
        targetCenter.y + maxDim * this.cameraConfig.birdsEyeOffsetFactors.y,
        maxDim * this.cameraConfig.birdsEyeOffsetFactors.z
      );
    } else {
      this.defaultCameraTarget.set(
        this.cameraConfig.initialTarget.x,
        this.cameraConfig.initialTarget.y,
        this.cameraConfig.initialTarget.z
      );
      this.defaultCameraPosition.set(
        this.cameraConfig.initialPosition.x,
        this.cameraConfig.initialPosition.y,
        this.cameraConfig.initialPosition.z
      );
    }
    this.resetToDefaultView();
  }

  public updateFrame(frame: ScenarioFrame) {
    if (this.isDestroyed) return;

    const activeIds = new Set<number>();

    for (let i = 0; i < frame.object_states.length; i++) {
      const obj = frame.object_states[i];
      activeIds.add(obj.id);

      if (this.egoVehicleId === null || obj.name.toLowerCase().includes('ego')) {
        this.egoVehicleId = obj.id;
      }

      this.entityTargetStates.set(obj.id, obj);

      const resolvedType = resolveEntityVisualType(obj, this.metadataCategoryMap);
      let entityGroup = this.entityMeshes.get(obj.id);
      const prevType = this.entityVisualTypes.get(obj.id);

      if (!entityGroup || prevType !== resolvedType) {
        if (entityGroup) {
          this.entityGroup.remove(entityGroup);
          this.entityMeshes.delete(obj.id);
          const oldLabel = this.entityLabels.get(obj.id);
          if (oldLabel) {
            oldLabel.texture.dispose();
            (oldLabel.sprite.material as THREE.Material).dispose();
            this.entityLabels.delete(obj.id);
          }
        }
        entityGroup = this.createEntityMesh(obj);
        this.entityMeshes.set(obj.id, entityGroup);
        this.entityVisualTypes.set(obj.id, resolvedType);
        this.entityGroup.add(entityGroup);
      }

      // Update Floating Label
      this.updateVehicleLabel(obj);

      // Record trail points
      let trail = this.entityTrails.get(obj.id);
      if (!trail) {
        trail = [];
        this.entityTrails.set(obj.id, trail);
      }
      const newPos = new THREE.Vector3(obj.x, obj.y, obj.z + 0.05);
      if (trail.length === 0 || trail[trail.length - 1].distanceTo(newPos) > 0.4) {
        trail.push(newPos);
        if (trail.length > 300) trail.shift();
        this.updateTrailMesh(obj.id, trail);
      }
    }

    // Remove inactive entities
    for (const [id, group] of this.entityMeshes.entries()) {
      if (!activeIds.has(id)) {
        this.entityGroup.remove(group);
        this.entityMeshes.delete(id);
        this.entityVisualTypes.delete(id);
        this.entityTargetStates.delete(id);
        const labelObj = this.entityLabels.get(id);
        if (labelObj) {
          labelObj.texture.dispose();
          (labelObj.sprite.material as THREE.Material).dispose();
          this.entityLabels.delete(id);
        }
      }
    }

    // If entities were just loaded for the first time, center camera on them immediately
    if (frame.object_states.length > 0 && !this.hasFramedInitialEntity) {
      this.hasFramedInitialEntity = true;
      this.centerCameraOnEntities();
    }
  }

  public focusEntity(entityId: number) {
    const group = this.entityMeshes.get(entityId);
    if (!group) return;
    const pos = group.position;
    const heading = group.rotation.z;

    if (this.cameraMode === CAMERA_MODES.ORBIT) {
      const view = this.calculateHeadingAligned3DView(pos, heading);
      this.controls.target.copy(view.cameraTarget);
      this.camera.position.copy(view.cameraPosition);
    } else if (this.cameraMode === CAMERA_MODES.TOP_DOWN) {
      this.camera.up.set(Math.cos(heading), Math.sin(heading), 0);
      this.controls.target.set(pos.x, pos.y, 0);
      this.camera.position.set(pos.x, pos.y, this.cameraConfig.topDownHeight);
    } else if (this.cameraMode === CAMERA_MODES.FOLLOW_EGO) {
      const behindDist = this.cameraConfig.followOffsetDistance;
      const heightOffset = this.cameraConfig.followHeight;
      this.camera.position.set(
        pos.x - Math.cos(heading) * behindDist,
        pos.y - Math.sin(heading) * behindDist,
        pos.z + heightOffset
      );
      this.controls.target.set(
        pos.x + Math.cos(heading) * this.cameraConfig.followLookAheadDistance,
        pos.y + Math.sin(heading) * this.cameraConfig.followLookAheadDistance,
        pos.z + this.cameraConfig.followTargetHeight
      );
    }
    this.controls.update();
  }

  private createEntityMesh(obj: ScenarioObjectState): THREE.Group {
    const isEgo = obj.id === this.egoVehicleId || obj.name.toLowerCase().includes('ego');
    const group = createEntityMesh(obj, isEgo, this.metadataCategoryMap);

    const length = Math.max(1.0, obj.length || 2.0);
    const width = Math.max(0.6, obj.width || 1.0);
    const height = Math.max(1.0, obj.height || 1.5);

    // Ground Shadow Plate (for solid grounding)
    const shadowGeo = new THREE.PlaneGeometry(length * 1.15, width * 1.15);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: '#000000',
      transparent: true,
      opacity: 0.35,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.position.z = 0.02;
    group.add(shadow);

    // Create Floating Info Sprite Label
    const labelData = this.createLabelSprite(obj, isEgo);
    labelData.sprite.position.set(0, 0, height + 1.8);
    group.add(labelData.sprite);
    this.entityLabels.set(obj.id, labelData);

    // Set initial position & orientation
    group.position.set(obj.x, obj.y, obj.z);
    group.rotation.set(obj.r, obj.p, obj.h);

    return group;
  }

  private createLabelSprite(obj: ScenarioObjectState, isEgo: boolean) {
    const canvas = document.createElement('canvas');
    canvas.width = 280;
    canvas.height = 130;
    const ctx = canvas.getContext('2d')!;

    this.drawLabelCanvas(ctx, obj, isEgo);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const material = new THREE.SpriteMaterial({
      map: texture,
      depthTest: false,
      transparent: true,
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(4.8, 2.2, 1);

    return { sprite, canvas, texture };
  }

  private drawLabelCanvas(
    ctx: CanvasRenderingContext2D,
    obj: ScenarioObjectState,
    isEgo: boolean
  ) {
    ctx.clearRect(0, 0, 280, 130);

    const isTarget = !isEgo && (obj.name.toLowerCase().includes('cutin') || obj.name.toLowerCase().includes('target'));
    const bgColor = isEgo
      ? 'rgba(37, 99, 235, 0.95)'
      : isTarget
      ? 'rgba(220, 38, 38, 0.95)'
      : 'rgba(15, 23, 42, 0.92)';

    // Bubble Background
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(6, 6, 268, 118, 14);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Badge prefix
    const roleBadge = isEgo ? 'EGO' : isTarget ? 'TARGET' : `ID ${obj.id}`;

    // Text: Role & Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`[${roleBadge}] ${obj.name}`, 140, 36);

    // Text: Speed
    const speedKmh = (obj.speed * 3.6).toFixed(1);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px ui-monospace, monospace';
    ctx.fillText(`${speedKmh} km/h (${obj.speed.toFixed(1)} m/s)`, 140, 68);

    // Text: Frenet Station & Lane
    ctx.fillStyle = isEgo ? '#bfdbfe' : isTarget ? '#fecaca' : '#cbd5e1';
    ctx.font = '500 15px ui-monospace, monospace';
    const laneStr = obj.lane_id !== 0 ? `Ln ${obj.lane_id}` : `Ln -`;
    const stationStr = obj.s > 0 ? `s: ${obj.s.toFixed(1)}m` : `(${obj.x.toFixed(0)}, ${obj.y.toFixed(0)})`;
    ctx.fillText(`${laneStr}  •  ${stationStr}`, 140, 98);
  }

  private updateVehicleLabel(obj: ScenarioObjectState) {
    const labelData = this.entityLabels.get(obj.id);
    if (!labelData) return;

    const isEgo = obj.id === this.egoVehicleId || obj.name.toLowerCase().includes('ego');
    const ctx = labelData.canvas.getContext('2d');
    if (ctx) {
      this.drawLabelCanvas(ctx, obj, isEgo);
      labelData.texture.needsUpdate = true;
    }
  }

  private updateTrailMesh(entityId: number, points: THREE.Vector3[]) {
    if (points.length < 2) return;

    let trailLine = this.trailGroup.getObjectByName(`trail_${entityId}`) as THREE.Line;
    const positions = new Float32Array(points.length * 3);

    for (let i = 0; i < points.length; i++) {
      positions[i * 3 + 0] = points[i].x;
      positions[i * 3 + 1] = points[i].y;
      positions[i * 3 + 2] = points[i].z;
    }

    const isEgo = entityId === this.egoVehicleId;
    const trailColor = isEgo ? '#2563eb' : entityId % 2 === 0 ? '#ef4444' : '#f59e0b';

    if (!trailLine) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.LineBasicMaterial({
        color: trailColor,
        transparent: true,
        opacity: 0.85,
        linewidth: 3,
      });
      trailLine = new THREE.Line(geo, mat);
      trailLine.name = `trail_${entityId}`;
      this.trailGroup.add(trailLine);
    } else {
      trailLine.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      trailLine.geometry.attributes.position.needsUpdate = true;
    }
  }

  public resetSimulation() {
    this.entityTrails.clear();
    while (this.trailGroup.children.length > 0) {
      const child = this.trailGroup.children[0] as THREE.Line;
      child.geometry.dispose();
      (child.material as THREE.Material).dispose();
      this.trailGroup.remove(child);
    }
    if (!this.centerCameraOnEntities()) {
      this.centerCameraOnRoad();
    }
  }

  private clearRoadScene() {
    const disposeGroup = (grp: THREE.Group) => {
      while (grp.children.length > 0) {
        const obj = grp.children[0] as THREE.Mesh;
        if (obj.geometry) obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else if (obj.material) {
          obj.material.dispose();
        }
        grp.remove(obj);
      }
    };

    disposeGroup(this.roadGroup);
    disposeGroup(this.markGroup);
    disposeGroup(this.objectGroup);
    disposeGroup(this.entityGroup);
    disposeGroup(this.trailGroup);

    this.entityMeshes.clear();
    this.entityVisualTypes.clear();
    this.entityTargetStates.clear();
    this.entityTrails.clear();
    for (const l of this.entityLabels.values()) {
      l.texture.dispose();
      (l.sprite.material as THREE.Material).dispose();
    }
    this.entityLabels.clear();
    this.egoVehicleId = null;
    this.hasFramedInitialEntity = false;
  }

  private startLoop() {
    const animate = () => {
      if (this.isDestroyed) return;
      this.animationFrameId = requestAnimationFrame(animate);

      // Interpolate entity positions smoothly
      for (const [id, group] of this.entityMeshes.entries()) {
        const target = this.entityTargetStates.get(id);
        if (target) {
          group.position.lerp(new THREE.Vector3(target.x, target.y, target.z), 0.25);

          // Smooth rotation
          const targetEuler = new THREE.Euler(target.r, target.p, target.h, 'XYZ');
          const targetQuat = new THREE.Quaternion().setFromEuler(targetEuler);
          group.quaternion.slerp(targetQuat, 0.25);
        }
      }

      const egoGroup = this.egoVehicleId !== null ? this.entityMeshes.get(this.egoVehicleId) : null;
      const primaryGroup = egoGroup || (this.entityMeshes.size > 0 ? this.entityMeshes.values().next().value : null);

      if (primaryGroup) {
        const egoPos = primaryGroup.position;
        const egoHeading = primaryGroup.rotation.z;

        if (this.cameraMode === CAMERA_MODES.FOLLOW_EGO) {
          const behindDist = this.cameraConfig.followOffsetDistance;
          const heightOffset = this.cameraConfig.followHeight;
          const camX = egoPos.x - Math.cos(egoHeading) * behindDist;
          const camY = egoPos.y - Math.sin(egoHeading) * behindDist;
          const camZ = egoPos.z + heightOffset;

          this.camera.position.lerp(
            new THREE.Vector3(camX, camY, camZ),
            this.cameraConfig.followLerpFactor
          );
          this.controls.target.lerp(
            new THREE.Vector3(
              egoPos.x + Math.cos(egoHeading) * this.cameraConfig.followLookAheadDistance,
              egoPos.y + Math.sin(egoHeading) * this.cameraConfig.followLookAheadDistance,
              egoPos.z + this.cameraConfig.followTargetHeight
            ),
            this.cameraConfig.followLerpFactor
          );
        } else if (this.cameraMode === CAMERA_MODES.TOP_DOWN) {
          this.camera.up.set(Math.cos(egoHeading), Math.sin(egoHeading), 0);
          this.controls.target.lerp(
            new THREE.Vector3(egoPos.x, egoPos.y, 0),
            this.cameraConfig.topDownLerpFactor
          );
          this.camera.position.lerp(
            new THREE.Vector3(egoPos.x, egoPos.y, this.cameraConfig.topDownHeight),
            this.cameraConfig.topDownLerpFactor
          );
        } else if (this.cameraMode === CAMERA_MODES.ORBIT) {
          // In 3D (Orbit) mode: smoothly track ego target while preserving user orbit orientation & zoom
          const targetEgo = new THREE.Vector3(
            egoPos.x + Math.cos(egoHeading) * this.cameraConfig.orbitLookAheadDistance,
            egoPos.y + Math.sin(egoHeading) * this.cameraConfig.orbitLookAheadDistance,
            egoPos.z + 1.0
          );
          const targetDelta = targetEgo.clone().sub(this.controls.target).multiplyScalar(this.cameraConfig.orbitLerpFactor);
          this.controls.target.add(targetDelta);
          this.camera.position.add(targetDelta);
        }
      }

      // Update ground and sun light position to follow scene
      const focusTarget = this.controls.target;
      this.ground.position.x = focusTarget.x;
      this.ground.position.y = focusTarget.y;

      this.sunLight.position.set(focusTarget.x + 60, focusTarget.y + 40, focusTarget.z + 100);
      this.sunLight.target.position.set(focusTarget.x, focusTarget.y, focusTarget.z);
      this.sunLight.target.updateMatrixWorld();

      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  // ── Zoom & Angle API ──────────────────────────────────────────────

  private static readonly MIN_ZOOM_PERCENT = 10;
  private static readonly MAX_ZOOM_PERCENT = 500;
  private static readonly ZOOM_STEP_PERCENT = 10;

  public getZoomPercent(): number {
    if (this.baselineDistance <= 0) return 100;
    const currentDist = this.camera.position.distanceTo(this.controls.target);
    // Inverse: closer = higher zoom %
    return Math.round((this.baselineDistance / currentDist) * 100);
  }

  public setZoomPercent(percent: number): void {
    if (this.cameraMode === CAMERA_MODES.FOLLOW_EGO || this.baselineDistance <= 0) return;
    const clamped = Math.max(
      ScenarioRenderer.MIN_ZOOM_PERCENT,
      Math.min(ScenarioRenderer.MAX_ZOOM_PERCENT, percent)
    );
    const targetDist = this.baselineDistance / (clamped / 100);
    const direction = this.camera.position.clone().sub(this.controls.target).normalize();
    this.camera.position.copy(this.controls.target).addScaledVector(direction, targetDist);
    this.controls.update();
  }

  public zoomIn(): void {
    this.setZoomPercent(this.getZoomPercent() + ScenarioRenderer.ZOOM_STEP_PERCENT);
  }

  public zoomOut(): void {
    this.setZoomPercent(this.getZoomPercent() - ScenarioRenderer.ZOOM_STEP_PERCENT);
  }

  public getAngleDeg(): number {
    const azimuthal = this.controls.getAzimuthalAngle();
    // Convert from [-π, π] to [0°, 360°)
    const deg = ((azimuthal * 180) / Math.PI + 360) % 360;
    return Math.round(deg);
  }

  public setAngleDeg(deg: number): void {
    if (this.cameraMode === CAMERA_MODES.FOLLOW_EGO) return;
    const targetAzimuthal = (deg * Math.PI) / 180;
    const distance = this.camera.position.distanceTo(this.controls.target);
    const polar = this.controls.getPolarAngle();

    // Reposition camera at the new azimuthal angle, keeping polar angle and distance
    const sinP = Math.sin(polar);
    const cosP = Math.cos(polar);
    const sinA = Math.sin(targetAzimuthal);
    const cosA = Math.cos(targetAzimuthal);

    this.camera.position.set(
      this.controls.target.x + distance * sinP * sinA,
      this.controls.target.y + distance * sinP * cosA,
      this.controls.target.z + distance * cosP
    );
    this.controls.update();
  }

  public resetAngle(): void {
    if (this.cameraMode === CAMERA_MODES.ORBIT) {
      this.resetToDefaultView();
    } else {
      this.setAngleDeg(0);
    }
  }

  public getCanvas(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  public handleResize() {
    if (!this.container || this.isDestroyed) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public dispose() {
    this.isDestroyed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.clearRoadScene();
    this.renderer.dispose();
    this.controls.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
