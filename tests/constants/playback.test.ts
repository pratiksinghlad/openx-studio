import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_STEP_INTERVAL_SECONDS,
  FIXED_SIMULATION_DT,
  BASE_PLAYBACK_INTERVAL_MS,
  MIN_SCENARIO_DURATION_SECONDS,
  FALLBACK_SCENARIO_DURATION_SECONDS,
  PLAYBACK_SPEEDS,
  MIN_PLAYBACK_SPEED,
  MAX_PLAYBACK_SPEED,
  formatTime,
} from '../../src/constants/playback.ts';

describe('Playback and Simulation Constants', () => {
  it('defines the default step forward and backward interval as 2 seconds', () => {
    assert.equal(DEFAULT_STEP_INTERVAL_SECONDS, 2.0);
  });

  it('defines 20Hz simulation fixed delta time', () => {
    assert.equal(FIXED_SIMULATION_DT, 0.05);
  });

  it('defines sensible base interval and duration bounds', () => {
    assert.equal(BASE_PLAYBACK_INTERVAL_MS, 50);
    assert.equal(MIN_SCENARIO_DURATION_SECONDS, 0.1);
    assert.equal(FALLBACK_SCENARIO_DURATION_SECONDS, 10.0);
    assert.deepEqual(PLAYBACK_SPEEDS, [0.5, 1.0, 2.0, 4.0]);
  });

  it('calculates forward step target time and clamps to duration', () => {
    const totalDuration = 7.15;
    const currentTime = 5.5;
    const stepSeconds = DEFAULT_STEP_INTERVAL_SECONDS; // 2.0s

    const rawTarget = currentTime + stepSeconds; // 7.5s
    const clampedTarget = Math.max(0, Math.min(totalDuration, rawTarget));

    assert.equal(clampedTarget, 7.15);
  });

  it('calculates backward step target time and clamps to 0', () => {
    const currentTime = 1.2;
    const stepSeconds = DEFAULT_STEP_INTERVAL_SECONDS; // 2.0s

    const rawTarget = currentTime - stepSeconds; // -0.8s
    const clampedTarget = Math.max(0, rawTarget);

    assert.equal(clampedTarget, 0);
  });

  it('formats time display properly with mm:ss.xx format', () => {
    assert.equal(formatTime(7.15), '00:07.15s');
    assert.equal(formatTime(14.41), '00:14.41s');
    assert.equal(formatTime(65.0), '01:05.00s');
    assert.equal(formatTime(0), '00:00.00s');
  });

  it('enforces playback speed limits between min and max bounds', () => {
    const clampSpeed = (speed: number) =>
      Math.max(MIN_PLAYBACK_SPEED, Math.min(MAX_PLAYBACK_SPEED, speed));

    assert.equal(clampSpeed(0.1), MIN_PLAYBACK_SPEED);
    assert.equal(clampSpeed(10.0), MAX_PLAYBACK_SPEED);
    assert.equal(clampSpeed(2.0), 2.0);
  });
});
