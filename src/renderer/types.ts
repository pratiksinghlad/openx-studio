export const CAMERA_MODES = {
  ORBIT: 'ORBIT',
  FOLLOW_EGO: 'FOLLOW_EGO',
  TOP_DOWN: 'TOP_DOWN',
} as const;

export type CameraMode = (typeof CAMERA_MODES)[keyof typeof CAMERA_MODES];

export const VIEW_THEMES = {
  LIGHT: 'LIGHT',
  DARK: 'DARK',
} as const;

export type ViewTheme = (typeof VIEW_THEMES)[keyof typeof VIEW_THEMES];

export interface CameraConfig {
  fov: number;
  near: number;
  far: number;
  initialPosition: { x: number; y: number; z: number };
  initialTarget: { x: number; y: number; z: number };
  birdsEyeOffsetFactors: { x: number; y: number; z: number };
  minBoundDimension: number;
  maxBoundDimension: number;
  orbitMaxPolarAngle: number;
  orbitMinPolarAngle: number;
  topDownMaxPolarAngle: number;
  topDownMinPolarAngle: number;
  topDownHeight: number;
  topDownLerpFactor: number;
  followOffsetDistance: number;
  followHeight: number;
  followLookAheadDistance: number;
  followTargetHeight: number;
  followLerpFactor: number;
  dampingFactor: number;
  orbitBehindDistance: number;
  orbitLateralDistance: number;
  orbitHeight: number;
  orbitLookAheadDistance: number;
  orbitLerpFactor: number;
}

export const DEFAULT_CAMERA_CONFIG: CameraConfig = {
  fov: 50,
  near: 0.1,
  far: 20000,
  initialPosition: { x: 28, y: 14, z: 16 },
  initialTarget: { x: 0, y: 0, z: 1 },
  birdsEyeOffsetFactors: { x: -0.45, y: -0.45, z: 0.4 },
  minBoundDimension: 25,
  maxBoundDimension: 100,
  orbitMaxPolarAngle: Math.PI / 2 - 0.02,
  orbitMinPolarAngle: 0.0,
  topDownMaxPolarAngle: 0.01,
  topDownMinPolarAngle: 0.0,
  topDownHeight: 70,
  topDownLerpFactor: 0.1,
  followOffsetDistance: 14,
  followHeight: 6,
  followLookAheadDistance: 8,
  followTargetHeight: 1.2,
  followLerpFactor: 0.1,
  dampingFactor: 0.08,
  orbitBehindDistance: 28,
  orbitLateralDistance: 14,
  orbitHeight: 16,
  orbitLookAheadDistance: 8,
  orbitLerpFactor: 0.12,
};
