import * as THREE from 'three';
import type { EntityVisualType, ScenarioObjectState } from '../types/simulation.ts';
export type { EntityVisualType };

// Shared material cache for high performance 60+ FPS rendering
const MATERIAL_CACHE = new Map<string, THREE.Material>();

function getOrCreateMaterial(
  key: string,
  factory: () => THREE.Material
): THREE.Material {
  let mat = MATERIAL_CACHE.get(key);
  if (!mat) {
    mat = factory();
    MATERIAL_CACHE.set(key, mat);
  }
  return mat;
}

const PALETTE = [
  '#dc2626', // Red
  '#d97706', // Amber
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#f43f5e', // Rose
  '#475569', // Slate
  '#ea580c', // Orange
];

export function getEntityColor(obj: ScenarioObjectState, isEgo: boolean): string {
  if (isEgo || obj.name.toLowerCase().includes('ego')) {
    return '#2563eb'; // Standard Cobalt Blue for Ego
  }
  const lowerName = obj.name.toLowerCase();
  if (
    lowerName.includes('cutin') ||
    lowerName.includes('target') ||
    lowerName.includes('lead') ||
    lowerName.includes('adversary')
  ) {
    return '#dc2626'; // Signal Red for primary adversary
  }
  return PALETTE[Math.abs(obj.id) % PALETTE.length];
}

export const ESMINI_OBJECT_TYPE = {
  NONE: 0,
  VEHICLE: 1,
  PEDESTRIAN: 2,
  MISC: 3,
} as const;

export function resolveEntityVisualType(
  obj: ScenarioObjectState,
  metadataCategoryMap?: Map<string, string>
): EntityVisualType {
  const name = (obj.name || '').toLowerCase().trim();
  const metaCat = metadataCategoryMap?.get(name)?.toLowerCase().trim() || '';

  // 1. Explicit OpenSCENARIO metadata category
  if (metaCat === 'pedestrian' || metaCat === 'walker' || metaCat === 'human') return 'pedestrian';
  if (metaCat === 'truck' || metaCat === 'semitrailer' || metaCat === 'trailer') return 'truck';
  if (metaCat === 'bus') return 'bus';
  if (metaCat === 'van') return 'van';
  if (metaCat === 'bicycle' || metaCat === 'bike') return 'bicycle';
  if (metaCat === 'motorbike' || metaCat === 'motorcycle') return 'motorcycle';
  if (metaCat === 'car') return 'car';

  // 2. Official esmini SE_ObjectType enum (1: Vehicle, 2: Pedestrian, 3: Misc)
  if (obj.object_type === ESMINI_OBJECT_TYPE.PEDESTRIAN) return 'pedestrian';
  if (obj.object_type === ESMINI_OBJECT_TYPE.MISC) return 'misc_obstacle';

  // 3. Pedestrian heuristics: keywords or human bounding dimensions
  if (
    name.includes('ped') ||
    name.includes('walk') ||
    name.includes('human') ||
    name.includes('person') ||
    (obj.width < 1.0 && obj.length < 1.0 && obj.height >= 1.2)
  ) {
    return 'pedestrian';
  }

  // 4. Commercial trucks and trailers
  if (
    name.includes('truck') ||
    name.includes('semi') ||
    name.includes('lorry') ||
    (obj.length >= 7.0 && obj.height >= 2.4)
  ) {
    return 'truck';
  }

  // 5. Buses, vans, cycles, and obstacles
  if (name.includes('bus') || obj.length >= 9.5) return 'bus';
  if (name.includes('van')) return 'van';
  if (name.includes('bike') || name.includes('bicycle')) return 'bicycle';
  if (name.includes('motorcycle') || name.includes('moto')) return 'motorcycle';
  if (name.includes('obstacle') || name.includes('barrier')) return 'misc_obstacle';

  return 'car';
}

function createWheelMesh(radius: number, width: number): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(radius, radius, width, 16);
  geo.rotateX(Math.PI / 2);
  const mat = getOrCreateMaterial('mat_rubber_wheel', () =>
    new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.85 })
  );
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  return mesh;
}

function addVehicleLights(
  group: THREE.Group,
  length: number,
  width: number,
  height: number
): void {
  const hlMat = getOrCreateMaterial('mat_headlight', () =>
    new THREE.MeshStandardMaterial({
      color: '#fef08a',
      emissive: '#fef08a',
      emissiveIntensity: 1.5,
    })
  );
  const tlMat = getOrCreateMaterial('mat_taillight', () =>
    new THREE.MeshStandardMaterial({
      color: '#ef4444',
      emissive: '#ef4444',
      emissiveIntensity: 1.5,
    })
  );
  const hlGeo = new THREE.BoxGeometry(0.12, width * 0.22, 0.14);

  const hlLeft = new THREE.Mesh(hlGeo, hlMat);
  hlLeft.position.set(length * 0.5, width * 0.32, height * 0.45);
  const hlRight = hlLeft.clone();
  hlRight.position.set(length * 0.5, -width * 0.32, height * 0.45);

  const tlLeft = new THREE.Mesh(hlGeo, tlMat);
  tlLeft.position.set(-length * 0.5, width * 0.32, height * 0.45);
  const tlRight = tlLeft.clone();
  tlRight.position.set(-length * 0.5, -width * 0.32, height * 0.45);

  group.add(hlLeft, hlRight, tlLeft, tlRight);
}

export function createPedestrianMesh(
  obj: ScenarioObjectState,
  isEgo: boolean
): THREE.Group {
  const group = new THREE.Group();
  const height = Math.max(1.4, obj.height || 1.75);
  const scale = height / 1.75;
  const color = getEntityColor(obj, isEgo);

  const skinMat = getOrCreateMaterial('mat_human_skin', () =>
    new THREE.MeshStandardMaterial({ color: '#fbcfe8', roughness: 0.6 })
  );
  const clothMat = getOrCreateMaterial(`mat_ped_${color}`, () =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.5 })
  );
  const pantsMat = getOrCreateMaterial('mat_human_pants', () =>
    new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.8 })
  );
  const shoeMat = getOrCreateMaterial('mat_human_shoe', () =>
    new THREE.MeshStandardMaterial({ color: '#09090b', roughness: 0.9 })
  );

  // 1. Head & Hair
  const headGeo = new THREE.SphereGeometry(0.11 * scale, 12, 10);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.set(0, 0, height - 0.11 * scale);
  head.castShadow = true;
  group.add(head);

  // 2. Torso / Jacket
  const torsoGeo = new THREE.BoxGeometry(0.24 * scale, 0.38 * scale, 0.55 * scale);
  const torso = new THREE.Mesh(torsoGeo, clothMat);
  torso.position.set(0, 0, height * 0.64);
  torso.castShadow = true;
  group.add(torso);

  // 3. Arms
  const armGeo = new THREE.BoxGeometry(0.1 * scale, 0.1 * scale, 0.48 * scale);
  const armLeft = new THREE.Mesh(armGeo, clothMat);
  armLeft.position.set(0, 0.24 * scale, height * 0.62);
  const armRight = new THREE.Mesh(armGeo, clothMat);
  armRight.position.set(0, -0.24 * scale, height * 0.62);
  armLeft.castShadow = true;
  armRight.castShadow = true;
  group.add(armLeft, armRight);

  // 4. Legs
  const legGeo = new THREE.BoxGeometry(0.13 * scale, 0.14 * scale, 0.65 * scale);
  const legLeft = new THREE.Mesh(legGeo, pantsMat);
  legLeft.position.set(0, 0.1 * scale, 0.38 * scale);
  const legRight = new THREE.Mesh(legGeo, pantsMat);
  legRight.position.set(0, -0.1 * scale, 0.38 * scale);
  legLeft.castShadow = true;
  legRight.castShadow = true;
  group.add(legLeft, legRight);

  // 5. Shoes (facing forward +X)
  const shoeGeo = new THREE.BoxGeometry(0.22 * scale, 0.13 * scale, 0.08 * scale);
  const shoeLeft = new THREE.Mesh(shoeGeo, shoeMat);
  shoeLeft.position.set(0.04 * scale, 0.1 * scale, 0.04 * scale);
  const shoeRight = new THREE.Mesh(shoeGeo, shoeMat);
  shoeRight.position.set(0.04 * scale, -0.1 * scale, 0.04 * scale);
  group.add(shoeLeft, shoeRight);

  return group;
}

export function createTruckMesh(
  obj: ScenarioObjectState,
  isEgo: boolean
): THREE.Group {
  const group = new THREE.Group();
  const width = Math.max(2.2, obj.width || 2.5);
  const length = Math.max(6.5, obj.length || 8.5);
  const height = Math.max(2.6, obj.height || 3.2);
  const bodyColor = getEntityColor(obj, isEgo);

  const cabLength = Math.min(2.5, length * 0.32);
  const cargoLength = length - cabLength - 0.25;

  const cabMat = getOrCreateMaterial(`mat_truck_cab_${bodyColor}`, () =>
    new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.3, metalness: 0.4 })
  );
  const cargoMat = getOrCreateMaterial('mat_truck_cargo', () =>
    new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.4, metalness: 0.2 })
  );
  const glassMat = getOrCreateMaterial('mat_tinted_glass', () =>
    new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.1, metalness: 0.9 })
  );

  // 1. Front Cab
  const cabGeo = new THREE.BoxGeometry(cabLength, width * 0.95, height * 0.72);
  const cab = new THREE.Mesh(cabGeo, cabMat);
  cab.position.set(length * 0.5 - cabLength * 0.5, 0, height * 0.46);
  cab.castShadow = true;
  group.add(cab);

  // 2. Cab Windshield
  const wsGeo = new THREE.BoxGeometry(0.08, width * 0.82, height * 0.26);
  const ws = new THREE.Mesh(wsGeo, glassMat);
  ws.position.set(length * 0.5 - 0.05, 0, height * 0.6);
  group.add(ws);

  // 3. Cargo Box Container
  const cargoGeo = new THREE.BoxGeometry(cargoLength, width, height * 0.85);
  const cargo = new THREE.Mesh(cargoGeo, cargoMat);
  cargo.position.set(-length * 0.5 + cargoLength * 0.5, 0, height * 0.54);
  cargo.castShadow = true;
  cargo.receiveShadow = true;
  group.add(cargo);

  // 4. Heavy Truck Wheels (6 wheels: 1 front axle, 2 rear dual axles)
  const wheelRadius = Math.min(0.5, height * 0.18);
  const wheelW = 0.32;
  const wheelOffsets = [
    [length * 0.5 - cabLength * 0.55, width * 0.5],
    [length * 0.5 - cabLength * 0.55, -width * 0.5],
    [-length * 0.5 + cargoLength * 0.5, width * 0.5],
    [-length * 0.5 + cargoLength * 0.5, -width * 0.5],
    [-length * 0.5 + cargoLength * 0.18, width * 0.5],
    [-length * 0.5 + cargoLength * 0.18, -width * 0.5],
  ];

  wheelOffsets.forEach(([x, y]) => {
    const wheel = createWheelMesh(wheelRadius, wheelW);
    wheel.position.set(x, y, wheelRadius);
    group.add(wheel);
  });

  // 5. Lights
  addVehicleLights(group, length, width, height);

  return group;
}

export function createCarMesh(
  obj: ScenarioObjectState,
  isEgo: boolean
): THREE.Group {
  const group = new THREE.Group();
  const width = Math.max(1.5, obj.width || 1.8);
  const length = Math.max(2.8, obj.length || 4.5);
  const height = Math.max(1.3, obj.height || 1.5);
  const bodyColor = getEntityColor(obj, isEgo);

  // 1. Lower Body Chassis
  const chassisGeo = new THREE.BoxGeometry(length, width, height * 0.55);
  const chassisMat = getOrCreateMaterial(`mat_car_chassis_${bodyColor}`, () =>
    new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.25, metalness: 0.5 })
  );
  const chassis = new THREE.Mesh(chassisGeo, chassisMat);
  chassis.position.z = height * 0.45;
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  group.add(chassis);

  // 2. Cabin / Tinted Glass
  const cabinGeo = new THREE.BoxGeometry(length * 0.55, width * 0.85, height * 0.45);
  const cabinMat = getOrCreateMaterial('mat_car_cabin', () =>
    new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.1, metalness: 0.9 })
  );
  const cabin = new THREE.Mesh(cabinGeo, cabinMat);
  cabin.position.set(-length * 0.08, 0, height * 0.85);
  cabin.castShadow = true;
  group.add(cabin);

  // 3. Wheels
  const wheelRadius = height * 0.25;
  const wheelWidth = 0.28;
  const wX = length * 0.32;
  const wY = width * 0.5;

  [[wX, wY], [wX, -wY], [-wX, wY], [-wX, -wY]].forEach(([x, y]) => {
    const wheel = createWheelMesh(wheelRadius, wheelWidth);
    wheel.position.set(x, y, wheelRadius);
    group.add(wheel);
  });

  // 4. Lights
  addVehicleLights(group, length, width, height);

  return group;
}

export function createBusMesh(
  obj: ScenarioObjectState,
  isEgo: boolean
): THREE.Group {
  const group = new THREE.Group();
  const width = Math.max(2.2, obj.width || 2.5);
  const length = Math.max(8.0, obj.length || 11.0);
  const height = Math.max(2.6, obj.height || 3.1);
  const color = getEntityColor(obj, isEgo);

  const busMat = getOrCreateMaterial(`mat_bus_${color}`, () =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.3 })
  );
  const glassMat = getOrCreateMaterial('mat_bus_glass', () =>
    new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.1, metalness: 0.85 })
  );

  // Body
  const bodyGeo = new THREE.BoxGeometry(length, width, height * 0.75);
  const body = new THREE.Mesh(bodyGeo, busMat);
  body.position.z = height * 0.52;
  body.castShadow = true;
  group.add(body);

  // Panoramic Window Strip
  const winGeo = new THREE.BoxGeometry(length * 0.92, width * 1.02, height * 0.32);
  const win = new THREE.Mesh(winGeo, glassMat);
  win.position.z = height * 0.68;
  group.add(win);

  // Wheels (4)
  const wheelRadius = height * 0.17;
  const wX = length * 0.35;
  const wY = width * 0.5;
  [[wX, wY], [wX, -wY], [-wX, wY], [-wX, -wY]].forEach(([x, y]) => {
    const wheel = createWheelMesh(wheelRadius, 0.3);
    wheel.position.set(x, y, wheelRadius);
    group.add(wheel);
  });

  addVehicleLights(group, length, width, height);
  return group;
}

export function createBikeMesh(
  obj: ScenarioObjectState,
  isEgo: boolean
): THREE.Group {
  const group = new THREE.Group();
  const length = Math.max(1.6, obj.length || 1.8);
  const height = Math.max(1.0, obj.height || 1.4);
  const color = getEntityColor(obj, isEgo);

  const frameMat = getOrCreateMaterial(`mat_bike_frame_${color}`, () =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.6 })
  );

  // 2 in-line wheels along X axis
  const wheelRadius = 0.32;
  const frontWheel = createWheelMesh(wheelRadius, 0.08);
  frontWheel.position.set(length * 0.38, 0, wheelRadius);
  const rearWheel = createWheelMesh(wheelRadius, 0.08);
  rearWheel.position.set(-length * 0.38, 0, wheelRadius);
  group.add(frontWheel, rearWheel);

  // Frame Bar
  const frameGeo = new THREE.BoxGeometry(length * 0.7, 0.06, 0.08);
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.position.set(0, 0, wheelRadius * 1.4);
  group.add(frame);

  // Minimalist Rider / Helmet
  const riderMat = getOrCreateMaterial('mat_bike_rider', () =>
    new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.6 })
  );
  const riderGeo = new THREE.BoxGeometry(0.3, 0.28, 0.45);
  const rider = new THREE.Mesh(riderGeo, riderMat);
  rider.position.set(-0.05, 0, height * 0.65);
  rider.castShadow = true;
  group.add(rider);

  const helmetGeo = new THREE.SphereGeometry(0.12, 10, 8);
  const helmet = new THREE.Mesh(helmetGeo, frameMat);
  helmet.position.set(0.02, 0, height * 0.9);
  helmet.castShadow = true;
  group.add(helmet);

  return group;
}

export function createEntityMesh(
  obj: ScenarioObjectState,
  isEgo: boolean,
  metadataCategoryMap?: Map<string, string>
): THREE.Group {
  const visualType = resolveEntityVisualType(obj, metadataCategoryMap);

  switch (visualType) {
    case 'pedestrian':
      return createPedestrianMesh(obj, isEgo);
    case 'truck':
      return createTruckMesh(obj, isEgo);
    case 'bus':
      return createBusMesh(obj, isEgo);
    case 'bicycle':
    case 'motorcycle':
      return createBikeMesh(obj, isEgo);
    case 'car':
    default:
      return createCarMesh(obj, isEgo);
  }
}
