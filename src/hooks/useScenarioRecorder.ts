import { useState, useEffect, useRef, useCallback } from 'react';
import {
  VideoRecorderService,
  RecorderStatus,
  RecorderState,
} from '../services/videoRecorder';

export interface UseScenarioRecorderProps {
  scenarioName: string;
  isCompleted: boolean;
  onAutoPlayStart?: () => void;
}

export interface UseScenarioRecorderReturn {
  isRecording: boolean;
  recorderStatus: RecorderStatus;
  recordedDuration: number;
  errorMessage?: string;
  startRecording: (canvas: HTMLCanvasElement | null) => Promise<boolean>;
  stopRecording: () => Promise<void>;
  toggleRecording: (canvas: HTMLCanvasElement | null) => Promise<void>;
}

export function useScenarioRecorder({
  scenarioName,
  isCompleted,
  onAutoPlayStart,
}: UseScenarioRecorderProps): UseScenarioRecorderReturn {
  const serviceRef = useRef<VideoRecorderService | null>(null);
  const [recorderState, setRecorderState] = useState<RecorderState>({
    status: 'idle',
    durationSeconds: 0,
  });

  if (!serviceRef.current) {
    serviceRef.current = new VideoRecorderService();
  }

  useEffect(() => {
    const service = serviceRef.current;
    if (!service) return;

    const unsubscribe = service.subscribe((state) => {
      setRecorderState(state);
    });

    return () => {
      unsubscribe();
      service.dispose();
    };
  }, []);

  const stopRecording = useCallback(async () => {
    if (!serviceRef.current || !serviceRef.current.isRecording()) return;
    await serviceRef.current.stop();
  }, []);

  // When scenario completes naturally, auto-finish recording and trigger MP4 download
  useEffect(() => {
    if (isCompleted && serviceRef.current?.isRecording()) {
      stopRecording();
    }
  }, [isCompleted, stopRecording]);

  const startRecording = useCallback(
    async (canvas: HTMLCanvasElement | null): Promise<boolean> => {
      if (!canvas || !serviceRef.current) return false;
      const success = await serviceRef.current.start(canvas, scenarioName);
      if (success && onAutoPlayStart) {
        onAutoPlayStart();
      }
      return success;
    },
    [scenarioName, onAutoPlayStart]
  );

  const toggleRecording = useCallback(
    async (canvas: HTMLCanvasElement | null) => {
      if (serviceRef.current?.isRecording()) {
        await stopRecording();
      } else {
        await startRecording(canvas);
      }
    },
    [startRecording, stopRecording]
  );

  return {
    isRecording: recorderState.status === 'recording',
    recorderStatus: recorderState.status,
    recordedDuration: recorderState.durationSeconds,
    errorMessage: recorderState.errorMessage,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}
