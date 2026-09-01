import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isInteractiveInput } from '../../src/hooks/usePlayerKeyboardShortcuts.ts';
import { PLAYER_SHORTCUTS } from '../../src/constants/shortcuts.ts';

describe('Player Keyboard Shortcuts Hook Utilities', () => {
  it('identifies text input and textarea as interactive targets', () => {
    const inputMock = {
      tagName: 'INPUT',
      isContentEditable: false,
    } as unknown as EventTarget;
    assert.equal(isInteractiveInput(inputMock), true);

    const textareaMock = {
      tagName: 'TEXTAREA',
      isContentEditable: false,
    } as unknown as EventTarget;
    assert.equal(isInteractiveInput(textareaMock), true);

    const selectMock = {
      tagName: 'SELECT',
      isContentEditable: false,
    } as unknown as EventTarget;
    assert.equal(isInteractiveInput(selectMock), true);

    const contentEditableMock = {
      tagName: 'DIV',
      isContentEditable: true,
    } as unknown as EventTarget;
    assert.equal(isInteractiveInput(contentEditableMock), true);

    const nestedInsideInputMock = {
      tagName: 'SPAN',
      isContentEditable: false,
      closest: (selector: string) => (selector.includes('input') ? {} : null),
    } as unknown as EventTarget;
    assert.equal(isInteractiveInput(nestedInsideInputMock), true);
  });

  it('allows keyboard shortcuts on normal non-editable buttons and containers', () => {
    const buttonMock = {
      tagName: 'BUTTON',
      isContentEditable: false,
      closest: () => null,
    } as unknown as EventTarget;
    assert.equal(isInteractiveInput(buttonMock), false);

    const divMock = {
      tagName: 'DIV',
      isContentEditable: false,
      closest: () => null,
    } as unknown as EventTarget;
    assert.equal(isInteractiveInput(divMock), false);

    assert.equal(isInteractiveInput(null), false);
    assert.equal(isInteractiveInput(undefined as unknown as EventTarget), false);
  });

  it('filters modifier keys to preserve browser shortcuts', () => {
    const isModifierPressed = (event: { ctrlKey?: boolean; metaKey?: boolean; altKey?: boolean }) => {
      return Boolean(event.ctrlKey || event.metaKey || event.altKey);
    };

    assert.equal(isModifierPressed({ ctrlKey: true }), true);
    assert.equal(isModifierPressed({ metaKey: true }), true);
    assert.equal(isModifierPressed({ altKey: true }), true);
    assert.equal(isModifierPressed({}), false);
  });

  it('provides all expected player shortcut mappings and metadata', () => {
    const expectedKeys = [
      'TOGGLE_PLAY',
      'STEP_BACKWARD',
      'STEP_FORWARD',
      'STOP',
      'RECORD',
      'FULLSCREEN',
      'SPEED_DECREASE',
      'SPEED_INCREASE',
      'CYCLE_CAMERA',
      'RESET_CAMERA_ANGLE',
      'ZOOM_IN',
      'ZOOM_OUT',
    ] as const;

    for (const key of expectedKeys) {
      const config = PLAYER_SHORTCUTS[key];
      assert.ok(config, `Missing shortcut configuration for ${key}`);
      assert.ok(Array.isArray(config.keys) && config.keys.length > 0);
      assert.ok(Array.isArray(config.displayKeys) && config.displayKeys.length > 0);
      assert.ok(typeof config.description === 'string' && config.description.length > 0);
    }
  });
});
