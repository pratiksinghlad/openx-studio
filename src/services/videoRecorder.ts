export const RECORDER_CONSTANTS = {
  DEFAULT_FPS: 30,
  DEFAULT_BITRATE: 6_000_000, // 6 Mbps for high quality 1080p WebGL capture
  FALLBACK_FILENAME: 'scenario.mp4',
  TIMER_INTERVAL_MS: 500,
} as const;

export type RecorderStatus = 'idle' | 'recording' | 'processing' | 'error';

export interface RecorderOptions {
  fps?: number;
  videoBitrate?: number;
}

export interface RecorderState {
  status: RecorderStatus;
  durationSeconds: number;
  errorMessage?: string;
}

export type StateChangeCallback = (state: RecorderState) => void;

const MP4_MIME_CANDIDATES = [
  'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
  'video/mp4;codecs=avc1',
  'video/mp4;codecs=h264',
  'video/mp4',
  'video/webm;codecs=h264',
  'video/webm;codecs=vp9',
  'video/webm',
] as const;

export function sanitizeScenarioFilename(name: string): string {
  const baseName = name.trim().replace(/[/\\?%*:|"<>]/g, '-');
  const cleanName = baseName.replace(/\.xosc$/i, '').replace(/\.mp4$/i, '') || 'scenario';
  return `${cleanName}.mp4`;
}

export function resolveSupportedMimeType(): string {
  if (typeof MediaRecorder === 'undefined') {
    return 'video/mp4';
  }
  for (const candidate of MP4_MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(candidate)) {
      return candidate;
    }
  }
  return '';
}

export class VideoRecorderService {
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private recordedChunks: Blob[] = [];
  private startTime = 0;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private currentScenarioName = 'scenario';
  private status: RecorderStatus = 'idle';
  private durationSeconds = 0;
  private stateChangeListeners = new Set<StateChangeCallback>();

  public subscribe(callback: StateChangeCallback): () => void {
    this.stateChangeListeners.add(callback);
    callback(this.getState());
    return () => this.stateChangeListeners.delete(callback);
  }

  public getState(): RecorderState {
    return {
      status: this.status,
      durationSeconds: this.durationSeconds,
    };
  }

  public isRecording(): boolean {
    return this.status === 'recording';
  }

  public async start(
    canvas: HTMLCanvasElement,
    scenarioName: string,
    options?: RecorderOptions
  ): Promise<boolean> {
    if (this.status === 'recording') return false;

    this.currentScenarioName = scenarioName || 'scenario';
    this.recordedChunks = [];
    this.durationSeconds = 0;

    const fps = options?.fps ?? RECORDER_CONSTANTS.DEFAULT_FPS;
    const bitrate = options?.videoBitrate ?? RECORDER_CONSTANTS.DEFAULT_BITRATE;
    const mimeType = resolveSupportedMimeType();

    try {
      this.mediaStream = canvas.captureStream(fps);
      const recorderOptions: MediaRecorderOptions = {
        videoBitsPerSecond: bitrate,
        ...(mimeType ? { mimeType } : {}),
      };

      this.mediaRecorder = new MediaRecorder(this.mediaStream, recorderOptions);
      this.attachRecorderHandlers();
      this.mediaRecorder.start(250);

      this.startTime = performance.now();
      this.startDurationTimer();
      this.updateStatus('recording');
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.cleanupStream();
      this.updateStatus('error', msg);
      return false;
    }
  }

  public async stop(): Promise<Blob | null> {
    if (!this.mediaRecorder || this.status !== 'recording') {
      return null;
    }

    this.stopDurationTimer();
    this.updateStatus('processing');

    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        this.updateStatus('idle');
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'video/mp4';
        const blob = new Blob(this.recordedChunks, { type: mimeType });
        this.downloadBlob(blob, this.currentScenarioName);
        this.cleanupStream();
        this.updateStatus('idle');
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  private attachRecorderHandlers(): void {
    if (!this.mediaRecorder) return;

    this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.onerror = (event: Event) => {
      console.error('[VideoRecorderService] Error occurred:', event);
      this.stopDurationTimer();
      this.cleanupStream();
      this.updateStatus('error', 'MediaRecorder execution error');
    };
  }

  private startDurationTimer(): void {
    this.stopDurationTimer();
    this.timerId = setInterval(() => {
      this.durationSeconds = (performance.now() - this.startTime) / 1000;
      this.notifyListeners();
    }, RECORDER_CONSTANTS.TIMER_INTERVAL_MS);
  }

  private stopDurationTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private downloadBlob(blob: Blob, scenarioName: string): void {
    const filename = sanitizeScenarioFilename(scenarioName);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.style.display = 'none';
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    setTimeout(() => {
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    }, 2000);
  }

  private cleanupStream(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    this.mediaRecorder = null;
  }

  private updateStatus(status: RecorderStatus, errorMessage?: string): void {
    this.status = status;
    this.notifyListeners(errorMessage);
  }

  private notifyListeners(errorMessage?: string): void {
    const state: RecorderState = {
      status: this.status,
      durationSeconds: this.durationSeconds,
      errorMessage,
    };
    this.stateChangeListeners.forEach((cb) => cb(state));
  }

  public dispose(): void {
    this.stopDurationTimer();
    this.cleanupStream();
    this.stateChangeListeners.clear();
    this.recordedChunks = [];
    this.status = 'idle';
  }
}
