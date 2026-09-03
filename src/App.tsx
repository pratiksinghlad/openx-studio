import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { SimulationWorkerClient } from './worker/workerClient';
import { ScenarioRoadGeometry, ScenarioFrame, ScenarioMetadata } from './types/simulation';
import { FilePayload } from './types/protocol';
import { CameraMode, CAMERA_MODES, VIEW_THEMES } from './renderer/types';
import { useTheme } from './hooks/useTheme';
import { useRouter } from './hooks/useRouter';
import { useScenarioRecorder } from './hooks/useScenarioRecorder';
import { FileUploader } from './components/FileUploader';
import type { ScenarioViewportHandle, ViewportState } from './components/ScenarioViewport';
import { ErrorBanner } from './components/ErrorBanner';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './components/ui/dialog';
import {
  Car,
  FolderOpen,
  Layers,
  Sparkles,
  Sun,
  Moon,
  Info,
  Download,
} from 'lucide-react';
import { usePWAInstall } from './hooks/usePWAInstall';
import { usePlayerKeyboardShortcuts } from './hooks/usePlayerKeyboardShortcuts';
import { InstallModal } from './components/InstallModal';
import { cn } from './lib/utils';
import { DEFAULT_STEP_INTERVAL_SECONDS } from './constants/playback';

const ScenarioViewport = lazy(() =>
  import('./components/ScenarioViewport').then((m) => ({ default: m.ScenarioViewport }))
);

const ScenarioInspector = lazy(() =>
  import('./components/ScenarioInspector').then((m) => ({ default: m.ScenarioInspector }))
);

const PlayerControls = lazy(() =>
  import('./components/PlayerControls').then((m) => ({ default: m.PlayerControls }))
);

const AboutPage = lazy(() =>
  import('./components/AboutPage').then((m) => ({ default: m.AboutPage }))
);

export function App() {
  const [workerClient, setWorkerClient] = useState<SimulationWorkerClient | null>(null);
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const [isLoadingScenario, setIsLoadingScenario] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [simulationTime, setSimulationTime] = useState(0);
  const [duration, setDuration] = useState(10.0);
  const [speed, setSpeed] = useState(1.0);
  const [cameraMode, setCameraMode] = useState<CameraMode>(CAMERA_MODES.ORBIT);
  const [cameraResetTrigger, setCameraResetTrigger] = useState(0);
  const { theme, toggleTheme, isSystem } = useTheme();
  const [statusText, setStatusText] = useState('Ready');
  const [scenarioName, setScenarioName] = useState<string>('');
  const [roadGeometry, setRoadGeometry] = useState<ScenarioRoadGeometry | null>(null);
  const [currentFrame, setCurrentFrame] = useState<ScenarioFrame | null>(null);
  const [scenarioMetadata, setScenarioMetadata] = useState<ScenarioMetadata | null>(null);
  const [showInspector, setShowInspector] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const { isAbout, navigateToAbout, navigateToHome } = useRouter();
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const [zoomPercent, setZoomPercent] = useState(100);
  const [angleDeg, setAngleDeg] = useState(0);

  const playerContainerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<ScenarioViewportHandle>(null);

  // Initialize Worker Client
  useEffect(() => {
    const client = new SimulationWorkerClient();
    setWorkerClient(client);

    const unsubReady = client.onReady(() => {
      setIsWorkerReady(true);
      setStatusText('Ready');
    });

    const unsubLoaded = client.onScenarioLoaded((geometry, initialFrame, _objectCount, initialDuration, metadata) => {
      setIsLoadingScenario(false);
      setIsLoaded(true);
      setIsPlaying(false);
      setIsCompleted(false);
      setRoadGeometry(geometry);
      setCurrentFrame(initialFrame);
      setScenarioMetadata(metadata || null);
      setSimulationTime(initialFrame.simulation_time);
      setDuration(initialDuration || 10.0);
      setStatusText('Ready');
      setShowUploadModal(false);
    });

    const unsubFrame = client.onFrame((frame, time, curDuration, completed) => {
      setCurrentFrame(frame);
      setSimulationTime(time);
      if (curDuration > 0) {
        setDuration(curDuration);
      }
      setIsCompleted(completed);
      if (completed) {
        setIsPlaying(false);
        setStatusText('Completed');
      }
    });

    const unsubPlayback = client.onPlaybackState((playing, time, curDuration, completed, curSpeed) => {
      setIsPlaying(playing);
      setSimulationTime(time);
      if (curDuration > 0) {
        setDuration(curDuration);
      }
      setIsCompleted(completed);
      setSpeed(curSpeed);
      if (playing) {
        setStatusText('Playing');
      } else if (completed) {
        setStatusText('Completed');
      } else {
        setStatusText('Paused');
      }
    });

    const unsubError = client.onError((message, details) => {
      setIsLoadingScenario(false);
      setIsPlaying(false);
      setErrorMessage(message);
      setErrorDetails(details || null);
      setStatusText('Error');
    });

    let idleId: number | null = null;
    let timerId: ReturnType<typeof setTimeout> | null = null;

    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(() => { client.init(); }, { timeout: 4000 });
    } else {
      timerId = setTimeout(() => { client.init(); }, 2500);
    }

    return () => {
      if (idleId !== null && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timerId !== null) {
        clearTimeout(timerId);
      }
      unsubReady();
      unsubLoaded();
      unsubFrame();
      unsubPlayback();
      unsubError();
      client.terminate();
    };
  }, []);

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleGoHome = useCallback(() => {
    if (workerClient) {
      workerClient.stop();
    }
    setIsLoaded(false);
    setScenarioName('');
    setRoadGeometry(null);
    setCurrentFrame(null);
    setScenarioMetadata(null);
    setShowInspector(false);
    setErrorMessage(null);
    setErrorDetails(null);
    navigateToHome();
  }, [workerClient, navigateToHome]);

  const handleScenarioReady = useCallback(
    (xosc: FilePayload, xodr: FilePayload, extraFiles?: FilePayload[]) => {
      if (!workerClient) return;

      setIsLoadingScenario(true);
      setErrorMessage(null);
      setErrorDetails(null);
      setScenarioName(xosc.name.replace(/\.xosc$/i, ''));
      setStatusText('Loading OpenSCENARIO...');

      workerClient.loadScenario({
        xoscFile: xosc,
        xodrFile: xodr,
        extraFiles,
      });
    },
    [workerClient]
  );

  const handlePlay = useCallback(() => {
    if (workerClient && isLoaded) {
      workerClient.play();
    }
  }, [workerClient, isLoaded]);

  const handlePause = useCallback(() => {
    if (workerClient && isLoaded) {
      workerClient.pause();
    }
  }, [workerClient, isLoaded]);

  const handleStop = useCallback(() => {
    if (workerClient && isLoaded) {
      workerClient.stop();
      setIsPlaying(false);
      setStatusText('Stopped');
    }
  }, [workerClient, isLoaded]);

  const handleStepForward = useCallback(() => {
    if (workerClient && isLoaded) {
      workerClient.stepForward(DEFAULT_STEP_INTERVAL_SECONDS);
    }
  }, [workerClient, isLoaded]);

  const handleStepBackward = useCallback(() => {
    if (workerClient && isLoaded) {
      workerClient.stepBackward(DEFAULT_STEP_INTERVAL_SECONDS);
    }
  }, [workerClient, isLoaded]);

  const handleSeek = useCallback(
    (time: number) => {
      if (workerClient && isLoaded) {
        workerClient.seek(time);
      }
    },
    [workerClient, isLoaded]
  );

  const handleSpeedChange = useCallback(
    (newSpeed: number) => {
      if (workerClient && isLoaded) {
        workerClient.setSpeed(newSpeed);
        setSpeed(newSpeed);
      }
    },
    [workerClient, isLoaded]
  );

  const handleCameraModeChange = useCallback((mode: CameraMode) => {
    setCameraMode(mode);
    if (mode === CAMERA_MODES.ORBIT) {
      setCameraResetTrigger((prev) => prev + 1);
    }
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    if (!playerContainerRef.current) return;

    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch((err) => {
        console.error('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error('Exit fullscreen failed:', err);
      });
    }
  }, []);

  const handleViewportState = useCallback((state: ViewportState) => {
    setZoomPercent(state.zoomPercent);
    setAngleDeg(state.angleDeg);
  }, []);

  const handleZoomIn = useCallback(() => {
    viewportRef.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    viewportRef.current?.zoomOut();
  }, []);

  const handleAngleReset = useCallback(() => {
    viewportRef.current?.resetAngle();
  }, []);

  const handleAutoPlayStart = useCallback(() => {
    if (workerClient && isLoaded) {
      if (isCompleted || simulationTime >= duration - 0.1) {
        workerClient.seek(0);
      }
      workerClient.play();
    }
  }, [workerClient, isLoaded, isCompleted, simulationTime, duration]);

  const {
    isRecording,
    recordedDuration,
    toggleRecording,
  } = useScenarioRecorder({
    scenarioName,
    isCompleted,
    onAutoPlayStart: handleAutoPlayStart,
  });

  const handleToggleRecord = useCallback(() => {
    const canvas = viewportRef.current?.getCanvas() || null;
    toggleRecording(canvas);
  }, [toggleRecording]);

  const handleInstallClick = useCallback(async () => {
    if (isInstallable) {
      const outcome = await promptInstall();
      if (outcome === 'unsupported') {
        setShowInstallModal(true);
      }
    } else {
      setShowInstallModal(true);
    }
  }, [isInstallable, promptInstall]);

  const handlePromptInstallFromModal = useCallback(async () => {
    await promptInstall();
    setShowInstallModal(false);
  }, [promptInstall]);

  usePlayerKeyboardShortcuts({
    isLoaded,
    isPlaying,
    isCompleted,
    currentSpeed: speed,
    currentCameraMode: cameraMode,
    disabled: showUploadModal || showInstallModal || showInspector || isAbout,
    onPlay: handlePlay,
    onPause: handlePause,
    onStop: handleStop,
    onStepForward: handleStepForward,
    onStepBackward: handleStepBackward,
    onSpeedChange: handleSpeedChange,
    onToggleFullscreen: handleToggleFullscreen,
    onToggleRecord: handleToggleRecord,
    onCameraModeChange: handleCameraModeChange,
    onZoomIn: handleZoomIn,
    onZoomOut: handleZoomOut,
    onAngleReset: handleAngleReset,
  });

  if (isAbout) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen w-full bg-background flex items-center justify-center text-muted-foreground text-sm font-medium">
            Loading About...
          </div>
        }
      >
        <AboutPage onBackToSimulator={navigateToHome} />
      </Suspense>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-background text-foreground overflow-hidden">
      {/* Top Navbar */}
      {!isFullscreen && (
        <header className="relative h-16 min-h-16 bg-card/95 backdrop-blur-md border-b border-border flex items-center justify-between px-4 sm:px-5 z-30 shrink-0 shadow-sm gap-3">
          {/* Left: Brand Logo & Title + Scenario Badge */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <button 
              onClick={handleGoHome}
              className="flex items-center gap-2.5 sm:gap-3 text-left hover:opacity-80 transition-opacity focus:outline-none shrink-0 cursor-pointer"
              aria-label="Go to Home"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25 shrink-0">
                <Car className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-foreground leading-tight">
                  OpenX Studio
                </h1>
                <span className="text-[10px] sm:text-xs font-medium text-muted-foreground tracking-wide">
                  OpenSCENARIO & OpenDRIVE
                </span>
              </div>
            </button>

            {/* Subtle Divider between Brand and Scenario Badge */}
            <div className="h-6 w-px bg-border/60 hidden sm:block shrink-0" />

            {/* Scenario Badge (Positioned towards left, smaller text size, interactive) */}
            <div className="min-w-0 flex items-center">
              {scenarioName ? (
                <button
                  type="button"
                  onClick={() => setShowInspector((prev) => !prev)}
                  className="group flex items-center gap-1.5 py-1 px-2.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg text-primary text-xs font-semibold max-w-[180px] sm:max-w-[260px] md:max-w-[320px] lg:max-w-[400px] truncate shadow-xs transition-colors cursor-pointer"
                  title={`Loaded Scenario: ${scenarioName} (Click to inspect)`}
                >
                  <Layers className="h-3.5 w-3.5 shrink-0 text-primary group-hover:scale-105 transition-transform" />
                  <span className="truncate">{scenarioName}</span>
                </button>
              ) : (
                <Badge
                  variant="outline"
                  className="gap-1.5 py-1 px-2.5 text-xs text-muted-foreground bg-muted/40 font-medium shadow-xs"
                >
                  <Sparkles
                    className={cn(
                      'h-3.5 w-3.5 shrink-0',
                      isLoadingScenario
                        ? 'text-amber-500 animate-spin'
                        : isWorkerReady
                        ? 'text-emerald-500'
                        : 'text-primary'
                    )}
                  />
                  <span className="hidden sm:inline">
                    {isLoadingScenario
                      ? 'Loading Simulation Engine...'
                      : isWorkerReady
                      ? 'esmini WASM Engine Ready'
                      : 'Ready to Load Scenario'}
                  </span>
                  <span className="sm:hidden">
                    {isLoadingScenario
                      ? 'Loading Engine...'
                      : isWorkerReady
                      ? 'Engine Ready'
                      : 'Ready'}
                  </span>
                </Badge>
              )}
            </div>
          </div>

          {/* Right: Header Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5 relative z-10 shrink-0">
            {isLoaded && (
              <Button
                variant={showInspector ? 'default' : 'outline'}
                size="default"
                onClick={() => setShowInspector((prev) => !prev)}
                className="gap-1.5 h-9 px-3 sm:px-3.5 text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer"
                aria-label="Toggle Scenario Inspector"
              >
                <Info className="h-4 w-4" />
                <span>Scenario Info</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="default"
              onClick={navigateToAbout}
              className="gap-1.5 h-9 px-2.5 sm:px-3 text-xs sm:text-sm font-semibold shadow-xs cursor-pointer"
              title="About OpenX Studio & Privacy"
              aria-label="About OpenX Studio & Privacy"
            >
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">About</span>
            </Button>

            {!isInstalled && (
              <Button
                variant="outline"
                size="default"
                onClick={handleInstallClick}
                className="gap-1.5 h-9 px-2.5 sm:px-3 text-xs sm:text-sm font-semibold shadow-xs hover:bg-primary/10 hover:text-primary hover:border-primary/40 cursor-pointer"
                title="Install OpenX Studio as Desktop App"
                aria-label="Install OpenX Studio as Desktop App"
              >
                <Download className="h-4 w-4 text-primary" />
                <span className="hidden md:inline">Install App</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="default"
              onClick={toggleTheme}
              className="h-9 w-9 p-0 text-foreground shadow-xs cursor-pointer"
              title={
                theme === VIEW_THEMES.LIGHT
                  ? isSystem
                    ? 'Switch to Dark Mode (System theme auto-detected)'
                    : 'Switch to Dark Mode'
                  : isSystem
                  ? 'Switch to Light Mode (System theme auto-detected)'
                  : 'Switch to Light Mode'
              }
              aria-label={
                theme === VIEW_THEMES.LIGHT ? 'Switch to Dark Mode' : 'Switch to Light Mode'
              }
            >
              {theme === VIEW_THEMES.LIGHT ? (
                <Moon className="h-4.5 w-4.5" />
              ) : (
                <Sun className="h-4.5 w-4.5" />
              )}
            </Button>

            {isLoaded && (
              <Button
                variant="outline"
                size="default"
                onClick={() => setShowUploadModal(true)}
                className="gap-1.5 sm:gap-2 h-9 px-2.5 sm:px-3.5 text-xs sm:text-sm font-semibold shadow-xs cursor-pointer"
                title="Upload another scenario"
              >
                <FolderOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Change Scenario</span>
                <span className="sm:hidden">Change</span>
              </Button>
            )}
          </div>
        </header>
      )}

      {/* Main Viewport Container */}
      <main
        className="relative flex-1 w-full h-full overflow-hidden bg-background"
        ref={playerContainerRef}
      >
        {errorMessage && (
          <ErrorBanner
            message={errorMessage}
            details={errorDetails || undefined}
            onDismiss={() => setErrorMessage(null)}
          />
        )}

        {/* 3D Simulation Viewport */}
        <Suspense fallback={<div className="absolute inset-0 bg-background" />}>
          <ScenarioViewport
            ref={viewportRef}
            roadGeometry={roadGeometry}
            currentFrame={currentFrame}
            metadata={scenarioMetadata}
            cameraMode={cameraMode}
            cameraResetTrigger={cameraResetTrigger}
            theme={theme}
            isLoaded={isLoaded}
            statusText={statusText}
            onOpenInspector={() => setShowInspector(true)}
            onFocusEntity={(id) => setSelectedEntityId(id)}
            selectedEntityId={selectedEntityId}
            onViewportState={handleViewportState}
          />
        </Suspense>

        {/* Scenario & Road Inspector Sheet */}
        <Suspense fallback={null}>
          <ScenarioInspector
            isOpen={showInspector}
            onClose={() => setShowInspector(false)}
            metadata={scenarioMetadata}
            currentFrame={currentFrame}
            scenarioName={scenarioName}
            onFocusEntity={(id) => setSelectedEntityId(id)}
            onOpenAbout={navigateToAbout}
          />
        </Suspense>

        {/* Scenario Upload Dialog (Modal when loaded, or fullscreen on initial state) */}
        {!isLoaded ? (
          <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-background">
            <div className="w-[min(94%,680px)] p-6 bg-card border border-border/70 rounded-2xl shadow-2xl animate-in fade-in-0 duration-200">
              <div className="mb-5 flex flex-col gap-1 text-center sm:text-left">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Load OpenSCENARIO Scenario
                </h2>
                <p className="text-xs text-muted-foreground">
                  Select or drag .xosc and .xodr files to start interactive 3D simulation playback.
                </p>
              </div>
              <FileUploader
                onScenarioReady={handleScenarioReady}
                isLoading={isLoadingScenario}
              />
            </div>
          </div>
        ) : (
          <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Load OpenSCENARIO Scenario</DialogTitle>
              </DialogHeader>
              <FileUploader
                onScenarioReady={handleScenarioReady}
                isLoading={isLoadingScenario}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Desktop PWA Install Modal */}
        <InstallModal
          isOpen={showInstallModal}
          onClose={() => setShowInstallModal(false)}
          isInstallable={isInstallable}
          isInstalled={isInstalled}
          onPromptInstall={handlePromptInstallFromModal}
        />

        {/* Minimal Unobtrusive Player Controls Dock */}
        <Suspense fallback={null}>
          <PlayerControls
            isPlaying={isPlaying}
            isLoaded={isLoaded}
            isCompleted={isCompleted}
            simulationTime={simulationTime}
            duration={duration}
            speed={speed}
            cameraMode={cameraMode}
            isFullscreen={isFullscreen}
            zoomPercent={zoomPercent}
            angleDeg={angleDeg}
            stepIntervalSeconds={DEFAULT_STEP_INTERVAL_SECONDS}
            isRecording={isRecording}
            recordedDuration={recordedDuration}
            onPlay={handlePlay}
            onPause={handlePause}
            onStop={handleStop}
            onStepForward={handleStepForward}
            onStepBackward={handleStepBackward}
            onSeek={handleSeek}
            onSpeedChange={handleSpeedChange}
            onCameraModeChange={handleCameraModeChange}
            onToggleFullscreen={handleToggleFullscreen}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onAngleReset={handleAngleReset}
            onToggleRecord={handleToggleRecord}
          />
        </Suspense>
      </main>
    </div>
  );
}

export default App;
