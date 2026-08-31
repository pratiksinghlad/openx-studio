import React from 'react';
import {
  Play,
  Pause,
  Square,
  SkipForward,
  SkipBack,
  RotateCcw,
  CheckCircle2,
  Maximize,
  Minimize,
  Eye,
  Car,
  Compass,
  Minus,
  Plus,
  RotateCw,
} from 'lucide-react';
import { CameraMode, CAMERA_MODES } from '../renderer/types';
import { Slider } from './ui/slider';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { cn } from '../lib/utils';

export const PLAYBACK_SPEEDS = [0.5, 1.0, 2.0, 4.0] as const;
const MIN_DURATION = 0.1;
const FALLBACK_DURATION = 10.0;

const CAMERA_BUTTON_CONFIG = [
  { mode: CAMERA_MODES.ORBIT, label: '3D', icon: Eye, tooltip: "Orbit 3D Camera (Reset to Bird's-Eye)" },
  { mode: CAMERA_MODES.FOLLOW_EGO, label: 'Follow', icon: Car, tooltip: 'Follow Ego Vehicle Chase Camera' },
  { mode: CAMERA_MODES.TOP_DOWN, label: 'Top', icon: Compass, tooltip: 'Top-Down Ortho-like Map View' },
] as const;

export interface PlayerControlsProps {
  isPlaying: boolean;
  isLoaded: boolean;
  isCompleted: boolean;
  simulationTime: number;
  duration: number;
  speed: number;
  cameraMode: CameraMode;
  isFullscreen: boolean;
  zoomPercent: number;
  angleDeg: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onSeek: (time: number) => void;
  onSpeedChange: (speed: number) => void;
  onCameraModeChange: (mode: CameraMode) => void;
  onToggleFullscreen: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onAngleReset: () => void;
}

export function formatTime(seconds: number): string {
  const s = Math.max(0, seconds);
  const mins = Math.floor(s / 60);
  const secs = (s % 60).toFixed(2);
  return `${mins.toString().padStart(2, '0')}:${secs.padStart(5, '0')}s`;
}

interface PlayPauseButtonProps {
  isPlaying: boolean;
  isCompleted: boolean;
  onPlay: () => void;
  onPause: () => void;
}

function PlayPauseButton({
  isPlaying,
  isCompleted,
  onPlay,
  onPause,
}: PlayPauseButtonProps) {
  const icon = isPlaying ? (
    <Pause className="h-4 w-4" />
  ) : isCompleted ? (
    <RotateCcw className="h-4 w-4" />
  ) : (
    <Play className="h-4 w-4 fill-current ml-0.5" />
  );

  const tooltipText = isPlaying
    ? 'Pause'
    : isCompleted
    ? 'Replay Scenario from Start'
    : 'Play / Resume';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="default"
          size="icon"
          className={cn(
            'h-8.5 w-8.5 rounded-xl shadow-md text-primary-foreground active:scale-95 transition-all',
            isCompleted
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-500/30'
              : 'bg-primary hover:bg-primary/90'
          )}
          onClick={isPlaying ? onPause : onPlay}
          aria-label={isPlaying ? 'Pause' : isCompleted ? 'Replay Scenario' : 'Play'}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltipText}</TooltipContent>
    </Tooltip>
  );
}

interface PlaybackButtonGroupProps {
  isPlaying: boolean;
  isCompleted: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
}

function PlaybackButtonGroup({
  isPlaying,
  isCompleted,
  onPlay,
  onPause,
  onStop,
  onStepForward,
  onStepBackward,
}: PlaybackButtonGroupProps) {
  return (
    <div className="flex items-center gap-0.5 shrink-0">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/80 active:scale-95 transition-all"
            onClick={onStepBackward}
            aria-label="Step Backward"
          >
            <SkipBack className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Step Backward (0.05s)</TooltipContent>
      </Tooltip>

      <PlayPauseButton
        isPlaying={isPlaying}
        isCompleted={isCompleted}
        onPlay={onPlay}
        onPause={onPause}
      />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/80 active:scale-95 transition-all"
            onClick={onStop}
            aria-label="Stop / Reset"
          >
            <Square className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Stop / Reset to Start</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/80 active:scale-95 transition-all"
            onClick={onStepForward}
            aria-label="Step Forward"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Step Forward (0.05s)</TooltipContent>
      </Tooltip>
    </div>
  );
}

interface TimeDisplayProps {
  effectiveValue: number;
  effectiveDuration: number;
  isCompleted: boolean;
}

function TimeDisplay({ effectiveValue, effectiveDuration, isCompleted }: TimeDisplayProps) {
  return (
    <div className="flex items-center gap-1.5 font-mono text-sm font-bold tracking-tight select-none">
      <span
        className={cn(
          'transition-colors duration-200',
          isCompleted
            ? 'text-emerald-600 dark:text-emerald-400 font-extrabold'
            : 'text-foreground'
        )}
      >
        {formatTime(effectiveValue)}
      </span>
      <span className="text-muted-foreground/50 font-normal">/</span>
      <span className="text-muted-foreground font-semibold">
        {formatTime(effectiveDuration)}
      </span>

      {isCompleted && (
        <Badge
          variant="success"
          className="h-5 px-2 text-[11px] font-bold flex items-center gap-1 shadow-xs border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 animate-in fade-in zoom-in-95 duration-200 ml-1"
        >
          <CheckCircle2 className="h-3 w-3" />
          <span>Done</span>
        </Badge>
      )}
    </div>
  );
}

interface TimelineTrackProps {
  effectiveValue: number;
  effectiveDuration: number;
  onSeek: (time: number) => void;
}

function TimelineTrack({ effectiveValue, effectiveDuration, onSeek }: TimelineTrackProps) {
  return (
    <div className="w-full flex items-center px-1">
      <Slider
        min={0}
        max={effectiveDuration}
        step={0.05}
        value={[effectiveValue]}
        onValueChange={(val) => onSeek(val[0])}
        aria-label="Simulation timeline scrubber"
        className="w-full cursor-pointer py-1"
      />
    </div>
  );
}

interface SpeedSelectorProps {
  speed: number;
  onSpeedChange: (speed: number) => void;
}

function SpeedSelector({ speed, onSpeedChange }: SpeedSelectorProps) {
  return (
    <div className="flex items-center bg-muted/60 dark:bg-muted/40 p-0.5 rounded-lg border border-border/40 shrink-0 shadow-inner">
      {PLAYBACK_SPEEDS.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onSpeedChange(s)}
          className={cn(
            'px-2 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer select-none active:scale-95',
            speed === s
              ? 'bg-background text-foreground shadow-sm font-bold border border-border/40'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
          )}
          title={`Playback speed ${s}x`}
        >
          {s}x
        </button>
      ))}
    </div>
  );
}

interface CameraControlsProps {
  cameraMode: CameraMode;
  onCameraModeChange: (mode: CameraMode) => void;
}

function CameraControls({ cameraMode, onCameraModeChange }: CameraControlsProps) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      {CAMERA_BUTTON_CONFIG.map(({ mode, label, icon: Icon, tooltip }) => (
        <Tooltip key={mode}>
          <TooltipTrigger asChild>
            <Button
              variant={cameraMode === mode ? 'hud-active' : 'outline'}
              size="sm"
              onClick={() => onCameraModeChange(mode)}
              className="gap-1.5 h-8 text-xs px-2.5 active:scale-95 transition-all"
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

interface ZoomSteppersProps {
  zoomPercent: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

function ZoomSteppers({ zoomPercent, onZoomIn, onZoomOut }: ZoomSteppersProps) {
  return (
    <div className="flex items-center bg-muted/60 dark:bg-muted/40 rounded-lg border border-border/40 shrink-0 shadow-inner">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onZoomOut}
            className="px-2 py-1.5 text-muted-foreground hover:text-foreground hover:bg-background/40 transition-colors cursor-pointer rounded-l-lg active:scale-95"
            aria-label="Zoom Out"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Zoom Out (−10%)</TooltipContent>
      </Tooltip>
      <span className="font-mono text-xs font-semibold text-foreground min-w-[3ch] text-center px-1 select-none">
        {zoomPercent}%
      </span>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onZoomIn}
            className="px-2 py-1.5 text-muted-foreground hover:text-foreground hover:bg-background/40 transition-colors cursor-pointer rounded-r-lg active:scale-95"
            aria-label="Zoom In"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Zoom In (+10%)</TooltipContent>
      </Tooltip>
    </div>
  );
}

interface AngleResetButtonProps {
  angleDeg: number;
  onAngleReset: () => void;
}

function AngleResetButton({ angleDeg, onAngleReset }: AngleResetButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onAngleReset}
          className="flex items-center gap-1.5 bg-muted/60 dark:bg-muted/40 rounded-lg border border-border/40 px-2.5 py-1.5 text-muted-foreground hover:text-foreground hover:bg-background/40 transition-colors cursor-pointer active:scale-95 shadow-inner"
          aria-label="Reset Camera Angle"
        >
          <RotateCw className="h-3.5 w-3.5" />
          <span className="font-mono text-xs font-semibold text-foreground min-w-[2ch] text-center select-none">
            {angleDeg}°
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent>Reset Camera Angle to 0°</TooltipContent>
    </Tooltip>
  );
}

interface ZoomAngleControlsProps {
  zoomPercent: number;
  angleDeg: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onAngleReset: () => void;
}

function ZoomAngleControls({
  zoomPercent,
  angleDeg,
  onZoomIn,
  onZoomOut,
  onAngleReset,
}: ZoomAngleControlsProps) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <ZoomSteppers zoomPercent={zoomPercent} onZoomIn={onZoomIn} onZoomOut={onZoomOut} />
      <AngleResetButton angleDeg={angleDeg} onAngleReset={onAngleReset} />
    </div>
  );
}

interface FullscreenButtonProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

function FullscreenButton({ isFullscreen, onToggleFullscreen }: FullscreenButtonProps) {
  return (
    <div className="shrink-0 pl-1 border-l border-border/60">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/80 active:scale-95 transition-all"
            onClick={onToggleFullscreen}
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}</TooltipContent>
      </Tooltip>
    </div>
  );
}

export const PlayerControls: React.FC<PlayerControlsProps> = (props) => {
  const {
    isPlaying,
    isLoaded,
    isCompleted,
    simulationTime,
    duration,
    speed,
    cameraMode,
    isFullscreen,
    zoomPercent,
    angleDeg,
    onPlay,
    onPause,
    onStop,
    onStepForward,
    onStepBackward,
    onSeek,
    onSpeedChange,
    onCameraModeChange,
    onToggleFullscreen,
    onZoomIn,
    onZoomOut,
    onAngleReset,
  } = props;

  if (!isLoaded) return null;

  const effectiveDuration = Math.max(MIN_DURATION, duration || FALLBACK_DURATION);
  const effectiveValue = isCompleted
    ? effectiveDuration
    : Math.min(simulationTime, effectiveDuration);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="absolute bottom-5 left-0 w-full flex justify-center pointer-events-none z-30 px-3 sm:px-4 group/dock">
        <div className="pointer-events-auto flex flex-col gap-1.5 bg-card/92 dark:bg-card/85 backdrop-blur-2xl border border-border/80 hover:border-primary/50 p-2 sm:p-2.5 px-3.5 sm:px-4 rounded-2xl shadow-xl hover:shadow-2xl w-[min(98%,960px)] min-w-0 transition-all duration-300 ease-out transform-gpu scale-95 opacity-90 hover:scale-100 hover:opacity-100">
          {/* Top Row: Full-width Timeline Scrubber Line */}
          <TimelineTrack
            effectiveValue={effectiveValue}
            effectiveDuration={effectiveDuration}
            onSeek={onSeek}
          />

          {/* Bottom Row: Controls & Time on Left, View & Tools on Right */}
          <div className="flex items-center justify-between gap-2 sm:gap-3 w-full flex-nowrap min-w-0">
            {/* Left: Playback buttons & Clear Time Display */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <PlaybackButtonGroup
                isPlaying={isPlaying}
                isCompleted={isCompleted}
                onPlay={onPlay}
                onPause={onPause}
                onStop={onStop}
                onStepForward={onStepForward}
                onStepBackward={onStepBackward}
              />
              <TimeDisplay
                effectiveValue={effectiveValue}
                effectiveDuration={effectiveDuration}
                isCompleted={isCompleted}
              />
            </div>

            {/* Right: Speeds, Camera View Modes, Zoom, Fullscreen */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
              <SpeedSelector speed={speed} onSpeedChange={onSpeedChange} />

              <CameraControls
                cameraMode={cameraMode}
                onCameraModeChange={onCameraModeChange}
              />

              {cameraMode !== CAMERA_MODES.FOLLOW_EGO && (
                <ZoomAngleControls
                  zoomPercent={zoomPercent}
                  angleDeg={angleDeg}
                  onZoomIn={onZoomIn}
                  onZoomOut={onZoomOut}
                  onAngleReset={onAngleReset}
                />
              )}

              <FullscreenButton
                isFullscreen={isFullscreen}
                onToggleFullscreen={onToggleFullscreen}
              />
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};
