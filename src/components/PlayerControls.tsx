import React from 'react';
import {
  Play,
  Pause,
  Square,
  SkipForward,
  SkipBack,
  Maximize,
  Minimize,
  Eye,
  Car,
  Compass,
  Minus,
  Plus,
  RotateCw,
} from 'lucide-react';
import { CameraMode, CAMERA_MODES } from '../renderer/ScenarioRenderer';
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

interface PlayerControlsProps {
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

export const PlayerControls: React.FC<PlayerControlsProps> = ({
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
}) => {
  const speeds = [0.5, 1.0, 2.0, 4.0];

  const formatTime = (seconds: number) => {
    const s = Math.max(0, seconds);
    const mins = Math.floor(s / 60);
    const secs = (s % 60).toFixed(2);
    return `${mins.toString().padStart(2, '0')}:${secs.padStart(5, '0')}s`;
  };

  if (!isLoaded) return null;

  const effectiveDuration = Math.max(0.1, duration || 10.0);
  const effectiveValue = isCompleted
    ? effectiveDuration
    : Math.min(simulationTime, effectiveDuration);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="absolute bottom-5 left-0 w-full flex justify-center pointer-events-none z-30 px-4">
        <div className="pointer-events-auto flex items-center justify-between gap-3 bg-background/85 backdrop-blur-xl border border-border/70 p-2.5 px-4 rounded-2xl shadow-2xl w-[min(96%,980px)] min-w-0 transition-all">
          {/* Playback Button Group */}
          <div className="flex items-center gap-1 shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={onStepBackward}
                  aria-label="Step Backward"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Step Backward (0.05s)</TooltipContent>
            </Tooltip>

            {isPlaying ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="default"
                    size="icon"
                    className="h-9 w-9 rounded-xl shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={onPause}
                    aria-label="Pause"
                  >
                    <Pause className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Pause</TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="default"
                    size="icon"
                    className="h-9 w-9 rounded-xl shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={onPlay}
                    aria-label="Play / Replay"
                  >
                    <Play className="h-4 w-4 fill-current ml-0.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isCompleted ? 'Replay Scenario' : 'Play / Resume'}
                </TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
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
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={onStepForward}
                  aria-label="Step Forward"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Step Forward (0.05s)</TooltipContent>
            </Tooltip>
          </div>

          {/* Timeline & Scrubber */}
          <div className="flex-1 min-w-[120px] flex items-center gap-3 mx-2">
            <div className="font-mono text-xs font-semibold whitespace-nowrap tracking-tight shrink-0">
              <span className="text-foreground">{formatTime(effectiveValue)}</span>
              <span className="text-muted-foreground mx-1">/</span>
              <span className="text-muted-foreground font-normal">
                {formatTime(effectiveDuration)}
              </span>
            </div>

            <div className="flex-1 min-w-[60px]">
              <Slider
                min={0}
                max={effectiveDuration}
                step={0.05}
                value={[effectiveValue]}
                onValueChange={(val) => onSeek(val[0])}
                aria-label="Simulation timeline scrubber"
              />
            </div>

            {isCompleted && (
              <Badge variant="success" className="h-5 px-2 text-[10px] shrink-0 font-bold">
                Completed
              </Badge>
            )}
          </div>

          {/* Speed Selector */}
          <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/40 shrink-0">
            {speeds.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSpeedChange(s)}
                className={cn(
                  'px-2 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer',
                  speed === s
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title={`Playback speed ${s}x`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Camera View Mode Group */}
          <div className="flex items-center gap-1 shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={cameraMode === CAMERA_MODES.ORBIT ? 'hud-active' : 'outline'}
                  size="sm"
                  onClick={() => onCameraModeChange(CAMERA_MODES.ORBIT)}
                  className="gap-1.5 h-8 text-xs px-2.5"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">3D</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Orbit 3D Camera (Reset to Bird's-Eye)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={cameraMode === CAMERA_MODES.FOLLOW_EGO ? 'hud-active' : 'outline'}
                  size="sm"
                  onClick={() => onCameraModeChange(CAMERA_MODES.FOLLOW_EGO)}
                  className="gap-1.5 h-8 text-xs px-2.5"
                >
                  <Car className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Follow</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Follow Ego Vehicle Chase Camera</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={cameraMode === CAMERA_MODES.TOP_DOWN ? 'hud-active' : 'outline'}
                  size="sm"
                  onClick={() => onCameraModeChange(CAMERA_MODES.TOP_DOWN)}
                  className="gap-1.5 h-8 text-xs px-2.5"
                >
                  <Compass className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Top</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Top-Down Ortho-like Map View</TooltipContent>
            </Tooltip>
          </div>

          {/* Zoom & Angle Controls */}
          {cameraMode !== CAMERA_MODES.FOLLOW_EGO && (
            <div className="flex items-center gap-2 shrink-0">
              {/* Zoom Group */}
              <div className="flex items-center bg-muted/60 rounded-lg border border-border/40 shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={onZoomOut}
                      className="px-2 py-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-l-lg"
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
                      className="px-2 py-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-r-lg"
                      aria-label="Zoom In"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Zoom In (+10%)</TooltipContent>
                </Tooltip>
              </div>

              {/* Angle Group */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={onAngleReset}
                    className="flex items-center gap-1.5 bg-muted/60 rounded-lg border border-border/40 px-2.5 py-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
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
            </div>
          )}

          {/* Fullscreen Button */}
          <div className="shrink-0 pl-1 border-l border-border/60">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
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
        </div>
      </div>
    </TooltipProvider>
  );
};
