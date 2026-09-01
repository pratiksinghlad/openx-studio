import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkIsStandalone, checkIsInstallSupported } from '../../src/hooks/usePWAInstall.ts';

describe('PWA Installation & Standalone Utilities', () => {
  it('checkIsStandalone returns false in non-browser / default test environment', () => {
    const isStandalone = checkIsStandalone();
    assert.equal(isStandalone, false);
  });

  it('checkIsStandalone returns true when window.matchMedia indicates standalone mode', () => {
    // Setup mock window environment
    const originalWindow = globalThis.window;
    globalThis.window = {
      matchMedia: (query: string) => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
      navigator: {
        standalone: false,
      },
    } as unknown as Window & typeof globalThis;

    const result = checkIsStandalone();
    assert.equal(result, true);

    // Restore original window
    if (originalWindow !== undefined) {
      globalThis.window = originalWindow;
    } else {
      delete (globalThis as { window?: unknown }).window;
    }
  });

  it('checkIsStandalone returns true when iOS navigator.standalone is true', () => {
    const originalWindow = globalThis.window;
    globalThis.window = {
      matchMedia: () => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
      navigator: {
        standalone: true,
      },
    } as unknown as Window & typeof globalThis;

    const result = checkIsStandalone();
    assert.equal(result, true);

    if (originalWindow !== undefined) {
      globalThis.window = originalWindow;
    } else {
      delete (globalThis as { window?: unknown }).window;
    }
  });

  it('checkIsInstallSupported detects service worker or beforeinstallprompt support', () => {
    const originalWindow = globalThis.window;

    // In non-browser / clean environment
    delete (globalThis as { window?: unknown }).window;
    assert.equal(checkIsInstallSupported(), false);

    // In environment with BeforeInstallPromptEvent on window
    globalThis.window = {
      BeforeInstallPromptEvent: function () {},
    } as unknown as Window & typeof globalThis;

    assert.equal(checkIsInstallSupported(), true);

    // Restore
    if (originalWindow !== undefined) {
      globalThis.window = originalWindow;
    } else {
      delete (globalThis as { window?: unknown }).window;
    }
  });
});
