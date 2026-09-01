/**
 * Playback and simulation timing constants and helpers for OpenX Studio.
 */

/**
 * Step forward and backward interval in seconds.
 * Configurable via this variable for easy and quick customization.
 */
export const DEFAULT_STEP_INTERVAL_SECONDS = 2.0;

/**
 * Fixed simulation step size in seconds (20 Hz).
 */
export const FIXED_SIMULATION_DT = 0.05;

/**
 * Base timer interval in milliseconds for 1x playback speed.
 */
export const BASE_PLAYBACK_INTERVAL_MS = 50;

/**
 * Minimum allowable scenario duration in seconds.
 */
export const MIN_SCENARIO_DURATION_SECONDS = 0.1;

/**
 * Fallback scenario duration in seconds when duration cannot be determined.
 */
export const FALLBACK_SCENARIO_DURATION_SECONDS = 10.0;

/**
 * Maximum simulation steps to pre-simulate upon loading (500s at 20 Hz).
 */
export const MAX_PRE_SIMULATION_STEPS = 10000;

/**
 * Supported playback speeds.
 */
export const PLAYBACK_SPEEDS = [0.5, 1.0, 2.0, 4.0] as const;

/**
 * Minimum allowed playback speed multiplier.
 */
export const MIN_PLAYBACK_SPEED = 0.25;

/**
 * Maximum allowed playback speed multiplier.
 */
export const MAX_PLAYBACK_SPEED = 8.0;

/**
 * Minimum timer interval in milliseconds.
 */
export const MIN_PLAYBACK_INTERVAL_MS = 10;

/**
 * Format seconds into mm:ss.xx time string.
 */
export function formatTime(seconds: number): string {
  const s = Math.max(0, seconds);
  const mins = Math.floor(s / 60);
  const secs = (s % 60).toFixed(2);
  return `${mins.toString().padStart(2, '0')}:${secs.padStart(5, '0')}s`;
}
