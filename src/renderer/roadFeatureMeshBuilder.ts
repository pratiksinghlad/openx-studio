import * as THREE from 'three';
import type { RoadFeatureBoxGeometry, RoadFeatureVisualType } from '../types/simulation.ts';

const FEATURE_MATERIAL_CACHE = new Map<string, THREE.Material>();

function getFeatureMaterial(
  key: string,
  factory: () => THREE.Material
): THREE.Material {
  let mat = FEATURE_MATERIAL_CACHE.get(key);
  if (!mat) {
    mat = factory();
    FEATURE_MATERIAL_CACHE.set(key, mat);
  }
  return mat;
}

export function resolveRoadFeatureType(
  box: RoadFeatureBoxGeometry
): RoadFeatureVisualType {
  const desc = (box.name + ' ' + box.type + ' ' + box.kind).toLowerCase();

  if (
    desc.includes('crosswalk') ||
    desc.includes('streetwalk') ||
    desc.includes('walkway') ||
    desc.includes('pedestrian') ||
    desc.includes('zebra') ||
    desc.includes('crossing')
  ) {
    return 'crosswalk';
  }

  if (
    desc.includes('building') ||
    desc.includes('house') ||
    desc.includes('structure') ||
    desc.includes('facility') ||
    desc.includes('garage') ||
    (box.height >= 3.0 && box.width >= 3.0)
  ) {
    return 'building';
  }

  if (desc.includes('pole') || desc.includes('lamp') || desc.includes('light')) {
    return 'pole';
  }
  if (desc.includes('barrier') || desc.includes('guardrail') || desc.includes('fence')) {
    return 'barrier';
  }
  if (/(^|[^a-z])(tree|vegetation|plant|bush)([^a-z]|$)/i.test(desc) || desc.includes('tree_') || desc.startsWith('tree')) {
    return 'tree';
  }

  return 'obstacle';
}

export function createCrosswalkMesh(box: RoadFeatureBoxGeometry): THREE.Group {
  const group = new THREE.Group();
  const width = Math.max(2.0, box.width);
  const length = Math.max(3.0, box.length);
  const height = Math.max(0.04, box.height || 0.04);

  // 1. Base dark pavement pad
  const baseGeo = new THREE.BoxGeometry(length, width, height);
  const baseMat = getFeatureMaterial('mat_crosswalk_base', () =>
    new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.9 })
  );
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // 2. White zebra stripes (spaced across width)
  const stripeWidth = 0.45;
  const stripeGap = 0.45;
  const stripePitch = stripeWidth + stripeGap;
  const stripeCount = Math.floor(width / stripePitch);
  const stripeMat = getFeatureMaterial('mat_crosswalk_stripe', () =>
    new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.7 })
  );

  const startY = -(stripeCount - 1) * stripePitch * 0.5;
  for (let i = 0; i < stripeCount; i++) {
    const sGeo = new THREE.BoxGeometry(length * 0.92, stripeWidth, 0.02);
    const sMesh = new THREE.Mesh(sGeo, stripeMat);
    sMesh.position.set(0, startY + i * stripePitch, height * 0.5 + 0.01);
    sMesh.receiveShadow = true;
    group.add(sMesh);
  }

  // 3. Tactile warning edge bars on sidewalk curb interfaces
  const tactileMat = getFeatureMaterial('mat_tactile_edge', () =>
    new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.8 })
  );
  [-length * 0.48, length * 0.48].forEach((x) => {
    const tGeo = new THREE.BoxGeometry(0.2, width * 0.95, 0.025);
    const tMesh = new THREE.Mesh(tGeo, tactileMat);
    tMesh.position.set(x, 0, height * 0.5 + 0.012);
    group.add(tMesh);
  });

  return group;
}

export function createBuildingMesh(box: RoadFeatureBoxGeometry): THREE.Group {
  const group = new THREE.Group();
  const width = Math.max(3.0, box.width);
  const length = Math.max(3.0, box.length);
  const height = Math.max(3.5, box.height);

  // 1. Main Facade Body
  const facadeGeo = new THREE.BoxGeometry(length, width, height);
  const facadeMat = getFeatureMaterial('mat_building_facade', () =>
    new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.7, metalness: 0.1 })
  );
  const facadeMesh = new THREE.Mesh(facadeGeo, facadeMat);
  facadeMesh.castShadow = true;
  facadeMesh.receiveShadow = true;
  group.add(facadeMesh);

  // 2. Horizontal Window Glass Bands (Multi-story look)
  const floorHeight = 3.0;
  const numFloors = Math.max(1, Math.floor(height / floorHeight));
  const glassMat = getFeatureMaterial('mat_building_glass', () =>
    new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.1, metalness: 0.85 })
  );

  for (let f = 1; f <= numFloors; f++) {
    const bandGeo = new THREE.BoxGeometry(length * 1.01, width * 1.01, 1.1);
    const bandMesh = new THREE.Mesh(bandGeo, glassMat);
    const zPos = -height * 0.5 + f * (height / (numFloors + 1));
    bandMesh.position.set(0, 0, zPos);
    group.add(bandMesh);
  }

  // 3. Rooftop Parapet and Service Structure
  const roofBoxGeo = new THREE.BoxGeometry(length * 0.35, width * 0.35, 1.2);
  const roofMat = getFeatureMaterial('mat_building_roof', () =>
    new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.8 })
  );
  const roofBox = new THREE.Mesh(roofBoxGeo, roofMat);
  roofBox.position.set(0, 0, height * 0.5 + 0.6);
  roofBox.castShadow = true;
  group.add(roofBox);

  return group;
}

export function createTreeMesh(box: RoadFeatureBoxGeometry): THREE.Group {
  const group = new THREE.Group();
  const height = Math.max(3.0, box.height || 4.5);
  const canopyRadius = Math.max(1.2, (box.width + box.length) * 0.25);

  // Trunk
  const trunkHeight = height * 0.45;
  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.28, trunkHeight, 8);
  trunkGeo.rotateX(Math.PI / 2);
  const trunkMat = getFeatureMaterial('mat_tree_trunk', () =>
    new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.9 })
  );
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.set(0, 0, trunkHeight * 0.5);
  trunk.castShadow = true;
  group.add(trunk);

  // Canopy (Layered Low-Poly Cones)
  const foliageMat = getFeatureMaterial('mat_tree_foliage', () =>
    new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.6 })
  );
  const coneGeo = new THREE.ConeGeometry(canopyRadius, height * 0.65, 8);
  coneGeo.rotateX(Math.PI / 2);
  const canopy = new THREE.Mesh(coneGeo, foliageMat);
  canopy.position.set(0, 0, trunkHeight + height * 0.32);
  canopy.castShadow = true;
  group.add(canopy);

  return group;
}

export function createPoleMesh(box: RoadFeatureBoxGeometry): THREE.Group {
  const group = new THREE.Group();
  const height = Math.max(4.0, box.height || 6.0);

  const poleMat = getFeatureMaterial('mat_metal_pole', () =>
    new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.3, metalness: 0.8 })
  );
  const lampMat = getFeatureMaterial('mat_lamp_fixture', () =>
    new THREE.MeshStandardMaterial({
      color: '#fef08a',
      emissive: '#fef08a',
      emissiveIntensity: 1.2,
    })
  );

  // Vertical Post
  const poleGeo = new THREE.CylinderGeometry(0.1, 0.14, height, 8);
  poleGeo.rotateX(Math.PI / 2);
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.set(0, 0, height * 0.5);
  pole.castShadow = true;
  group.add(pole);

  // Horizontal Arm & Fixture
  const armGeo = new THREE.BoxGeometry(1.2, 0.1, 0.1);
  const arm = new THREE.Mesh(armGeo, poleMat);
  arm.position.set(0.6, 0, height - 0.1);
  const headGeo = new THREE.BoxGeometry(0.35, 0.2, 0.15);
  const head = new THREE.Mesh(headGeo, lampMat);
  head.position.set(1.1, 0, height - 0.15);
  group.add(arm, head);

  return group;
}

export function createBarrierMesh(box: RoadFeatureBoxGeometry): THREE.Group {
  const group = new THREE.Group();
  const width = Math.max(0.3, box.width);
  const length = Math.max(2.0, box.length);
  const height = Math.max(0.6, box.height);

  const railMat = getFeatureMaterial('mat_barrier_rail', () =>
    new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.3, metalness: 0.7 })
  );
  const railGeo = new THREE.BoxGeometry(length, width, height * 0.6);
  const rail = new THREE.Mesh(railGeo, railMat);
  rail.position.set(0, 0, height * 0.6);
  rail.castShadow = true;
  group.add(rail);

  return group;
}

export function createObstacleMesh(box: RoadFeatureBoxGeometry): THREE.Group {
  const group = new THREE.Group();
  const width = Math.max(0.5, box.width);
  const length = Math.max(0.5, box.length);
  const height = Math.max(0.5, box.height);

  const mat = getFeatureMaterial('mat_road_obstacle', () =>
    new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.5, metalness: 0.2 })
  );
  const geo = new THREE.BoxGeometry(length, width, height);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  return group;
}

export function createRoadFeatureMesh(box: RoadFeatureBoxGeometry): THREE.Group {
  const featureType = resolveRoadFeatureType(box);
  let featureGroup: THREE.Group;

  switch (featureType) {
    case 'crosswalk':
      featureGroup = createCrosswalkMesh(box);
      break;
    case 'building':
      featureGroup = createBuildingMesh(box);
      break;
    case 'tree':
      featureGroup = createTreeMesh(box);
      break;
    case 'pole':
      featureGroup = createPoleMesh(box);
      break;
    case 'barrier':
      featureGroup = createBarrierMesh(box);
      break;
    case 'obstacle':
    default:
      featureGroup = createObstacleMesh(box);
      break;
  }

  featureGroup.position.set(box.x, box.y, box.z + Math.max(0.5, box.height) / 2);
  featureGroup.rotation.set(box.r, box.p, box.h);
  return featureGroup;
}
