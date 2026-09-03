import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveEntityVisualType,
  ESMINI_OBJECT_TYPE,
  createPedestrianMesh,
  createTruckMesh,
  createCarMesh,
  createBusMesh,
  createBikeMesh,
  createEntityMesh,
  getEntityColor,
} from '../../src/renderer/entityMeshBuilder.ts';
import {
  resolveRoadFeatureType,
  createCrosswalkMesh,
  createBuildingMesh,
  createTreeMesh,
  createPoleMesh,
  createBarrierMesh,
  createRoadFeatureMesh,
} from '../../src/renderer/roadFeatureMeshBuilder.ts';
import {
  getLaneColor,
  getLaneZOffset,
  SIDEWALK_CURB_Z_OFFSET,
  LANE_TYPE_MASKS,
} from '../../src/renderer/geometryUtils.ts';
import type { ScenarioObjectState, RoadFeatureBoxGeometry } from '../../src/types/simulation.ts';

function createDummyObject(partial: Partial<ScenarioObjectState>): ScenarioObjectState {
  return {
    name: 'test_obj',
    id: 1,
    model_id: 0,
    ctrl_type: 0,
    timestamp: 0,
    x: 0,
    y: 0,
    z: 0,
    h: 0,
    p: 0,
    r: 0,
    road_id: 1,
    junction_id: -1,
    t: 0,
    lane_id: 1,
    lane_offset: 0,
    s: 0,
    speed: 10,
    center_offset_x: 0,
    center_offset_y: 0,
    center_offset_z: 0,
    width: 1.8,
    length: 4.5,
    height: 1.5,
    object_type: 0,
    object_category: 0,
    has_ghost: false,
    sensor_x: 0,
    sensor_y: 0,
    sensor_z: 0,
    trail_x: 0,
    trail_y: 0,
    trail_z: 0,
    wheel_angle: 0,
    wheel_rot: 0,
    ...partial,
  };
}

function createDummyBox(partial: Partial<RoadFeatureBoxGeometry>): RoadFeatureBoxGeometry {
  return {
    road_id: 1,
    id: 1,
    name: 'box_1',
    type: 'object',
    kind: 'box',
    x: 10,
    y: 5,
    z: 0,
    h: 0,
    p: 0,
    r: 0,
    width: 2,
    length: 4,
    height: 2,
    ...partial,
  };
}

describe('Entity Mesh Builder & Visual Classification', () => {
  it('correctly classifies pedestrians by name, object_type, dimensions, and metadata', () => {
    // By name
    assert.equal(resolveEntityVisualType(createDummyObject({ name: 'pedestrian_cross' })), 'pedestrian');
    assert.equal(resolveEntityVisualType(createDummyObject({ name: 'walker_child' })), 'pedestrian');
    assert.equal(resolveEntityVisualType(createDummyObject({ name: 'human_adult' })), 'pedestrian');

    // By object_type (esmini SE_ObjectType: 1 = Vehicle, 2 = Pedestrian)
    assert.equal(resolveEntityVisualType(createDummyObject({ name: 'actor_1', object_type: ESMINI_OBJECT_TYPE.PEDESTRIAN })), 'pedestrian');
    assert.equal(resolveEntityVisualType(createDummyObject({ name: 'actor_2', object_type: ESMINI_OBJECT_TYPE.VEHICLE })), 'car');

    // By human dimensions
    assert.equal(
      resolveEntityVisualType(createDummyObject({ name: 'entity_x', width: 0.5, length: 0.5, height: 1.75 })),
      'pedestrian'
    );

    // By metadata category map
    const metaMap = new Map([['custom_agent', 'pedestrian']]);
    assert.equal(resolveEntityVisualType(createDummyObject({ name: 'custom_agent' }), metaMap), 'pedestrian');
  });

  it('correctly classifies commercial trucks by name, dimensions, and metadata', () => {
    assert.equal(resolveEntityVisualType(createDummyObject({ name: 'semi_truck_heavy' })), 'truck');
    assert.equal(resolveEntityVisualType(createDummyObject({ name: 'lorry_freight' })), 'truck');
    assert.equal(
      resolveEntityVisualType(createDummyObject({ name: 'transport', length: 8.5, height: 3.2 })),
      'truck'
    );

    const metaMap = new Map([['delivery_rig', 'truck']]);
    assert.equal(resolveEntityVisualType(createDummyObject({ name: 'delivery_rig' }), metaMap), 'truck');
  });

  it('correctly classifies buses, bicycles, motorcycles, and cars', () => {
    assert.equal(resolveEntityVisualType(createDummyObject({ name: 'city_bus_42' })), 'bus');
    assert.equal(resolveEntityVisualType(createDummyObject({ name: 'transit', length: 11.5 })), 'bus');
    assert.equal(resolveEntityVisualType(createDummyObject({ name: 'commuter_bike' })), 'bicycle');
    assert.equal(resolveEntityVisualType(createDummyObject({ name: 'motorcycle_ninja' })), 'motorcycle');
    assert.equal(resolveEntityVisualType(createDummyObject({ name: 'car_sedan' })), 'car');
    assert.equal(resolveEntityVisualType(createDummyObject({ name: 'ego' })), 'car');
  });

  it('assigns distinctive colors for Ego and adversary vehicles', () => {
    const egoObj = createDummyObject({ name: 'Ego_Vehicle', id: 0 });
    assert.equal(getEntityColor(egoObj, true), '#2563eb'); // Cobalt blue

    const advObj = createDummyObject({ name: 'Target_Adversary', id: 1 });
    assert.equal(getEntityColor(advObj, false), '#dc2626'); // Signal red
  });

  it('constructs a stylized human pedestrian 3D mesh with head, torso, arms, legs, and shoes', () => {
    const pedObj = createDummyObject({ name: 'ped_walker', height: 1.75, object_type: 1 });
    const meshGroup = createPedestrianMesh(pedObj, false);

    assert.equal(meshGroup.type, 'Group');
    // Head (1), Torso (1), Arms (2), Legs (2), Shoes (2) = 8 children
    assert.ok(meshGroup.children.length >= 7, 'Pedestrian should have at least 7 anatomical component meshes');
  });

  it('constructs a commercial truck with cab, windshield, cargo box container, 6 wheels, and lights', () => {
    const truckObj = createDummyObject({ name: 'heavy_truck', length: 8.5, width: 2.5, height: 3.2 });
    const meshGroup = createTruckMesh(truckObj, false);

    assert.equal(meshGroup.type, 'Group');
    // Cab, windshield, cargo box, 6 wheels, 4 lights = 13 children
    assert.ok(meshGroup.children.length >= 10, 'Truck should have cab, container, multi-axle wheels and lights');
  });

  it('creates cars, buses, and bikes cleanly through direct builders and dispatcher', () => {
    const directCar = createCarMesh(createDummyObject({ name: 'sedan_direct' }), false);
    assert.ok(directCar.children.length >= 4);

    const directBus = createBusMesh(createDummyObject({ name: 'bus_direct' }), false);
    assert.ok(directBus.children.length >= 4);

    const directBike = createBikeMesh(createDummyObject({ name: 'bike_direct' }), false);
    assert.ok(directBike.children.length >= 3);

    const carGroup = createEntityMesh(createDummyObject({ name: 'sedan_0' }), false);
    assert.ok(carGroup.children.length >= 4);

    const busGroup = createEntityMesh(createDummyObject({ name: 'metro_bus' }), false);
    assert.ok(busGroup.children.length >= 4);

    const bikeGroup = createEntityMesh(createDummyObject({ name: 'bicycle_rider' }), false);
    assert.ok(bikeGroup.children.length >= 3);
  });
});

describe('Road Feature & Street Walk Builders', () => {
  it('correctly classifies crosswalks, buildings, trees, poles, and barriers', () => {
    assert.equal(resolveRoadFeatureType(createDummyBox({ name: 'zebra_crosswalk' })), 'crosswalk');
    assert.equal(resolveRoadFeatureType(createDummyBox({ type: 'streetwalk' })), 'crosswalk');
    assert.equal(resolveRoadFeatureType(createDummyBox({ name: 'office_building' })), 'building');
    assert.equal(resolveRoadFeatureType(createDummyBox({ height: 8.0, width: 6.0 })), 'building');
    assert.equal(resolveRoadFeatureType(createDummyBox({ name: 'pine_tree' })), 'tree');
    assert.equal(resolveRoadFeatureType(createDummyBox({ name: 'street_lamp_post' })), 'pole');
    assert.equal(resolveRoadFeatureType(createDummyBox({ name: 'highway_guardrail' })), 'barrier');
    assert.equal(resolveRoadFeatureType(createDummyBox({ name: 'unknown_debris' })), 'obstacle');
  });

  it('creates high-visibility zebra stripes and tactile edges for crosswalks', () => {
    const box = createDummyBox({ name: 'crosswalk_main', width: 4.0, length: 6.0, height: 0.05 });
    const crosswalkGroup = createCrosswalkMesh(box);

    assert.equal(crosswalkGroup.type, 'Group');
    assert.ok(crosswalkGroup.children.length >= 4, 'Crosswalk should have base pad, zebra stripes, and tactile borders');
  });

  it('creates multi-story architectural buildings with facade, window strips, and roof parapet', () => {
    const box = createDummyBox({ name: 'city_hall_building', width: 10.0, length: 12.0, height: 9.0 });
    const buildingGroup = createBuildingMesh(box);

    assert.equal(buildingGroup.type, 'Group');
    assert.ok(buildingGroup.children.length >= 3, 'Building should have facade, window bands, and rooftop parapet');
  });

  it('generates trees, poles, and barriers properly', () => {
    const tree = createTreeMesh(createDummyBox({ name: 'oak_tree' }));
    assert.ok(tree.children.length >= 2, 'Tree should have trunk and canopy');

    const pole = createPoleMesh(createDummyBox({ name: 'lamp_pole' }));
    assert.ok(pole.children.length >= 2, 'Pole should have post and lamp fixture');

    const barrier = createBarrierMesh(createDummyBox({ name: 'guardrail_sec' }));
    assert.ok(barrier.children.length >= 1, 'Barrier should have rail mesh');
  });

  it('elevates street walk / sidewalk lanes with curb height offset and clean paver materials', () => {
    // Sidewalk lane color
    const sidewalkColor = getLaneColor(LANE_TYPE_MASKS.SIDEWALK);
    assert.equal(sidewalkColor, '#cbd5e1');

    // Sidewalk curb elevation offset
    const sidewalkZOffset = getLaneZOffset(LANE_TYPE_MASKS.SIDEWALK);
    assert.equal(sidewalkZOffset, SIDEWALK_CURB_Z_OFFSET);
    assert.equal(sidewalkZOffset, 0.08);

    // Normal driving lane is at z = 0
    const drivingZOffset = getLaneZOffset(LANE_TYPE_MASKS.DRIVING);
    assert.equal(drivingZOffset, 0);
  });

  it('createRoadFeatureMesh dispatches and positions feature boxes in 3D world space', () => {
    const box = createDummyBox({ name: 'crossing_1', x: 25, y: -10, z: 0.5, height: 0.1 });
    const group = createRoadFeatureMesh(box);

    assert.equal(group.position.x, 25);
    assert.equal(group.position.y, -10);
    assert.ok(group.position.z > 0.5);
  });
});
