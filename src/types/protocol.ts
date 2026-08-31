import { ScenarioRoadGeometry, ScenarioFrame, ScenarioMetadata } from './simulation';

export type WorkerCommandType =
  | 'INIT'
  | 'LOAD_SCENARIO'
  | 'PLAY'
  | 'PAUSE'
  | 'STOP'
  | 'STEP_FORWARD'
  | 'STEP_BACKWARD'
  | 'SEEK'
  | 'SET_SPEED'
  | 'RESET';

export interface FilePayload {
  name: string;
  content: string | ArrayBuffer;
}

export interface LoadScenarioPayload {
  xoscFile: FilePayload;
  xodrFile: FilePayload;
  extraFiles?: FilePayload[];
}

export interface WorkerCommandMessage {
  type: WorkerCommandType;
  payload?: any;
}

export interface InitCommand extends WorkerCommandMessage {
  type: 'INIT';
}

export interface LoadScenarioCommand extends WorkerCommandMessage {
  type: 'LOAD_SCENARIO';
  payload: LoadScenarioPayload;
}

export interface PlayCommand extends WorkerCommandMessage {
  type: 'PLAY';
}

export interface PauseCommand extends WorkerCommandMessage {
  type: 'PAUSE';
}

export interface StopCommand extends WorkerCommandMessage {
  type: 'STOP';
}

export interface StepForwardCommand extends WorkerCommandMessage {
  type: 'STEP_FORWARD';
}

export interface StepBackwardCommand extends WorkerCommandMessage {
  type: 'STEP_BACKWARD';
}

export interface SeekCommand extends WorkerCommandMessage {
  type: 'SEEK';
  payload: {
    targetTime: number;
  };
}

export interface SetSpeedCommand extends WorkerCommandMessage {
  type: 'SET_SPEED';
  payload: {
    speed: number;
  };
}

export interface ResetCommand extends WorkerCommandMessage {
  type: 'RESET';
}

export type MainToWorkerMessage =
  | InitCommand
  | LoadScenarioCommand
  | PlayCommand
  | PauseCommand
  | StopCommand
  | StepForwardCommand
  | StepBackwardCommand
  | SeekCommand
  | SetSpeedCommand
  | ResetCommand;

export type WorkerResponseType =
  | 'READY'
  | 'SCENARIO_LOADED'
  | 'FRAME'
  | 'PLAYBACK_STATE'
  | 'ERROR'
  | 'LOG';

export interface ReadyResponse {
  type: 'READY';
}

export interface ScenarioLoadedResponse {
  type: 'SCENARIO_LOADED';
  payload: {
    roadGeometry: ScenarioRoadGeometry;
    initialFrame: ScenarioFrame;
    objectCount: number;
    duration: number;
    metadata?: ScenarioMetadata;
  };
}

export interface FrameResponse {
  type: 'FRAME';
  payload: {
    frame: ScenarioFrame;
    simulationTime: number;
    duration: number;
    isCompleted: boolean;
  };
}

export interface PlaybackStateResponse {
  type: 'PLAYBACK_STATE';
  payload: {
    isPlaying: boolean;
    simulationTime: number;
    duration: number;
    isCompleted: boolean;
    speed: number;
  };
}

export interface ErrorResponse {
  type: 'ERROR';
  payload: {
    message: string;
    details?: string;
  };
}

export interface LogResponse {
  type: 'LOG';
  payload: {
    level: 'info' | 'warn' | 'error';
    message: string;
  };
}

export type WorkerToMainMessage =
  | ReadyResponse
  | ScenarioLoadedResponse
  | FrameResponse
  | PlaybackStateResponse
  | ErrorResponse
  | LogResponse;
