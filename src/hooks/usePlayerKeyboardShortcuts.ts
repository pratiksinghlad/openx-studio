import { useEffect, useCallback } from 'react';
import type { CameraMode } from '../renderer/types.ts';
import {
  PLAYER_SHORTCUTS,
  getPreviousSpeed,
  getNextSpeed,
  getNextCameraMode,
} from '../constants/shortcuts.ts';

export interface UsePlayerKeyboardShortcutsProps {
  isLoaded: boolean;
  isPlaying: boolean;
  isCompleted?: boolean;
  currentSpeed: number;
  currentCameraMode?: CameraMode;
  disabled?: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onSpeedChange: (speed: number) => void;
  onToggleFullscreen?: () => void;
  onToggleRecord?: () => void;
  onCameraModeChange?: (mode: CameraMode) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onAngleReset?: () => void;
}

export function isInteractiveInput(target: EventTarget | null): boolean {
  if (!target || typeof target !== 'object') {
    return false;
  }
  const el = target as Partial<HTMLElement>;
  if (!el.tagName) {
    return false;
  }
  const tagName = el.tagName.toLowerCase();
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    Boolean(el.isContentEditable) ||
    Boolean(el.closest && el.closest('input, textarea, select, [contenteditable="true"]'))
  );
}

export function usePlayerKeyboardShortcuts(props: UsePlayerKeyboardShortcutsProps) {
  const {
    isLoaded,
    isPlaying,
    currentSpeed,
    currentCameraMode,
    disabled = false,
    onPlay,
    onPause,
    onStop,
    onStepForward,
    onStepBackward,
    onSpeedChange,
    onToggleFullscreen,
    onToggleRecord,
    onCameraModeChange,
    onZoomIn,
    onZoomOut,
    onAngleReset,
  } = props;

  const handlePlaybackKeys = useCallback(
    (key: string, event: KeyboardEvent): boolean => {
      if ((PLAYER_SHORTCUTS.TOGGLE_PLAY.keys as readonly string[]).includes(key)) {
        event.preventDefault();
        if (isPlaying) {
          onPause();
        } else {
          onPlay();
        }
        return true;
      }
      if ((PLAYER_SHORTCUTS.STEP_BACKWARD.keys as readonly string[]).includes(key)) {
        event.preventDefault();
        onStepBackward();
        return true;
      }
      if ((PLAYER_SHORTCUTS.STEP_FORWARD.keys as readonly string[]).includes(key)) {
        event.preventDefault();
        onStepForward();
        return true;
      }
      if ((PLAYER_SHORTCUTS.STOP.keys as readonly string[]).includes(key)) {
        event.preventDefault();
        onStop();
        return true;
      }
      return false;
    },
    [isPlaying, onPlay, onPause, onStop, onStepForward, onStepBackward]
  );

  const handleSpeedAndCameraKeys = useCallback(
    (key: string, event: KeyboardEvent): boolean => {
      if ((PLAYER_SHORTCUTS.SPEED_DECREASE.keys as readonly string[]).includes(key)) {
        event.preventDefault();
        onSpeedChange(getPreviousSpeed(currentSpeed));
        return true;
      }
      if ((PLAYER_SHORTCUTS.SPEED_INCREASE.keys as readonly string[]).includes(key)) {
        event.preventDefault();
        onSpeedChange(getNextSpeed(currentSpeed));
        return true;
      }
      if (
        onCameraModeChange &&
        currentCameraMode &&
        (PLAYER_SHORTCUTS.CYCLE_CAMERA.keys as readonly string[]).includes(key)
      ) {
        event.preventDefault();
        onCameraModeChange(getNextCameraMode(currentCameraMode));
        return true;
      }
      return false;
    },
    [currentSpeed, currentCameraMode, onSpeedChange, onCameraModeChange]
  );

  const handleActionAndZoomKeys = useCallback(
    (key: string, event: KeyboardEvent): boolean => {
      if (onToggleRecord && (PLAYER_SHORTCUTS.RECORD.keys as readonly string[]).includes(key)) {
        event.preventDefault();
        onToggleRecord();
        return true;
      }
      if (onToggleFullscreen && (PLAYER_SHORTCUTS.FULLSCREEN.keys as readonly string[]).includes(key)) {
        event.preventDefault();
        onToggleFullscreen();
        return true;
      }
      if (onZoomIn && (PLAYER_SHORTCUTS.ZOOM_IN.keys as readonly string[]).includes(key)) {
        event.preventDefault();
        onZoomIn();
        return true;
      }
      if (onZoomOut && (PLAYER_SHORTCUTS.ZOOM_OUT.keys as readonly string[]).includes(key)) {
        event.preventDefault();
        onZoomOut();
        return true;
      }
      if (onAngleReset && (PLAYER_SHORTCUTS.RESET_CAMERA_ANGLE.keys as readonly string[]).includes(key)) {
        event.preventDefault();
        onAngleReset();
        return true;
      }
      return false;
    },
    [onToggleRecord, onToggleFullscreen, onZoomIn, onZoomOut, onAngleReset]
  );

  useEffect(() => {
    if (!isLoaded || disabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isInteractiveInput(event.target)) return;

      const { key } = event;
      if (handlePlaybackKeys(key, event)) return;
      if (handleSpeedAndCameraKeys(key, event)) return;
      handleActionAndZoomKeys(key, event);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isLoaded,
    disabled,
    handlePlaybackKeys,
    handleSpeedAndCameraKeys,
    handleActionAndZoomKeys,
  ]);
}
