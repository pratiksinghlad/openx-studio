import type { ParameterDomainCategory, ScenarioParameterMetadata } from '../types/simulation.ts';

export interface DomainCategoryInfo {
  id: ParameterDomainCategory;
  name: string;
  label: string;
  description: string;
  priority: number;
}

export const DOMAIN_CATEGORIES: Record<ParameterDomainCategory, DomainCategoryInfo> = {
  odd: {
    id: 'odd',
    name: 'ODD & Environment',
    label: 'ODD',
    description: 'Operational Design Domain: Weather, Atmosphere, Lighting & Road Conditions',
    priority: 1,
  },
  behavior: {
    id: 'behavior',
    name: 'Behavior & Maneuver',
    label: 'BEHAVIOR',
    description: 'Dynamic maneuvers, speeds, triggers, headway, TTC & trajectories',
    priority: 2,
  },
  entity: {
    id: 'entity',
    name: 'Entities & Assets',
    label: 'ENTITY',
    description: 'Vehicle models, catalog references, bounding box & object classes',
    priority: 3,
  },
  general: {
    id: 'general',
    name: 'System & Execution',
    label: 'SYSTEM',
    description: 'Global scenario parameters, execution horizons & seeds',
    priority: 4,
  },
};

const GENERAL_PATTERNS = [
  /^(system|general|config|sim_config|run_config)/i,
  /(^|_|-)(seed|timeout|step_size|iteration|log_level|debug|version|license|run_id)($|_|-)/i,
];

const ODD_PATTERNS = [
  /^(odd|env|environment|weather|atmosphere)/i,
  /(^|_|-)(fog|visual_?range|visibility)($|_|-)/i,
  /(^|_|-)(rain|snow|hail|precipitation|precip|cloud|cloud_?state)($|_|-)/i,
  /(^|_|-)(sun|solar|illuminance|azimuth|elevation|intensity|lux|lx)($|_|-)/i,
  /(^|_|-)(wind|wind_?speed|wind_?dir|temperature|temp|ambient)($|_|-)/i,
  /(^|_|-)(friction|adhesion|surface|grade|slope|curvature|bank|wetness|ice|puddle)($|_|-)/i,
  /road_?(length|width|type|rule|limit|condition)/i,
  /speed_?limit|speedlimit|traffic_?rule/i,
  /time_?of_?day|datetime|lighting/i,
  /fog|visual_?range|precipitation|sun_intensity|sun_azimuth|sun_elevation|friction/i,
];

const ENTITY_PATTERNS = [
  /^(entity|vehicle|car|truck|bus|pedestrian|bike|bicycle|actor|object)/i,
  /(^|_|-)(catalog|model|category|dimension|wheelbase|color|asset)($|_|-)/i,
  /ego_?name|target_?name|host|lead|adversary|vehicle_?model|car_?model|vehicle_?category/i,
];

const BEHAVIOR_PATTERNS = [
  /^(behavior|maneuver|action|story|act|event|trigger)/i,
  /(^|_|-)(v_|speed|velocity|target_speed|ego_speed|init_speed|desired_speed)($|_|-)/i,
  /(^|_|-)(accel|decel|braking|throttle|jerk|rate)($|_|-)/i,
  /(^|_|-)(cut_?in|cutin|lane_?change|lanechange|lateral|steering|yaw|heading)($|_|-)/i,
  /(^|_|-)(offset|dx|dy|dz|ds|dt|delta_s|delta_t|headway|thw|ttc|gap)($|_|-)/i,
  /(^|_|-)(dist|distance|duration|delay|start_time|stop_time|trigger_time|time_to_collision|time_headway)($|_|-)/i,
  /(^|_|-)(target_lane|relative_lane|waypoint|trajectory|follow)($|_|-)/i,
  /speed|velocity|v_ego|v_target|cutin|lanechange|headway|thw|ttc|decel|braking/i,
];

export function detectDomainCategory(paramName: string): ParameterDomainCategory {
  const name = paramName.trim();
  if (GENERAL_PATTERNS.some((p) => p.test(name))) {
    return 'general';
  }
  if (ODD_PATTERNS.some((p) => p.test(name))) {
    return 'odd';
  }
  if (ENTITY_PATTERNS.some((p) => p.test(name))) {
    return 'entity';
  }
  if (BEHAVIOR_PATTERNS.some((p) => p.test(name))) {
    return 'behavior';
  }
  return 'general';
}

export function inferParameterUnit(name: string, type: string): string | undefined {
  const n = name.toLowerCase();
  if (type === 'string' || type === 'boolean') return undefined;

  if (n.includes('speed') || n.includes('velocity') || n.startsWith('v_') || n.endsWith('_v')) {
    return 'm/s';
  }
  if (n.includes('accel') || n.includes('decel') || n.includes('braking')) {
    return 'm/s²';
  }
  if (
    n.includes('dist') ||
    n.includes('length') ||
    n.includes('width') ||
    n.includes('height') ||
    n.includes('visualrange') ||
    n.includes('visual_range') ||
    n.includes('visibility') ||
    n.endsWith('_dx') ||
    n.endsWith('_dy') ||
    n.endsWith('_ds') ||
    n.endsWith('_dt') ||
    n.startsWith('dx_') ||
    n.startsWith('dy_')
  ) {
    return 'm';
  }
  if (n.includes('duration') || n.includes('delay') || n.includes('time') || n.includes('thw') || n.includes('ttc')) {
    return 's';
  }
  if (n.includes('intensity') || n.includes('illuminance') || n.includes('lux') || n.includes('lx')) {
    return 'lx';
  }
  if (n.includes('azimuth') || n.includes('elevation') || n.includes('angle') || n.includes('heading') || n.includes('yaw')) {
    return '°';
  }
  if (n.includes('friction') || n.includes('adhesion')) {
    return 'µ';
  }
  if (n.includes('temp') || n.includes('temperature')) {
    return '°C';
  }
  if (n.includes('percent') || n.includes('ratio')) {
    return '%';
  }
  if (n.includes('mass') || n.includes('weight')) {
    return 'kg';
  }

  return undefined;
}

export function inferParameterMeaning(name: string, category: ParameterDomainCategory): string {
  const n = name.toLowerCase();

  // ODD Meanings
  if (n.includes('fog') || n.includes('visual_range') || n.includes('visualrange') || n.includes('visibility')) {
    return 'Atmospheric Fog Visual Range';
  }
  if (n.includes('sun_intensity') || (n.includes('sun') && n.includes('intensity'))) {
    return 'Direct Solar Illuminance';
  }
  if (n.includes('sun_azimuth') || (n.includes('sun') && n.includes('azimuth'))) {
    return 'Solar Azimuth Angle';
  }
  if (n.includes('sun_elevation') || (n.includes('sun') && n.includes('elevation'))) {
    return 'Solar Elevation Angle';
  }
  if (n.includes('snow') || n.includes('rain') || n.includes('precipitation')) {
    return 'Precipitation Rate & Type';
  }
  if (n.includes('friction')) {
    return 'Road Surface Friction Coefficient';
  }
  if (n.includes('wind')) {
    return 'Ambient Wind Velocity / Direction';
  }
  if (n.includes('temp')) {
    return 'Ambient Temperature';
  }

  // Behavior Meanings
  if (n.includes('cutin') || n.includes('cut_in')) {
    if (n.includes('dx') || n.includes('dist')) return 'Longitudinal Cut-In Trigger Distance';
    if (n.includes('dy') || n.includes('lat')) return 'Lateral Cut-In Displacement';
    if (n.includes('time') || n.includes('duration')) return 'Cut-In Maneuver Duration';
    return 'Vehicle Cut-In Maneuver Dynamic';
  }
  if (n.includes('lanechange') || n.includes('lane_change')) {
    return 'Lane Change Duration & Dynamics';
  }
  if (n.includes('ttc') || n.includes('time_to_collision')) {
    return 'Critical Time-To-Collision (TTC)';
  }
  if (n.includes('thw') || n.includes('headway')) {
    return 'Target Time Headway (THW)';
  }
  if (n.includes('ego') && (n.includes('speed') || n.includes('velocity') || n.startsWith('v_'))) {
    return 'Ego Vehicle Longitudinal Velocity';
  }
  if (n.includes('target') && (n.includes('speed') || n.includes('velocity') || n.startsWith('v_'))) {
    return 'Target Vehicle Longitudinal Velocity';
  }
  if (n.includes('speed') || n.includes('velocity')) {
    return 'Longitudinal Speed Setpoint';
  }
  if (n.includes('accel') || n.includes('braking') || n.includes('decel')) {
    return 'Longitudinal Acceleration / Deceleration Rate';
  }

  // Entity Meanings
  if (n.includes('model') || n.includes('catalog')) {
    return 'Vehicle Model / 3D Asset Reference';
  }
  if (n.includes('category')) {
    return 'ASAM Entity Classification';
  }

  // Fallback Clean Name
  const formatted = name
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^\w/, (c) => c.toUpperCase());

  const catInfo = DOMAIN_CATEGORIES[category] || DOMAIN_CATEGORIES.general;
  return `${catInfo.label}: ${formatted}`;
}

export function classifyParameter(param: ScenarioParameterMetadata): ScenarioParameterMetadata {
  const category = param.category || detectDomainCategory(param.name || '');
  const unit = param.unit || inferParameterUnit(param.name || '', param.type || '');
  const meaning = param.meaning || inferParameterMeaning(param.name || '', category);

  return {
    ...param,
    category,
    unit,
    meaning,
  };
}

export function sortParametersByDomain(params: ScenarioParameterMetadata[]): ScenarioParameterMetadata[] {
  const categoryPriority: Record<ParameterDomainCategory, number> = {
    odd: 1,
    behavior: 2,
    entity: 3,
    general: 4,
  };

  return [...params]
    .map(classifyParameter)
    .sort((a, b) => {
      const pA = categoryPriority[a.category || 'general'] || 4;
      const pB = categoryPriority[b.category || 'general'] || 4;
      if (pA !== pB) {
        return pA - pB;
      }
      return (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' });
    });
}

export function extractDomainCounts(params: ScenarioParameterMetadata[]): Record<ParameterDomainCategory | 'all', number> {
  const counts: Record<ParameterDomainCategory | 'all', number> = {
    all: params.length,
    odd: 0,
    behavior: 0,
    entity: 0,
    general: 0,
  };

  for (const p of params) {
    const cat = p.category || detectDomainCategory(p.name || '');
    const validCat: ParameterDomainCategory =
      cat === 'odd' || cat === 'behavior' || cat === 'entity' || cat === 'general' ? cat : 'general';
    counts[validCat] = (counts[validCat] || 0) + 1;
  }

  return counts;
}

export function formatParameterDisplayValue(param: ScenarioParameterMetadata): string {
  const val = param.value;
  const numVal = parseFloat(val);

  if (!isNaN(numVal) && param.unit) {
    if (param.unit === 'm/s' && !isNaN(numVal)) {
      const kmh = (numVal * 3.6).toFixed(1);
      return `${numVal.toFixed(1)} m/s (${kmh} km/h)`;
    }
    return `${val} ${param.unit}`;
  }

  return val;
}
