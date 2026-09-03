import { CAMERA_MODES, type CameraMode } from '../renderer/types';
import { PLAYBACK_SPEEDS } from './playback';

/**
 * YouTube-style keyboard shortcut keys and action descriptors.
 */
export const PLAYER_SHORTCUTS = {
  TOGGLE_PLAY: {
    keys: ['k', ' '],
    displayKeys: ['k', 'Space'],
    description: 'Play / Pause',
  },
  STEP_BACKWARD: {
    keys: ['j', 'ArrowLeft'],
    displayKeys: ['j', '←'],
    description: 'Step Backward',
  },
  STEP_FORWARD: {
    keys: ['l', 'ArrowRight'],
    displayKeys: ['l', '→'],
    description: 'Step Forward',
  },
  STOP: {
    keys: ['s', '0', 'Home'],
    displayKeys: ['s', '0'],
    description: 'Stop / Reset to Start',
  },
  RECORD: {
    keys: ['r', 'R'],
    displayKeys: ['r'],
    description: 'Toggle MP4 Recording',
  },
  FULLSCREEN: {
    keys: ['f', 'F'],
    displayKeys: ['f'],
    description: 'Toggle Fullscreen',
  },
  SPEED_DECREASE: {
    keys: ['<', ','],
    displayKeys: ['<'],
    description: 'Decrease Playback Speed',
  },
  SPEED_INCREASE: {
    keys: ['>', '.'],
    displayKeys: ['>'],
    description: 'Increase Playback Speed',
  },
  CYCLE_CAMERA: {
    keys: ['c', 'C'],
    displayKeys: ['c'],
    description: 'Cycle Camera View Mode',
  },
  RESET_CAMERA_ANGLE: {
    keys: ['a', 'A'],
    displayKeys: ['a'],
    description: 'Reset Camera Angle to 0°',
  },
  ZOOM_IN: {
    keys: ['+', '='],
    displayKeys: ['+'],
    description: 'Zoom In',
  },
  ZOOM_OUT: {
    keys: ['-', '_'],
    displayKeys: ['-'],
    description: 'Zoom Out',
  },
} as const;

/**
 * Cycle through available playback speeds to the previous slower speed.
 */
export function getPreviousSpeed(currentSpeed: number): number {
  const currentIndex = PLAYBACK_SPEEDS.indexOf(currentSpeed as (typeof PLAYBACK_SPEEDS)[number]);
  if (currentIndex <= 0) {
    return PLAYBACK_SPEEDS[0];
  }
  return PLAYBACK_SPEEDS[currentIndex - 1];
}

/**
 * Cycle through available playback speeds to the next faster speed.
 */
export function getNextSpeed(currentSpeed: number): number {
  const currentIndex = PLAYBACK_SPEEDS.indexOf(currentSpeed as (typeof PLAYBACK_SPEEDS)[number]);
  if (currentIndex === -1 || currentIndex >= PLAYBACK_SPEEDS.length - 1) {
    return PLAYBACK_SPEEDS[PLAYBACK_SPEEDS.length - 1];
  }
  return PLAYBACK_SPEEDS[currentIndex + 1];
}

const CAMERA_MODE_CYCLE: readonly CameraMode[] = [
  CAMERA_MODES.ORBIT,
  CAMERA_MODES.FOLLOW_EGO,
  CAMERA_MODES.TOP_DOWN,
];

/**
 * Cycle to the next camera perspective mode.
 */
export function getNextCameraMode(currentMode: CameraMode): CameraMode {
  const currentIndex = CAMERA_MODE_CYCLE.indexOf(currentMode);
  if (currentIndex === -1) {
    return CAMERA_MODE_CYCLE[0];
  }
  const nextIndex = (currentIndex + 1) % CAMERA_MODE_CYCLE.length;
  return CAMERA_MODE_CYCLE[nextIndex];
}
