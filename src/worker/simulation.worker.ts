import {
  MainToWorkerMessage,
  WorkerToMainMessage,
  LoadScenarioPayload,
} from '../types/protocol';
import {
  ScenarioRoadGeometry,
  LaneSurfaceGeometry,
  RoadMarkGeometry,
  LaneCenterGeometry,
  RoadObjectGeometry,
  RoadFeatureBoxGeometry,
  RoadGeometryPoint,
  ScenarioFrame,
  ScenarioObjectState,
  ScenarioMetadata,
  ScenarioFileHeaderMetadata,
  ScenarioParameterMetadata,
  ScenarioRoadMetadata,
  ScenarioVehicleMetadata,
  ScenarioEnvironmentMetadata,
} from '../types/simulation';

let esminiModule: any = null;
let currentScenario: any = null;
let isPlaying = false;
let playbackSpeed = 1.0;
let simulationIntervalId: any = null;
const FIXED_DT = 0.05; // 20 Hz simulation step
const BASE_INTERVAL_MS = 50; // 50ms per step at 1x

let frameHistory: ScenarioFrame[] = [];
let currentHistoryIndex = -1;
let currentScenarioPath = '';
let totalDuration = 10.0;

function vectorToArray<T = any>(vector: any): T[] {
  if (!vector || typeof vector.size !== 'function') {
    return Array.isArray(vector) ? vector : [];
  }
  const items: T[] = [];
  const len = vector.size();
  for (let i = 0; i < len; i++) {
    items.push(vector.get(i));
  }
  return items;
}

function convertPoint(pt: any): RoadGeometryPoint {
  return {
    s: pt.s || 0,
    x: pt.x || 0,
    y: pt.y || 0,
    z: pt.z || 0,
    h: pt.h || 0,
    p: pt.p || 0,
    r: pt.r || 0,
    endpoint: Boolean(pt.endpoint),
  };
}

function convertPoints(pointsVec: any): RoadGeometryPoint[] {
  return vectorToArray(pointsVec).map(convertPoint);
}

function convertRoadGeometry(raw: any): ScenarioRoadGeometry {
  const laneSurfaces: LaneSurfaceGeometry[] = vectorToArray(raw.lane_surfaces).map((s: any) => ({
    road_id: s.road_id,
    lane_section_index: s.lane_section_index,
    lane_id: s.lane_id,
    lane_type: s.lane_type,
    road_edge: Boolean(s.road_edge),
    left_boundary: convertPoints(s.left_boundary),
    right_boundary: convertPoints(s.right_boundary),
  }));

  const roadMarks: RoadMarkGeometry[] = vectorToArray(raw.road_marks).map((m: any) => ({
    road_id: m.road_id,
    lane_section_index: m.lane_section_index,
    lane_id: m.lane_id,
    type: m.type || '',
    color: m.color || '',
    width: m.width || 0.15,
    line_length: m.line_length || 0,
    line_space: m.line_space || 0,
    points: convertPoints(m.points),
  }));

  const laneCenters: LaneCenterGeometry[] = raw.lane_centers
    ? vectorToArray(raw.lane_centers).map((c: any) => ({
        road_id: c.road_id,
        lane_section_index: c.lane_section_index,
        lane_id: c.lane_id,
        reference_line: Boolean(c.reference_line),
        center_lane: Boolean(c.center_lane),
        points: convertPoints(c.points),
      }))
    : [];

  const roadObjects: RoadObjectGeometry[] = raw.road_objects
    ? vectorToArray(raw.road_objects).map((o: any) => ({
        road_id: o.road_id,
        id: o.id,
        name: o.name || '',
        type: o.type || '',
        width_start: o.width_start || 0,
        width_end: o.width_end || 0,
        height_start: o.height_start || 0,
        height_end: o.height_end || 0,
        points: convertPoints(o.points),
      }))
    : [];

  const roadFeatureBoxes: RoadFeatureBoxGeometry[] = raw.road_feature_boxes
    ? vectorToArray(raw.road_feature_boxes).map((b: any) => ({
        road_id: b.road_id,
        id: b.id,
        name: b.name || '',
        type: b.type || '',
        kind: b.kind || '',
        x: b.x || 0,
        y: b.y || 0,
        z: b.z || 0,
        h: b.h || 0,
        p: b.p || 0,
        r: b.r || 0,
        width: b.width || 0,
        length: b.length || 0,
        height: b.height || 0,
      }))
    : [];

  return {
    odr_filename: raw.odr_filename || '',
    lane_surfaces: laneSurfaces,
    road_marks: roadMarks,
    lane_centers: laneCenters,
    road_objects: roadObjects,
    road_feature_boxes: roadFeatureBoxes,
  };
}

function convertObjectState(raw: any): ScenarioObjectState {
  return {
    name: raw.name || '',
    id: raw.id ?? 0,
    model_id: raw.model_id ?? 0,
    ctrl_type: raw.ctrl_type ?? 0,
    timestamp: raw.timestamp ?? 0,
    x: raw.x ?? 0,
    y: raw.y ?? 0,
    z: raw.z ?? 0,
    h: raw.h ?? 0,
    p: raw.p ?? 0,
    r: raw.r ?? 0,
    road_id: raw.road_id ?? 0,
    junction_id: raw.junction_id ?? 0,
    t: raw.t ?? 0,
    lane_id: raw.lane_id ?? 0,
    lane_offset: raw.lane_offset ?? 0,
    s: raw.s ?? 0,
    speed: raw.speed ?? 0,
    center_offset_x: raw.center_offset_x ?? 0,
    center_offset_y: raw.center_offset_y ?? 0,
    center_offset_z: raw.center_offset_z ?? 0,
    width: raw.width ?? 1.8,
    length: raw.length ?? 4.5,
    height: raw.height ?? 1.5,
    object_type: raw.object_type ?? 0,
    object_category: raw.object_category ?? 0,
    has_ghost: Boolean(raw.has_ghost),
    sensor_x: raw.sensor_x ?? 0,
    sensor_y: raw.sensor_y ?? 0,
    sensor_z: raw.sensor_z ?? 0,
    trail_x: raw.trail_x ?? 0,
    trail_y: raw.trail_y ?? 0,
    trail_z: raw.trail_z ?? 0,
    wheel_angle: raw.wheel_angle ?? 0,
    wheel_rot: raw.wheel_rot ?? 0,
  };
}

function convertFrame(raw: any): ScenarioFrame {
  const objectStates = vectorToArray(raw.object_states).map(convertObjectState);
  return {
    simulation_time: raw.simulation_time ?? 0,
    time_step: raw.time_step ?? 0,
    status: raw.status ?? 0,
    quit: Boolean(raw.quit),
    object_states: objectStates,
  };
}

function postMsg(msg: WorkerToMainMessage) {
  self.postMessage(msg);
}

function postLog(level: 'info' | 'warn' | 'error', message: string) {
  postMsg({
    type: 'LOG',
    payload: { level, message },
  });
}

function postError(message: string, details?: string) {
  postMsg({
    type: 'ERROR',
    payload: { message, details },
  });
}

function ensureDirectory(path: string) {
  if (!esminiModule || !esminiModule.FS) return;
  const segments = path.split('/').filter(Boolean);
  let current = '';
  for (const seg of segments) {
    current += '/' + seg;
    try {
      esminiModule.FS.mkdir(current);
    } catch {}
  }
}

function writeVirtualFile(path: string, content: string | ArrayBuffer | Uint8Array) {
  if (!esminiModule || !esminiModule.FS) return;
  const normalized = path.startsWith('/') ? path : '/' + path;
  const lastSlash = normalized.lastIndexOf('/');
  if (lastSlash > 0) {
    ensureDirectory(normalized.substring(0, lastSlash));
  }
  try {
    esminiModule.FS.unlink(normalized);
  } catch {}

  const data = typeof content === 'string'
    ? new TextEncoder().encode(content)
    : content instanceof ArrayBuffer
    ? new Uint8Array(content)
    : content;

  esminiModule.FS.writeFile(normalized, data);
}

let initPromise: Promise<boolean> | null = null;

async function initEsmini(): Promise<boolean> {
  if (esminiModule) {
    postMsg({ type: 'READY' });
    return true;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      postLog('info', 'Initializing esmini WebAssembly runtime...');
      const baseUrl = import.meta.env.BASE_URL.endsWith('/')
        ? import.meta.env.BASE_URL
        : `${import.meta.env.BASE_URL}/`;
      const esminiUrl = `${baseUrl}esmini.js`;
      const response = await fetch(esminiUrl);
      if (!response.ok) {
        throw new Error(`Failed to load ${esminiUrl}: status ${response.status}`);
      }
      const jsCode = await response.text();

      const factory = new Function(`${jsCode}; return esmini;`)();
      esminiModule = await factory({
        noInitialRun: true,
        print: (text: string) => postLog('info', `[esmini] ${text}`),
        printErr: (text: string) => postLog('warn', `[esmini] ${text}`),
      });

      postLog('info', 'esmini WASM runtime ready.');
      postMsg({ type: 'READY' });
      return true;
    } catch (err: any) {
      postError('Failed to initialize esmini WASM', err?.message || String(err));
      return false;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

function parseDurationFromXosc(xoscContent: string | ArrayBuffer): number {
  const xoscStr = typeof xoscContent === 'string'
    ? xoscContent
    : new TextDecoder().decode(xoscContent);

  // 1. Check explicit StopTrigger with SimulationTimeCondition
  const stopTriggerBlock = xoscStr.match(/<StopTrigger[\s\S]*?<\/StopTrigger>/i);
  if (stopTriggerBlock) {
    const stopMatch = stopTriggerBlock[0].match(/SimulationTimeCondition[^>]*value=["']([\d\.]+)["']/i);
    if (stopMatch && stopMatch[1]) {
      const val = parseFloat(stopMatch[1]);
      if (!isNaN(val) && val > 0) return val;
    }
  }

  // 2. Fallback: Find maximum SimulationTimeCondition value across the scenario
  const simTimeRegex = /SimulationTimeCondition[^>]*value=["']([\d\.]+)["']/gi;
  let maxTime = 0;
  let match: RegExpExecArray | null = null;
  while ((match = simTimeRegex.exec(xoscStr)) !== null) {
    const val = parseFloat(match[1]);
    if (!isNaN(val) && val > maxTime) {
      maxTime = val;
    }
  }

  if (maxTime > 0) {
    return maxTime;
  }

  return 10.0;
}

function parseScenarioMetadata(xoscContent: string | ArrayBuffer, xodrContent: string | ArrayBuffer): ScenarioMetadata {
  const xoscStr = typeof xoscContent === 'string' ? xoscContent : new TextDecoder().decode(xoscContent);
  const xodrStr = typeof xodrContent === 'string' ? xodrContent : new TextDecoder().decode(xodrContent);

  // 1. FileHeader
  let fileHeader: ScenarioFileHeaderMetadata | undefined;
  const headerMatch = xoscStr.match(/<FileHeader\s+([^>]+)\/?>/i);
  if (headerMatch) {
    const attrs = headerMatch[1];
    const desc = attrs.match(/description=["']([^"']*)["']/i)?.[1];
    const author = attrs.match(/author=["']([^"']*)["']/i)?.[1];
    const date = attrs.match(/date=["']([^"']*)["']/i)?.[1];
    const revMajor = attrs.match(/revMajor=["']([^"']*)["']/i)?.[1];
    const revMinor = attrs.match(/revMinor=["']([^"']*)["']/i)?.[1];
    fileHeader = { description: desc, author, date, revMajor, revMinor };
  }

  // 2. ParameterDeclarations
  const parameters: ScenarioParameterMetadata[] = [];
  const paramRegex = /<ParameterDeclaration\s+name=["']([^"']+)["']\s+parameterType=["']([^"']+)["']\s+value=["']([^"']+)["']/gi;
  let pMatch;
  while ((pMatch = paramRegex.exec(xoscStr)) !== null) {
    parameters.push({
      name: pMatch[1],
      type: pMatch[2],
      value: pMatch[3],
    });
  }

  // 3. RoadInfo
  let roadInfo: ScenarioRoadMetadata | undefined;
  const roadMatch = xodrStr.match(/<road\s+([^>]+)>/i);
  if (roadMatch) {
    const attrs = roadMatch[1];
    const id = attrs.match(/id=["']([^"']*)["']/i)?.[1];
    const name = attrs.match(/name=["']([^"']*)["']/i)?.[1];
    const length = parseFloat(attrs.match(/length=["']([^"']*)["']/i)?.[1] || '0');
    const rule = attrs.match(/rule=["']([^"']*)["']/i)?.[1];

    const speedMatch = xodrStr.match(/<speed\s+max=["']([^"']*)["']/i);
    const speedMax = speedMatch ? parseFloat(speedMatch[1]) : undefined;

    const laneMatches = xodrStr.match(/<lane\s+id=/gi);
    const laneCount = laneMatches ? laneMatches.length : undefined;

    roadInfo = { id, name, length, speedMax, rule, laneCount };
  }

  // 4. Vehicles
  const vehicles: ScenarioVehicleMetadata[] = [];
  const objRegex = /<ScenarioObject\s+name=["']([^"']+)["'][\s\S]*?<Vehicle\s+name=["']([^"']*)["']\s+vehicleCategory=["']([^"']*)["']/gi;
  let vMatch;
  while ((vMatch = objRegex.exec(xoscStr)) !== null) {
    vehicles.push({
      name: vMatch[1],
      model: vMatch[2] || vMatch[1],
      category: vMatch[3] || 'car',
    });
  }

  // 5. Environment
  let env: ScenarioEnvironmentMetadata | undefined;
  const sunAzMatch = xoscStr.match(/sun_azimuth.*?value=["']([\d\.-]+)["']/i);
  const sunElMatch = xoscStr.match(/sun_elevation.*?value=["']([\d\.-]+)["']/i);
  const sunIntMatch = xoscStr.match(/sun_intensity.*?value=["']([\d\.-]+)["']/i);
  const windMatch = xoscStr.match(/wind_speed.*?value=["']([\d\.-]+)["']/i);
  if (sunAzMatch || sunElMatch || sunIntMatch || windMatch) {
    env = {
      sunAzimuth: sunAzMatch ? parseFloat(sunAzMatch[1]) : undefined,
      sunElevation: sunElMatch ? parseFloat(sunElMatch[1]) : undefined,
      sunIntensity: sunIntMatch ? parseFloat(sunIntMatch[1]) : undefined,
      windSpeed: windMatch ? parseFloat(windMatch[1]) : undefined,
    };
  }

  return {
    fileHeader,
    parameters: parameters.length > 0 ? parameters : undefined,
    roadInfo,
    vehicles: vehicles.length > 0 ? vehicles : undefined,
    environment: env,
  };
}

async function loadScenario(payload: LoadScenarioPayload) {
  if (!esminiModule) {
    postLog('info', 'Dynamically initializing esmini WASM runtime for scenario load...');
    const ok = await initEsmini();
    if (!ok || !esminiModule) {
      postError('esmini WASM module could not be initialized.');
      return;
    }
  }

  stopPlayback();

  try {
    postLog('info', `Loading scenario files: ${payload.xoscFile.name}, ${payload.xodrFile.name}`);

    ensureDirectory('/scenario/xosc');
    ensureDirectory('/scenario/xodr');
    ensureDirectory('/scenario/catalogs/VehicleCatalog');

    const xoscContent = payload.xoscFile.content;
    const xodrContent = payload.xodrFile.content;

    totalDuration = parseDurationFromXosc(xoscContent);
    const metadata = parseScenarioMetadata(xoscContent, xodrContent);

    const xoscName = payload.xoscFile.name.replace(/\\/g, '/').split('/').pop() || 'scenario.xosc';
    const xodrName = payload.xodrFile.name.replace(/\\/g, '/').split('/').pop() || 'road.xodr';

    writeVirtualFile(`/scenario/xosc/${xoscName}`, xoscContent);
    writeVirtualFile(`/scenario/xodr/${xodrName}`, xodrContent);
    writeVirtualFile(`/${xoscName}`, xoscContent);
    writeVirtualFile(`/${xodrName}`, xodrContent);
    writeVirtualFile(`/scenario/xodr/example.xodr`, xodrContent);
    writeVirtualFile(`/scenario/xosc/example.xosc`, xoscContent);

    if (payload.extraFiles) {
      for (const extra of payload.extraFiles) {
        writeVirtualFile(`/scenario/catalogs/${extra.name}`, extra.content);
        writeVirtualFile(`/catalogs/${extra.name}`, extra.content);
        writeVirtualFile(`/scenario/catalogs/VehicleCatalog/${extra.name}`, extra.content);
      }
    }

    currentScenarioPath = `/scenario/xosc/${xoscName}`;

    if (currentScenario) {
      try {
        currentScenario.delete();
      } catch {}
      currentScenario = null;
    }

    currentScenario = new esminiModule.OpenScenario(currentScenarioPath, {
      max_loop: 0,
      min_time_step: 0,
      max_time_step: 0,
      dt: FIXED_DT,
    });

    const rawRoadGeom = currentScenario.get_road_geometry();
    const roadGeometry = convertRoadGeometry(rawRoadGeom);
    const objectCount = currentScenario.get_object_count();

    const rawFrame = currentScenario.step_frame(0.0);
    const initialFrame = convertFrame(rawFrame);

    frameHistory = [initialFrame];
    currentHistoryIndex = 0;

    postLog('info', `Scenario loaded: ${roadGeometry.lane_surfaces.length} lanes, expected duration: ${totalDuration}s`);

    postMsg({
      type: 'SCENARIO_LOADED',
      payload: {
        roadGeometry,
        initialFrame,
        objectCount,
        duration: totalDuration,
        metadata,
      },
    });
  } catch (err: any) {
    postError('Error creating scenario engine', err?.message || String(err));
  }
}

function stepForward() {
  if (!currentScenario) return;

  // If browsing cached history
  if (currentHistoryIndex < frameHistory.length - 1) {
    currentHistoryIndex++;
    const frame = frameHistory[currentHistoryIndex];
    const atEnd = currentHistoryIndex >= frameHistory.length - 1;
    const isCompleted = atEnd && (frame.quit || currentScenario.is_quit());

    if (isCompleted && isPlaying) {
      pausePlayback();
    }

    postMsg({
      type: 'FRAME',
      payload: {
        frame,
        simulationTime: frame.simulation_time,
        duration: totalDuration,
        isCompleted,
      },
    });
    return;
  }

  // If already quit at end
  if (currentScenario.is_quit()) {
    if (isPlaying) {
      pausePlayback();
    }
    const lastFrame = frameHistory[currentHistoryIndex] || frameHistory[0];
    totalDuration = lastFrame.simulation_time;
    postMsg({
      type: 'FRAME',
      payload: {
        frame: lastFrame,
        simulationTime: lastFrame.simulation_time,
        duration: totalDuration,
        isCompleted: true,
      },
    });
    return;
  }

  // Simulate next step from C++ engine
  try {
    const rawFrame = currentScenario.step_frame(FIXED_DT);
    const frame = convertFrame(rawFrame);
    frameHistory.push(frame);
    currentHistoryIndex = frameHistory.length - 1;

    const isCompleted = frame.quit || currentScenario.is_quit();
    if (isCompleted) {
      totalDuration = frame.simulation_time;
      if (isPlaying) {
        pausePlayback();
      }
    } else {
      totalDuration = Math.max(totalDuration, frame.simulation_time);
    }

    postMsg({
      type: 'FRAME',
      payload: {
        frame,
        simulationTime: frame.simulation_time,
        duration: totalDuration,
        isCompleted,
      },
    });
  } catch (err: any) {
    pausePlayback();
    postError('Error during simulation step', err?.message || String(err));
  }
}

function stepBackward() {
  if (!currentScenario || currentHistoryIndex <= 0) return;

  currentHistoryIndex--;
  const frame = frameHistory[currentHistoryIndex];

  postMsg({
    type: 'FRAME',
    payload: {
      frame,
      simulationTime: frame.simulation_time,
      duration: totalDuration,
      isCompleted: false,
    },
  });

  postMsg({
    type: 'PLAYBACK_STATE',
    payload: {
      isPlaying: false,
      simulationTime: frame.simulation_time,
      duration: totalDuration,
      isCompleted: false,
      speed: playbackSpeed,
    },
  });
}

function seekToTime(targetTime: number) {
  if (!currentScenario || frameHistory.length === 0) return;

  const clampedTime = Math.max(0, Math.min(totalDuration, targetTime));

  // Find closest frame in cached history
  let bestIndex = 0;
  let minDiff = Math.abs(frameHistory[0].simulation_time - clampedTime);

  for (let i = 1; i < frameHistory.length; i++) {
    const diff = Math.abs(frameHistory[i].simulation_time - clampedTime);
    if (diff < minDiff) {
      minDiff = diff;
      bestIndex = i;
    }
  }

  if (clampedTime <= frameHistory[frameHistory.length - 1].simulation_time) {
    currentHistoryIndex = bestIndex;
  } else {
    // Step forward until reaching target time or completion
    let steps = 0;
    while (currentScenario && !currentScenario.is_quit() && steps < 500) {
      const rawFrame = currentScenario.step_frame(FIXED_DT);
      const frame = convertFrame(rawFrame);
      frameHistory.push(frame);
      currentHistoryIndex = frameHistory.length - 1;
      steps++;

      if (frame.simulation_time >= clampedTime || frame.quit) {
        if (frame.quit) {
          totalDuration = frame.simulation_time;
        }
        break;
      }
    }
  }

  const currentFrame = frameHistory[currentHistoryIndex];
  const atEnd = currentHistoryIndex >= frameHistory.length - 1;
  const isCompleted = atEnd && (currentFrame.quit || currentScenario.is_quit());

  postMsg({
    type: 'FRAME',
    payload: {
      frame: currentFrame,
      simulationTime: currentFrame.simulation_time,
      duration: totalDuration,
      isCompleted,
    },
  });

  postMsg({
    type: 'PLAYBACK_STATE',
    payload: {
      isPlaying,
      simulationTime: currentFrame.simulation_time,
      duration: totalDuration,
      isCompleted,
      speed: playbackSpeed,
    },
  });
}

function startPlayback() {
  if (isPlaying || !currentScenario) return;

  // If at the end of scenario, restart from beginning
  const isAtEnd =
    currentHistoryIndex >= frameHistory.length - 1 &&
    (Boolean(frameHistory[currentHistoryIndex]?.quit) || currentScenario.is_quit());

  if (isAtEnd) {
    currentHistoryIndex = 0;
    const initialFrame = frameHistory[0];
    postMsg({
      type: 'FRAME',
      payload: {
        frame: initialFrame,
        simulationTime: 0,
        duration: totalDuration,
        isCompleted: false,
      },
    });
  }

  isPlaying = true;
  const intervalMs = Math.max(10, Math.round(BASE_INTERVAL_MS / playbackSpeed));

  simulationIntervalId = setInterval(() => {
    stepForward();
  }, intervalMs);

  postMsg({
    type: 'PLAYBACK_STATE',
    payload: {
      isPlaying: true,
      simulationTime: frameHistory[currentHistoryIndex]?.simulation_time ?? 0,
      duration: totalDuration,
      isCompleted: false,
      speed: playbackSpeed,
    },
  });
}

function pausePlayback() {
  if (simulationIntervalId) {
    clearInterval(simulationIntervalId);
    simulationIntervalId = null;
  }
  isPlaying = false;

  const currentFrame = frameHistory[currentHistoryIndex] || frameHistory[0];
  const isCompleted =
    currentHistoryIndex >= frameHistory.length - 1 &&
    (Boolean(currentFrame?.quit) || (currentScenario && currentScenario.is_quit()));

  postMsg({
    type: 'PLAYBACK_STATE',
    payload: {
      isPlaying: false,
      simulationTime: currentFrame?.simulation_time ?? 0,
      duration: totalDuration,
      isCompleted,
      speed: playbackSpeed,
    },
  });
}

function stopPlayback() {
  if (simulationIntervalId) {
    clearInterval(simulationIntervalId);
    simulationIntervalId = null;
  }
  isPlaying = false;
  currentHistoryIndex = 0;

  const initialFrame = frameHistory[0];
  if (initialFrame) {
    postMsg({
      type: 'FRAME',
      payload: {
        frame: initialFrame,
        simulationTime: 0,
        duration: totalDuration,
        isCompleted: false,
      },
    });
  }

  postMsg({
    type: 'PLAYBACK_STATE',
    payload: {
      isPlaying: false,
      simulationTime: 0,
      duration: totalDuration,
      isCompleted: false,
      speed: playbackSpeed,
    },
  });
}

function setSpeed(speed: number) {
  playbackSpeed = Math.max(0.25, Math.min(8.0, speed));
  if (isPlaying) {
    if (simulationIntervalId) {
      clearInterval(simulationIntervalId);
    }
    const intervalMs = Math.max(10, Math.round(BASE_INTERVAL_MS / playbackSpeed));
    simulationIntervalId = setInterval(() => {
      stepForward();
    }, intervalMs);
  }

  const currentFrame = frameHistory[currentHistoryIndex] || frameHistory[0];
  const isCompleted =
    currentHistoryIndex >= frameHistory.length - 1 &&
    (Boolean(currentFrame?.quit) || (currentScenario && currentScenario.is_quit()));

  postMsg({
    type: 'PLAYBACK_STATE',
    payload: {
      isPlaying,
      simulationTime: currentFrame?.simulation_time ?? 0,
      duration: totalDuration,
      isCompleted,
      speed: playbackSpeed,
    },
  });
}

self.onmessage = (event: MessageEvent<MainToWorkerMessage>) => {
  // Origin verification for worker message event handler
  if (event.origin && self.location && event.origin !== self.location.origin) {
    console.warn(`[simulation.worker] Ignored message from unauthorized origin: ${event.origin}`);
    return;
  }

  const msg = event.data;
  if (!msg || typeof msg !== 'object' || typeof msg.type !== 'string') {
    return;
  }

  switch (msg.type) {
    case 'INIT':
      initEsmini();
      break;
    case 'LOAD_SCENARIO':
      loadScenario(msg.payload);
      break;
    case 'PLAY':
      startPlayback();
      break;
    case 'PAUSE':
      pausePlayback();
      break;
    case 'STOP':
      stopPlayback();
      break;
    case 'STEP_FORWARD':
      pausePlayback();
      stepForward();
      break;
    case 'STEP_BACKWARD':
      pausePlayback();
      stepBackward();
      break;
    case 'SEEK':
      seekToTime(msg.payload.targetTime);
      break;
    case 'SET_SPEED':
      setSpeed(msg.payload.speed);
      break;
    case 'RESET':
      stopPlayback();
      break;
  }
};
