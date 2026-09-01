import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeScenarioFilename,
  resolveSupportedMimeType,
  RECORDER_CONSTANTS,
} from '../../src/services/videoRecorder.ts';

describe('VideoRecorderService Utilities', () => {
  it('sanitizes standard scenario filenames to .mp4', () => {
    assert.equal(sanitizeScenarioFilename('cut-in.xosc'), 'cut-in.mp4');
    assert.equal(sanitizeScenarioFilename('highway_merge'), 'highway_merge.mp4');
    assert.equal(sanitizeScenarioFilename('test-scenario.mp4'), 'test-scenario.mp4');
  });

  it('handles special characters and whitespace safely', () => {
    assert.equal(sanitizeScenarioFilename('scenario/with:illegal*chars?'), 'scenario-with-illegal-chars-.mp4');
    assert.equal(sanitizeScenarioFilename('  my_scenario  '), 'my_scenario.mp4');
    assert.equal(sanitizeScenarioFilename(''), 'scenario.mp4');
  });

  it('provides expected recorder constants', () => {
    assert.equal(RECORDER_CONSTANTS.DEFAULT_FPS, 30);
    assert.ok(RECORDER_CONSTANTS.DEFAULT_BITRATE > 1_000_000);
    assert.equal(RECORDER_CONSTANTS.FALLBACK_FILENAME, 'scenario.mp4');
  });

  it('handles mime type resolution gracefully in non-browser environment', () => {
    const mime = resolveSupportedMimeType();
    assert.equal(typeof mime, 'string');
  });
});
