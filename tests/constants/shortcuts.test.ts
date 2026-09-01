import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PLAYER_SHORTCUTS,
  getPreviousSpeed,
  getNextSpeed,
  getNextCameraMode,
} from '../../src/constants/shortcuts.ts';
import { CAMERA_MODES } from '../../src/renderer/types.ts';

describe('Player Shortcuts & Navigation Constants', () => {
  it('defines YouTube standard keys for playback controls', () => {
    assert.ok(PLAYER_SHORTCUTS.TOGGLE_PLAY.keys.includes('k'));
    assert.ok(PLAYER_SHORTCUTS.TOGGLE_PLAY.keys.includes(' '));

    assert.ok(PLAYER_SHORTCUTS.STEP_BACKWARD.keys.includes('j'));
    assert.ok(PLAYER_SHORTCUTS.STEP_BACKWARD.keys.includes('ArrowLeft'));

    assert.ok(PLAYER_SHORTCUTS.STEP_FORWARD.keys.includes('l'));
    assert.ok(PLAYER_SHORTCUTS.STEP_FORWARD.keys.includes('ArrowRight'));

    assert.ok(PLAYER_SHORTCUTS.STOP.keys.includes('s'));
    assert.ok(PLAYER_SHORTCUTS.STOP.keys.includes('0'));

    assert.ok(PLAYER_SHORTCUTS.RECORD.keys.includes('r'));
    assert.ok(PLAYER_SHORTCUTS.FULLSCREEN.keys.includes('f'));
  });

  it('cycles playback speeds smoothly with getPreviousSpeed and getNextSpeed', () => {
    // 0.5x -> 1x -> 2x -> 4x
    assert.equal(getNextSpeed(0.5), 1.0);
    assert.equal(getNextSpeed(1.0), 2.0);
    assert.equal(getNextSpeed(2.0), 4.0);
    assert.equal(getNextSpeed(4.0), 4.0); // Clamped at top speed

    assert.equal(getPreviousSpeed(4.0), 2.0);
    assert.equal(getPreviousSpeed(2.0), 1.0);
    assert.equal(getPreviousSpeed(1.0), 0.5);
    assert.equal(getPreviousSpeed(0.5), 0.5); // Clamped at lowest speed
  });

  it('cycles camera modes in order: Orbit -> Follow Ego -> Top Down -> Orbit', () => {
    assert.equal(getNextCameraMode(CAMERA_MODES.ORBIT), CAMERA_MODES.FOLLOW_EGO);
    assert.equal(getNextCameraMode(CAMERA_MODES.FOLLOW_EGO), CAMERA_MODES.TOP_DOWN);
    assert.equal(getNextCameraMode(CAMERA_MODES.TOP_DOWN), CAMERA_MODES.ORBIT);
  });
});
