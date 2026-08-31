import * as THREE from 'three';
import { RoadGeometryPoint, LaneSurfaceGeometry } from '../types/simulation';

export const ROAD_MARK_Z_OFFSET = 0.025;

export const LANE_TYPE_MASKS = {
  NONE: 1 << 0,
  DRIVING: 1 << 1,
  STOP: 1 << 2,
  SHOULDER: 1 << 3,
  BIKING: 1 << 4,
  SIDEWALK: 1 << 5,
  BORDER: 1 << 6,
  RESTRICTED: 1 << 7,
  PARKING: 1 << 8,
  BIDIRECTIONAL: 1 << 9,
  MEDIAN: 1 << 10,
  SPECIAL1: 1 << 11,
  SPECIAL2: 1 << 12,
  SPECIAL3: 1 << 13,
  ROADWORKS: 1 << 14,
  TRAM: 1 << 15,
  RAIL: 1 << 16,
  ENTRY: 1 << 17,
  EXIT: 1 << 18,
  OFFRAMP: 1 << 19,
  ONRAMP: 1 << 20,
  CONNECTINGRAMP: 1 << 21,
};

export function getLaneColor(laneType: number): string {
  if (laneType & LANE_TYPE_MASKS.SIDEWALK) return '#8c9199';
  if (laneType & LANE_TYPE_MASKS.SHOULDER) return '#3a3d42';
  if (laneType & LANE_TYPE_MASKS.BORDER) return '#444850';
  if (laneType & LANE_TYPE_MASKS.MEDIAN) return '#505660';
  if (laneType & LANE_TYPE_MASKS.BIKING) return '#34495e';
  if (laneType & LANE_TYPE_MASKS.PARKING) return '#3d4148';
  return '#26292e'; // default driving lane asphalt
}

export function getRoadMarkColor(colorStr: string): string {
  const c = String(colorStr || '').toLowerCase();
  if (c.includes('yellow')) return '#f59e0b';
  if (c.includes('red')) return '#ef4444';
  if (c.includes('green')) return '#10b981';
  if (c.includes('blue')) return '#3b82f6';
  return '#f8fafc'; // default white road mark
}

export function createStripGeometry(
  leftBoundary: RoadGeometryPoint[],
  rightBoundary: RoadGeometryPoint[],
  zOffset: number = 0
): THREE.BufferGeometry | null {
  const count = Math.min(leftBoundary.length, rightBoundary.length);
  if (count < 2) return null;

  const positions = new Float32Array(count * 2 * 3);
  const indices: number[] = [];

  for (let i = 0; i < count; i++) {
    const left = leftBoundary[i];
    const right = rightBoundary[i];
    const base = i * 6;

    positions[base + 0] = left.x;
    positions[base + 1] = left.y;
    positions[base + 2] = left.z + zOffset;

    positions[base + 3] = right.x;
    positions[base + 4] = right.y;
    positions[base + 5] = right.z + zOffset;

    if (i < count - 1) {
      const start = i * 2;
      indices.push(start, start + 1, start + 2);
      indices.push(start + 1, start + 3, start + 2);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createRoadMarkMesh(
  points: RoadGeometryPoint[],
  width: number = 0.15,
  colorStr: string = 'white'
): THREE.Mesh | null {
  if (!points || points.length < 2) return null;

  const halfWidth = Math.max(0.06, width / 2);
  const leftBoundary: RoadGeometryPoint[] = [];
  const rightBoundary: RoadGeometryPoint[] = [];

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    let heading = pt.h;

    // Estimate heading from neighbors if zero
    if (heading === 0 && points.length > 1) {
      if (i < points.length - 1) {
        const next = points[i + 1];
        heading = Math.atan2(next.y - pt.y, next.x - pt.x);
      } else {
        const prev = points[i - 1];
        heading = Math.atan2(pt.y - prev.y, pt.x - prev.x);
      }
    }

    const perpX = -Math.sin(heading) * halfWidth;
    const perpY = Math.cos(heading) * halfWidth;

    leftBoundary.push({
      ...pt,
      x: pt.x + perpX,
      y: pt.y + perpY,
    });

    rightBoundary.push({
      ...pt,
      x: pt.x - perpX,
      y: pt.y - perpY,
    });
  }

  const geometry = createStripGeometry(leftBoundary, rightBoundary, ROAD_MARK_Z_OFFSET);
  if (!geometry) return null;

  const material = new THREE.MeshStandardMaterial({
    color: getRoadMarkColor(colorStr),
    roughness: 0.8,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });

  return new THREE.Mesh(geometry, material);
}

export function createFallbackBoundaryMarks(
  laneSurfaces: LaneSurfaceGeometry[]
): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = [];

  for (const surface of laneSurfaces) {
    if (surface.road_edge) {
      const boundary = surface.lane_id > 0 ? surface.right_boundary : surface.left_boundary;
      const mesh = createRoadMarkMesh(boundary, 0.2, 'white');
      if (mesh) meshes.push(mesh);
    }
  }

  return meshes;
}
