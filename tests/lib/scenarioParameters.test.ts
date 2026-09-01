import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  detectDomainCategory,
  inferParameterUnit,
  inferParameterMeaning,
  classifyParameter,
  sortParametersByDomain,
  extractDomainCounts,
  formatParameterDisplayValue,
} from '../../src/lib/scenarioParameters.ts';
import type { ScenarioParameterMetadata } from '../../src/types/simulation.ts';

describe('Scenario Parameters Classification and Domain Ordering', () => {
  it('correctly classifies ODD (Operational Design Domain) parameters', () => {
    assert.equal(detectDomainCategory('Weather_Fog_VisualRange'), 'odd');
    assert.equal(detectDomainCategory('Sun_Intensity'), 'odd');
    assert.equal(detectDomainCategory('sun_azimuth'), 'odd');
    assert.equal(detectDomainCategory('Road_Friction'), 'odd');
    assert.equal(detectDomainCategory('Snow_Intensity'), 'odd');
    assert.equal(detectDomainCategory('SpeedLimit_Kmh'), 'odd');
    assert.equal(detectDomainCategory('Ambient_Temperature'), 'odd');
  });

  it('correctly classifies Behavior and Dynamic Maneuver parameters', () => {
    assert.equal(detectDomainCategory('Ego_Target_Speed'), 'behavior');
    assert.equal(detectDomainCategory('v_ego'), 'behavior');
    assert.equal(detectDomainCategory('CutIn_dx'), 'behavior');
    assert.equal(detectDomainCategory('CutIn_dy'), 'behavior');
    assert.equal(detectDomainCategory('LaneChange_Duration'), 'behavior');
    assert.equal(detectDomainCategory('TTC_Threshold'), 'behavior');
    assert.equal(detectDomainCategory('THW_Setpoint'), 'behavior');
    assert.equal(detectDomainCategory('Decel_Rate'), 'behavior');
  });

  it('correctly classifies Entity and Vehicle parameters', () => {
    assert.equal(detectDomainCategory('Vehicle_Model'), 'entity');
    assert.equal(detectDomainCategory('Vehicle_Category'), 'entity');
    assert.equal(detectDomainCategory('Car_Length'), 'entity');
    assert.equal(detectDomainCategory('Catalog_Reference'), 'entity');
  });

  it('correctly classifies General and System parameters', () => {
    assert.equal(detectDomainCategory('Random_Seed'), 'general');
    assert.equal(detectDomainCategory('Execution_Timeout'), 'general');
  });

  it('infers accurate physical engineering units', () => {
    assert.equal(inferParameterUnit('Target_Speed', 'double'), 'm/s');
    assert.equal(inferParameterUnit('CutIn_dx', 'double'), 'm');
    assert.equal(inferParameterUnit('Sun_Intensity', 'double'), 'lx');
    assert.equal(inferParameterUnit('LaneChange_Duration', 'double'), 's');
    assert.equal(inferParameterUnit('Road_Friction', 'double'), 'µ');
    assert.equal(inferParameterUnit('Sun_Azimuth', 'double'), '°');
    assert.equal(inferParameterUnit('Decel_Rate', 'double'), 'm/s²');
    assert.equal(inferParameterUnit('Ambient_Temp', 'double'), '°C');
    assert.equal(inferParameterUnit('Vehicle_Name', 'string'), undefined);
  });

  it('infers human-readable semantic meanings', () => {
    assert.equal(inferParameterMeaning('Weather_Fog_VisualRange', 'odd'), 'Atmospheric Fog Visual Range');
    assert.equal(inferParameterMeaning('Sun_Intensity', 'odd'), 'Direct Solar Illuminance');
    assert.equal(inferParameterMeaning('CutIn_dx', 'behavior'), 'Longitudinal Cut-In Trigger Distance');
    assert.equal(inferParameterMeaning('CutIn_dy', 'behavior'), 'Lateral Cut-In Displacement');
    assert.equal(inferParameterMeaning('LaneChange_Duration', 'behavior'), 'Lane Change Duration & Dynamics');
    assert.equal(inferParameterMeaning('TTC_Threshold', 'behavior'), 'Critical Time-To-Collision (TTC)');
  });

  it('classifies parameter and attaches inferred category, unit, and semantic meaning', () => {
    const raw: ScenarioParameterMetadata = {
      name: 'Weather_Fog_VisualRange',
      type: 'double',
      value: '150.0',
    };
    const classified = classifyParameter(raw);
    assert.equal(classified.category, 'odd');
    assert.equal(classified.unit, 'm');
    assert.equal(classified.meaning, 'Atmospheric Fog Visual Range');
    assert.equal(classified.value, '150.0');

    const rawBehavior: ScenarioParameterMetadata = {
      name: 'Target_Speed',
      type: 'double',
      value: '25.0',
    };
    const classifiedBehavior = classifyParameter(rawBehavior);
    assert.equal(classifiedBehavior.category, 'behavior');
    assert.equal(classifiedBehavior.unit, 'm/s');
    assert.equal(classifiedBehavior.meaning, 'Target Vehicle Longitudinal Velocity');
  });

  it('strictly orders parameters: ODD first, then Behavior, then Entity, then General', () => {
    const rawParams: ScenarioParameterMetadata[] = [
      { name: 'Execution_Timeout', type: 'double', value: '60' }, // general
      { name: 'Vehicle_Model', type: 'string', value: 'car_white' }, // entity
      { name: 'Target_Speed', type: 'double', value: '13.88' }, // behavior
      { name: 'Weather_Fog_VisualRange', type: 'double', value: '100.0' }, // odd
      { name: 'CutIn_dx', type: 'double', value: '25.0' }, // behavior
      { name: 'Sun_Intensity', type: 'double', value: '17500' }, // odd
    ];

    const sorted = sortParametersByDomain(rawParams);

    // ODD should be first
    assert.equal(sorted[0].category, 'odd');
    assert.equal(sorted[1].category, 'odd');
    // Behavior should be second
    assert.equal(sorted[2].category, 'behavior');
    assert.equal(sorted[3].category, 'behavior');
    // Entity should be third
    assert.equal(sorted[4].category, 'entity');
    // General should be fourth
    assert.equal(sorted[5].category, 'general');
  });

  it('calculates domain counts correctly', () => {
    const rawParams: ScenarioParameterMetadata[] = [
      { name: 'Sun_Intensity', type: 'double', value: '17500' },
      { name: 'Road_Friction', type: 'double', value: '0.7' },
      { name: 'Target_Speed', type: 'double', value: '13.88' },
      { name: 'Vehicle_Model', type: 'string', value: 'sedan' },
      { name: 'Seed', type: 'integer', value: '42' },
    ];

    const counts = extractDomainCounts(rawParams);
    assert.equal(counts.all, 5);
    assert.equal(counts.odd, 2);
    assert.equal(counts.behavior, 1);
    assert.equal(counts.entity, 1);
    assert.equal(counts.general, 1);
  });

  it('formats display values with converted units and labels', () => {
    const p1: ScenarioParameterMetadata = {
      name: 'Ego_Speed',
      type: 'double',
      value: '20.0',
      unit: 'm/s',
    };
    assert.equal(formatParameterDisplayValue(p1), '20.0 m/s (72.0 km/h)');

    const p2: ScenarioParameterMetadata = {
      name: 'Sun_Intensity',
      type: 'double',
      value: '17500',
      unit: 'lx',
    };
    assert.equal(formatParameterDisplayValue(p2), '17500 lx');
  });

  it('filters parameters accurately by domain category and search query', () => {
    const rawParams: ScenarioParameterMetadata[] = [
      { name: 'Weather_Fog_VisualRange', type: 'double', value: '100.0' },
      { name: 'Ego_Target_Speed', type: 'double', value: '25.0' },
      { name: 'Vehicle_Model', type: 'string', value: 'sedan_blue' },
      { name: 'Random_Seed', type: 'integer', value: '1234' },
    ];
    const sorted = sortParametersByDomain(rawParams);

    // Filter by category 'odd'
    const oddOnly = sorted.filter((p) => p.category === 'odd');
    assert.equal(oddOnly.length, 1);
    assert.equal(oddOnly[0].name, 'Weather_Fog_VisualRange');

    // Filter by category 'behavior'
    const behaviorOnly = sorted.filter((p) => p.category === 'behavior');
    assert.equal(behaviorOnly.length, 1);
    assert.equal(behaviorOnly[0].name, 'Ego_Target_Speed');

    // Filter by text search 'sedan'
    const searchTerm = 'sedan';
    const textMatches = sorted.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm) ||
        p.value.toLowerCase().includes(searchTerm) ||
        (p.meaning && p.meaning.toLowerCase().includes(searchTerm))
    );
    assert.equal(textMatches.length, 1);
    assert.equal(textMatches[0].name, 'Vehicle_Model');
  });
});

