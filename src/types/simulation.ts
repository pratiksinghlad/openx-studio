export interface RoadGeometryPoint {
  s: number;
  x: number;
  y: number;
  z: number;
  h: number;
  p: number;
  r: number;
  endpoint: boolean;
}

export interface LaneSurfaceGeometry {
  road_id: number;
  lane_section_index: number;
  lane_id: number;
  lane_type: number;
  road_edge: boolean;
  left_boundary: RoadGeometryPoint[];
  right_boundary: RoadGeometryPoint[];
}

export interface RoadMarkGeometry {
  road_id: number;
  lane_section_index: number;
  lane_id: number;
  type: string;
  color: string;
  width: number;
  line_length: number;
  line_space: number;
  points: RoadGeometryPoint[];
}

export interface LaneCenterGeometry {
  road_id: number;
  lane_section_index: number;
  lane_id: number;
  reference_line: boolean;
  center_lane: boolean;
  points: RoadGeometryPoint[];
}

export interface RoadObjectGeometry {
  road_id: number;
  id: number;
  name: string;
  type: string;
  width_start: number;
  width_end: number;
  height_start: number;
  height_end: number;
  points: RoadGeometryPoint[];
}

export interface RoadFeatureBoxGeometry {
  road_id: number;
  id: number;
  name: string;
  type: string;
  kind: string;
  x: number;
  y: number;
  z: number;
  h: number;
  p: number;
  r: number;
  width: number;
  length: number;
  height: number;
}

export interface ScenarioRoadGeometry {
  odr_filename: string;
  lane_surfaces: LaneSurfaceGeometry[];
  road_marks: RoadMarkGeometry[];
  lane_centers: LaneCenterGeometry[];
  road_objects: RoadObjectGeometry[];
  road_feature_boxes: RoadFeatureBoxGeometry[];
}

export interface ScenarioObjectState {
  name: string;
  id: number;
  model_id: number;
  ctrl_type: number;
  timestamp: number;
  x: number;
  y: number;
  z: number;
  h: number;
  p: number;
  r: number;
  road_id: number;
  junction_id: number;
  t: number;
  lane_id: number;
  lane_offset: number;
  s: number;
  speed: number;
  center_offset_x: number;
  center_offset_y: number;
  center_offset_z: number;
  width: number;
  length: number;
  height: number;
  object_type: number;
  object_category: number;
  has_ghost: boolean;
  sensor_x: number;
  sensor_y: number;
  sensor_z: number;
  trail_x: number;
  trail_y: number;
  trail_z: number;
  wheel_angle: number;
  wheel_rot: number;
}

export interface ScenarioFrame {
  simulation_time: number;
  time_step: number;
  status: number;
  quit: boolean;
  object_states: ScenarioObjectState[];
}

export interface PlaybackState {
  isLoaded: boolean;
  isPlaying: boolean;
  isCompleted: boolean;
  currentTime: number;
  speed: number;
  objectCount: number;
  statusText: string;
}

export interface ScenarioFileHeaderMetadata {
  description?: string;
  author?: string;
  date?: string;
  revMajor?: string;
  revMinor?: string;
}

export type ParameterDomainCategory = 'odd' | 'behavior' | 'entity' | 'general';

export interface ScenarioParameterMetadata {
  name: string;
  type: string;
  value: string;
  category?: ParameterDomainCategory;
  meaning?: string;
  unit?: string;
  description?: string;
}

export interface ScenarioRoadMetadata {
  id?: string;
  name?: string;
  length?: number;
  speedMax?: number;
  rule?: string;
  laneCount?: number;
}

export interface ScenarioVehicleMetadata {
  name: string;
  model: string;
  category: string;
  color?: string;
}

export interface ScenarioEnvironmentMetadata {
  sunAzimuth?: number;
  sunElevation?: number;
  sunIntensity?: number;
  windSpeed?: number;
  windDirection?: number;
  friction?: number;
  fogVisualRange?: number;
  precipitationType?: 'dry' | 'rain' | 'snow' | 'hail' | string;
  precipitationIntensity?: number;
  cloudState?: string;
  temperature?: number;
  dateTime?: string;
}

export interface ScenarioBehaviorMetadata {
  stories?: string[];
  acts?: string[];
  maneuvers?: string[];
  events?: string[];
  actions?: string[];
  startTriggers?: string[];
  stopTriggers?: string[];
}

export interface ScenarioMetadata {
  fileHeader?: ScenarioFileHeaderMetadata;
  parameters?: ScenarioParameterMetadata[];
  roadInfo?: ScenarioRoadMetadata;
  vehicles?: ScenarioVehicleMetadata[];
  environment?: ScenarioEnvironmentMetadata;
  behavior?: ScenarioBehaviorMetadata;
}

export interface ScenarioFileValidation {
  valid: boolean;
  xoscFile?: File | null;
  xodrFile?: File | null;
  xoscName?: string;
  xodrName?: string;
  error?: string;
  warnings?: string[];
}

