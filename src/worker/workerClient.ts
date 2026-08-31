import {
  MainToWorkerMessage,
  WorkerToMainMessage,
  LoadScenarioPayload,
} from '../types/protocol';
import { ScenarioRoadGeometry, ScenarioFrame, ScenarioMetadata } from '../types/simulation';

export type FrameCallback = (frame: ScenarioFrame, simulationTime: number, duration: number, isCompleted: boolean) => void;
export type ScenarioLoadedCallback = (
  roadGeometry: ScenarioRoadGeometry,
  initialFrame: ScenarioFrame,
  objectCount: number,
  duration: number,
  metadata?: ScenarioMetadata
) => void;
export type PlaybackStateCallback = (isPlaying: boolean, simulationTime: number, duration: number, isCompleted: boolean, speed: number) => void;
export type ErrorCallback = (message: string, details?: string) => void;
export type LogCallback = (level: 'info' | 'warn' | 'error', message: string) => void;
export type ReadyCallback = () => void;

export class SimulationWorkerClient {
  private worker: Worker | null = null;
  private isReady = false;

  private onFrameCallbacks: Set<FrameCallback> = new Set();
  private onScenarioLoadedCallbacks: Set<ScenarioLoadedCallback> = new Set();
  private onPlaybackStateCallbacks: Set<PlaybackStateCallback> = new Set();
  private onErrorCallbacks: Set<ErrorCallback> = new Set();
  private onLogCallbacks: Set<LogCallback> = new Set();
  private onReadyCallbacks: Set<ReadyCallback> = new Set();

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    try {
      this.worker = new Worker(
        new URL('./simulation.worker.ts', import.meta.url),
        { type: 'module' }
      );

      this.worker.onmessage = (event: MessageEvent<WorkerToMainMessage>) => {
        if (event.origin && window.location && event.origin !== window.location.origin) {
          console.warn(`[workerClient] Ignored message from unauthorized origin: ${event.origin}`);
          return;
        }
        this.handleWorkerMessage(event.data);
      };

      this.worker.onerror = (err) => {
        this.notifyError('Worker error', err.message);
      };
    } catch (err: any) {
      this.notifyError('Failed to initialize worker', err?.message || String(err));
    }
  }

  public init() {
    this.postMessage({ type: 'INIT' });
  }

  private handleWorkerMessage(msg: WorkerToMainMessage) {
    if (!msg || typeof msg !== 'object' || typeof msg.type !== 'string') {
      return;
    }
    switch (msg.type) {
      case 'READY':
        this.isReady = true;
        this.onReadyCallbacks.forEach((cb) => cb());
        break;
      case 'SCENARIO_LOADED':
        this.onScenarioLoadedCallbacks.forEach((cb) =>
          cb(
            msg.payload.roadGeometry,
            msg.payload.initialFrame,
            msg.payload.objectCount,
            msg.payload.duration,
            msg.payload.metadata
          )
        );
        break;
      case 'FRAME':
        this.onFrameCallbacks.forEach((cb) =>
          cb(msg.payload.frame, msg.payload.simulationTime, msg.payload.duration, msg.payload.isCompleted)
        );
        break;
      case 'PLAYBACK_STATE':
        this.onPlaybackStateCallbacks.forEach((cb) =>
          cb(msg.payload.isPlaying, msg.payload.simulationTime, msg.payload.duration, msg.payload.isCompleted, msg.payload.speed)
        );
        break;
      case 'ERROR':
        this.notifyError(msg.payload.message, msg.payload.details);
        break;
      case 'LOG':
        this.onLogCallbacks.forEach((cb) => cb(msg.payload.level, msg.payload.message));
        break;
    }
  }

  private notifyError(message: string, details?: string) {
    this.onErrorCallbacks.forEach((cb) => cb(message, details));
  }

  private postMessage(msg: MainToWorkerMessage) {
    if (this.worker) {
      this.worker.postMessage(msg);
    }
  }

  public loadScenario(payload: LoadScenarioPayload) {
    this.postMessage({
      type: 'LOAD_SCENARIO',
      payload,
    });
  }

  public play() {
    this.postMessage({ type: 'PLAY' });
  }

  public pause() {
    this.postMessage({ type: 'PAUSE' });
  }

  public stop() {
    this.postMessage({ type: 'STOP' });
  }

  public stepForward() {
    this.postMessage({ type: 'STEP_FORWARD' });
  }

  public stepBackward() {
    this.postMessage({ type: 'STEP_BACKWARD' });
  }

  public seek(targetTime: number) {
    this.postMessage({
      type: 'SEEK',
      payload: { targetTime },
    });
  }

  public setSpeed(speed: number) {
    this.postMessage({
      type: 'SET_SPEED',
      payload: { speed },
    });
  }

  public reset() {
    this.postMessage({ type: 'RESET' });
  }

  public onReady(cb: ReadyCallback): () => void {
    if (this.isReady) {
      cb();
    }
    this.onReadyCallbacks.add(cb);
    return () => this.onReadyCallbacks.delete(cb);
  }

  public onFrame(cb: FrameCallback): () => void {
    this.onFrameCallbacks.add(cb);
    return () => this.onFrameCallbacks.delete(cb);
  }

  public onScenarioLoaded(cb: ScenarioLoadedCallback): () => void {
    this.onScenarioLoadedCallbacks.add(cb);
    return () => this.onScenarioLoadedCallbacks.delete(cb);
  }

  public onPlaybackState(cb: PlaybackStateCallback): () => void {
    this.onPlaybackStateCallbacks.add(cb);
    return () => this.onPlaybackStateCallbacks.delete(cb);
  }

  public onError(cb: ErrorCallback): () => void {
    this.onErrorCallbacks.add(cb);
    return () => this.onErrorCallbacks.delete(cb);
  }

  public onLog(cb: LogCallback): () => void {
    this.onLogCallbacks.add(cb);
    return () => this.onLogCallbacks.delete(cb);
  }

  public terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.onFrameCallbacks.clear();
    this.onScenarioLoadedCallbacks.clear();
    this.onPlaybackStateCallbacks.clear();
    this.onErrorCallbacks.clear();
    this.onLogCallbacks.clear();
    this.onReadyCallbacks.clear();
  }
}
