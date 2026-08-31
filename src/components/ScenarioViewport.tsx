import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  ScenarioRenderer,
  CameraMode,
  ViewTheme,
  CameraConfig,
  CAMERA_MODES,
  VIEW_THEMES,
} from '../renderer/ScenarioRenderer';
import { ScenarioRoadGeometry, ScenarioFrame } from '../types/simulation';
import { Activity, Gauge, ShieldCheck, AlertTriangle, Crosshair, Compass } from 'lucide-react';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

export interface ViewportState {
  zoomPercent: number;
  angleDeg: number;
}

export interface ScenarioViewportHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  resetAngle: () => void;
  getCanvas: () => HTMLCanvasElement | null;
}

interface ScenarioViewportProps {
  roadGeometry: ScenarioRoadGeometry | null;
  currentFrame: ScenarioFrame | null;
  cameraMode: CameraMode;
  cameraResetTrigger?: number;
  cameraConfig?: Partial<CameraConfig>;
  theme?: ViewTheme;
  isLoaded: boolean;
  statusText: string;
  onOpenInspector?: () => void;
  onFocusEntity?: (entityId: number) => void;
  selectedEntityId?: number | null;
  onViewportState?: (state: ViewportState) => void;
}

export const ScenarioViewport = forwardRef<ScenarioViewportHandle, ScenarioViewportProps>(({
  roadGeometry,
  currentFrame,
  cameraMode,
  cameraResetTrigger,
  cameraConfig,
  theme = VIEW_THEMES.LIGHT,
  isLoaded,
  statusText,
  onOpenInspector,
  onFocusEntity,
  selectedEntityId,
  onViewportState,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<ScenarioRenderer | null>(null);
  const viewportStateRef = useRef<ViewportState>({ zoomPercent: 100, angleDeg: 0 });
  const onViewportStateRef = useRef(onViewportState);
  onViewportStateRef.current = onViewportState;

  // Expose imperative commands for zoom/angle/canvas
  useImperativeHandle(ref, () => ({
    zoomIn: () => rendererRef.current?.zoomIn(),
    zoomOut: () => rendererRef.current?.zoomOut(),
    resetAngle: () => rendererRef.current?.resetAngle(),
    getCanvas: () => rendererRef.current?.getCanvas() || null,
  }), []);

  // Initialize ScenarioRenderer
  useEffect(() => {
    if (!containerRef.current) return;

    const renderer = new ScenarioRenderer(containerRef.current, theme, cameraConfig);
    rendererRef.current = renderer;

    // RAF loop to read zoom/angle and push to parent
    let rafId: number | null = null;
    const readViewportState = () => {
      rafId = requestAnimationFrame(readViewportState);
      const zoom = renderer.getZoomPercent();
      const angle = renderer.getAngleDeg();
      const prev = viewportStateRef.current;
      if (prev.zoomPercent !== zoom || prev.angleDeg !== angle) {
        viewportStateRef.current = { zoomPercent: zoom, angleDeg: angle };
        onViewportStateRef.current?.(viewportStateRef.current);
      }
    };
    readViewportState();

    const handleResize = () => {
      renderer.handleResize();
    };

    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(() => {
      renderer.handleResize();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      renderer.dispose();
      rendererRef.current = null;
    };
  }, []);

  // Update Theme
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setTheme(theme);
    }
  }, [theme]);

  // Update Road Geometry when loaded
  useEffect(() => {
    if (rendererRef.current && roadGeometry) {
      rendererRef.current.setRoadGeometry(roadGeometry);
    }
  }, [roadGeometry]);

  // Update Frame during playback/stepping
  useEffect(() => {
    if (rendererRef.current && currentFrame) {
      rendererRef.current.updateFrame(currentFrame);
    }
  }, [currentFrame]);

  // Update Camera Mode & Reset to Default View
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setCameraMode(cameraMode);
      if (cameraMode === CAMERA_MODES.ORBIT) {
        rendererRef.current.resetToDefaultView();
      }
    }
  }, [cameraMode, cameraResetTrigger]);

  // Handle focus entity
  useEffect(() => {
    if (rendererRef.current && selectedEntityId !== undefined && selectedEntityId !== null) {
      rendererRef.current.focusEntity(selectedEntityId);
    }
  }, [selectedEntityId]);

  // Extract HUD Metrics from current frame
  const objects = currentFrame?.object_states || [];
  const egoObj = objects.find((o) => o.name.toLowerCase().includes('ego')) || objects[0];
  const targetObj = objects.find((o) => o !== egoObj);

  const speedKmh = egoObj ? (egoObj.speed * 3.6).toFixed(1) : '0.0';
  const speedMs = egoObj ? egoObj.speed.toFixed(1) : '0.0';
  const entityCount = objects.length;

  // Safety & ADAS Kinematics
  let gapDistance: number | null = null;
  let relativeSpeedMs: number | null = null;
  let ttcSeconds: number | null = null;

  if (egoObj && targetObj) {
    // Longitudinal Gap
    gapDistance =
      Math.abs(targetObj.s - egoObj.s) > 0.01
        ? Math.abs(targetObj.s - egoObj.s)
        : Math.hypot(targetObj.x - egoObj.x, targetObj.y - egoObj.y);

    relativeSpeedMs = egoObj.speed - targetObj.speed;

    if (relativeSpeedMs > 0.2 && gapDistance > 0) {
      ttcSeconds = gapDistance / relativeSpeedMs;
    }
  }

  const handleEntityClick = (entityId: number) => {
    if (rendererRef.current) {
      rendererRef.current.focusEntity(entityId);
    }
    if (onFocusEntity) {
      onFocusEntity(entityId);
    }
  };

  return (
    <div className="relative w-full h-full outline-none select-none" ref={containerRef}>
      {isLoaded && (
        <div className="absolute top-4 left-4 right-4 flex flex-col gap-2.5 pointer-events-none z-20">
          {/* Top Primary Metrics Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Pill */}
            <div className="pointer-events-auto flex items-center gap-2 bg-background/90 backdrop-blur-md border border-border/80 px-3.5 py-1.5 rounded-full shadow-md text-xs font-bold text-foreground">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
              <span>{statusText}</span>
            </div>

            {egoObj && (
              <div className="pointer-events-auto flex items-center gap-2 flex-wrap">
                {/* Ego Velocity Chip */}
                <div className="flex items-center gap-2 bg-background/90 backdrop-blur-md border border-border/80 border-l-3 border-l-blue-600 px-3 py-1.5 rounded-lg shadow-md text-xs">
                  <Gauge className="h-4 w-4 text-blue-600 shrink-0" />
                  <span className="bg-blue-600 text-white text-[10px] font-black uppercase px-1.5 py-0.5 rounded">
                    EGO
                  </span>
                  <span className="font-mono font-bold text-foreground text-sm leading-none ml-0.5">
                    {speedKmh} <span className="text-xs font-semibold text-muted-foreground">km/h</span>
                  </span>
                  <span className="text-muted-foreground text-[11px] font-medium">({speedMs} m/s)</span>
                </div>

                {/* Frenet Station & Lane */}
                <div className="flex items-center gap-1.5 bg-background/90 backdrop-blur-md border border-border/80 px-3 py-1.5 rounded-lg shadow-md text-xs">
                  <Compass className="h-4 w-4 text-blue-600 shrink-0" />
                  <span className="font-mono font-bold text-sm text-foreground">
                    {egoObj.s > 0
                      ? `s: ${egoObj.s.toFixed(1)}m`
                      : `(${egoObj.x.toFixed(1)}, ${egoObj.y.toFixed(1)})`}
                  </span>
                  {egoObj.lane_id !== 0 && (
                    <span className="font-mono text-xs font-bold text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                      Ln {egoObj.lane_id}
                    </span>
                  )}
                </div>

                {/* ADAS Safety (Gap & TTC) */}
                {gapDistance !== null && (
                  <div
                    className={cn(
                      'flex items-center gap-2 bg-background/90 backdrop-blur-md border px-3 py-1.5 rounded-lg shadow-md text-xs',
                      ttcSeconds && ttcSeconds < 2.5
                        ? 'border-red-500/60 bg-red-50/80 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                        : 'border-emerald-500/50 bg-emerald-50/80 dark:bg-emerald-950/30 text-foreground'
                    )}
                  >
                    {ttcSeconds && ttcSeconds < 2.5 ? (
                      <AlertTriangle className="h-4 w-4 text-red-600 animate-bounce shrink-0" />
                    ) : (
                      <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-muted-foreground">Gap:</span>
                    <span className="font-mono font-bold text-sm text-foreground">{gapDistance.toFixed(1)}m</span>
                    {ttcSeconds !== null && (
                      <Badge
                        variant="destructive"
                        className="font-mono font-bold text-xs px-2 py-0.5"
                      >
                        TTC: {ttcSeconds.toFixed(1)}s
                      </Badge>
                    )}
                  </div>
                )}

                {/* Entity Inspector Trigger */}
                <button
                  type="button"
                  onClick={onOpenInspector}
                  className="flex items-center gap-2 bg-background/90 hover:bg-accent/80 backdrop-blur-md border border-border/80 px-3 py-1.5 rounded-lg shadow-md text-xs cursor-pointer transition-all active:scale-95"
                  title="Click to open Scenario & Entity Inspector"
                >
                  <Activity className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-mono font-bold text-sm text-foreground">{entityCount}</span>
                  <span className="text-muted-foreground text-xs font-medium">
                    {entityCount === 1 ? 'entity' : 'entities'}
                  </span>
                  <Badge variant="secondary" className="text-xs px-2 py-0.5 text-primary font-bold">
                    Details
                  </Badge>
                </button>
              </div>
            )}
          </div>

          {/* Quick Entity Selector Chips */}
          {objects.length > 1 && (
            <div className="pointer-events-auto flex items-center gap-2 flex-wrap">
              {objects.map((obj) => {
                const isEgo = obj.name.toLowerCase().includes('ego');
                const isTarget =
                  !isEgo &&
                  (obj.name.toLowerCase().includes('cutin') ||
                    obj.name.toLowerCase().includes('target'));
                const speed = (obj.speed * 3.6).toFixed(1);

                return (
                  <button
                    key={obj.id}
                    type="button"
                    onClick={() => handleEntityClick(obj.id)}
                    className={cn(
                      'flex items-center gap-2 bg-background/90 hover:bg-accent/80 backdrop-blur-md border px-3 py-1.5 rounded-lg shadow-sm text-xs cursor-pointer transition-all active:scale-95',
                      isEgo
                        ? 'border-blue-500/50 hover:border-blue-500'
                        : isTarget
                        ? 'border-red-500/50 hover:border-red-500'
                        : 'border-border'
                    )}
                    title={`Focus 3D camera on ${obj.name}`}
                  >
                    <span
                      className={cn(
                        'w-2.5 h-2.5 rounded-full shadow-xs',
                        isEgo ? 'bg-blue-600' : isTarget ? 'bg-red-600' : 'bg-amber-500'
                      )}
                    />
                    <span className="font-bold text-sm text-foreground">{obj.name}</span>
                    <span className="font-mono font-semibold text-xs text-muted-foreground">{speed} km/h</span>
                    <Crosshair className="h-3.5 w-3.5 text-muted-foreground/70" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
