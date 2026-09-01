import React, { useState, useMemo } from 'react';
import {
  ScenarioMetadata,
  ScenarioFrame,
  ScenarioObjectState,
  ScenarioParameterMetadata,
  ParameterDomainCategory,
} from '../types/simulation';
import {
  X,
  Sliders,
  MapPin,
  Car,
  Sun,
  Wind,
  Layers,
  Calendar,
  User,
  FileText,
  Crosshair,
  Search,
  ShieldCheck,
  ExternalLink,
  CloudRain,
  Activity,
  Gauge,
  Workflow,
  Compass,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';
import {
  DOMAIN_CATEGORIES,
  sortParametersByDomain,
  extractDomainCounts,
  formatParameterDisplayValue,
} from '../lib/scenarioParameters';

interface ScenarioInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  metadata?: ScenarioMetadata | null;
  currentFrame: ScenarioFrame | null;
  scenarioName: string;
  onFocusEntity?: (entityId: number) => void;
  onOpenAbout?: () => void;
}

export const ScenarioInspector: React.FC<ScenarioInspectorProps> = ({
  isOpen,
  onClose,
  metadata,
  currentFrame,
  scenarioName,
  onFocusEntity,
  onOpenAbout,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ParameterDomainCategory | 'all'>('all');
  const [paramSearch, setParamSearch] = useState('');

  const rawParams = metadata?.parameters || [];
  const entities: ScenarioObjectState[] = currentFrame?.object_states || [];
  const sortedParams = useMemo(() => sortParametersByDomain(rawParams), [rawParams]);
  const domainCounts = useMemo(() => extractDomainCounts(sortedParams), [sortedParams]);

  const filteredParams = useMemo(() => {
    return sortedParams.filter((p) => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const term = paramSearch.toLowerCase().trim();
      if (!term) return matchCat;
      const matchText =
        p.name.toLowerCase().includes(term) ||
        p.value.toLowerCase().includes(term) ||
        (p.meaning && p.meaning.toLowerCase().includes(term));
      return matchCat && matchText;
    });
  }, [sortedParams, selectedCategory, paramSearch]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in-0 duration-200"
      onClick={onClose}
    >
      <aside
        className="w-[min(94vw,480px)] h-full bg-background/95 backdrop-blur-xl border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <InspectorHeader scenarioName={scenarioName} onClose={onClose} />

        <Tabs defaultValue="scenario" className="flex-1 flex flex-col min-h-0">
          <div className="px-4 pt-2.5 pb-2 border-b border-border/60">
            <TabsList className="w-full grid grid-cols-4 h-9">
              <TabsTrigger value="scenario" className="text-xs font-bold gap-1 px-1">
                <Sliders className="h-3.5 w-3.5" />
                <span>Scenario</span>
              </TabsTrigger>
              <TabsTrigger value="entities" className="text-xs font-bold gap-1 px-1">
                <Car className="h-3.5 w-3.5" />
                <span>Entities ({entities.length})</span>
              </TabsTrigger>
              <TabsTrigger value="road" className="text-xs font-bold gap-1 px-1">
                <MapPin className="h-3.5 w-3.5" />
                <span>Road</span>
              </TabsTrigger>
              <TabsTrigger value="standards" className="text-xs font-bold gap-1 px-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Legal</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-3.5">
            {/* TAB 1: SCENARIO (ODD FIRST, THEN BEHAVIOR, THEN PARAMETERS) */}
            <TabsContent value="scenario" className="mt-0 space-y-3">
              <ScenarioHeaderCard metadata={metadata} scenarioName={scenarioName} />
              <OddProfileCard metadata={metadata} />
              <BehaviorProfileCard metadata={metadata} />
              <ParametersExplorerCard
                parameters={filteredParams}
                domainCounts={domainCounts}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                paramSearch={paramSearch}
                onParamSearchChange={setParamSearch}
              />
            </TabsContent>

            {/* TAB 2: LIVE ENTITIES */}
            <TabsContent value="entities" className="mt-0 space-y-2.5">
              <EntityTelemetryList entities={entities} onFocusEntity={onFocusEntity} />
            </TabsContent>

            {/* TAB 3: ROAD SPECIFICATIONS */}
            <TabsContent value="road" className="mt-0 space-y-3">
              <RoadSpecificationsCard metadata={metadata} />
            </TabsContent>

            {/* TAB 4: STANDARDS & LICENSING */}
            <TabsContent value="standards" className="mt-0 space-y-3">
              <LegalAttributionCard onClose={onClose} onOpenAbout={onOpenAbout} />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </aside>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* SUB-COMPONENTS                                                             */
/* -------------------------------------------------------------------------- */

const InspectorHeader: React.FC<{ scenarioName: string; onClose: () => void }> = ({
  scenarioName,
  onClose,
}) => (
  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
    <div className="flex items-center gap-2.5">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
        <Layers className="h-4.5 w-4.5" />
      </div>
      <div>
        <h3 className="text-sm font-bold leading-tight text-foreground">Scenario & Road Inspector</h3>
        <p className="text-xs font-semibold text-primary font-mono truncate max-w-[280px]">
          {scenarioName || 'Unnamed Scenario'}
        </p>
      </div>
    </div>
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={onClose}
      aria-label="Close Inspector"
      className="rounded-md h-8 w-8 text-foreground"
    >
      <X className="h-4 w-4" />
    </Button>
  </div>
);

const ScenarioHeaderCard: React.FC<{
  metadata?: ScenarioMetadata | null;
  scenarioName: string;
}> = ({ metadata, scenarioName }) => {
  const header = metadata?.fileHeader;

  return (
    <Card className="p-3 border-border/70">
      <CardHeader className="p-0 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xs font-bold text-foreground">
            <FileText className="h-4 w-4 text-primary" />
            OpenSCENARIO Specification
          </CardTitle>
          <Badge variant="outline" className="text-[10px] font-mono font-bold bg-primary/5 text-primary border-primary/30">
            OpenSCENARIO {header?.revMajor || '1'}.{header?.revMinor || '0'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0 space-y-1.5 text-xs">
        <div className="flex justify-between items-center py-1 border-b border-border/40">
          <span className="font-semibold text-muted-foreground">Scenario Identifier:</span>
          <span className="font-bold text-xs text-foreground font-mono truncate max-w-[220px]">
            {scenarioName || 'Unnamed'}
          </span>
        </div>
        {header?.description && (
          <div className="py-1 border-b border-border/40">
            <span className="font-semibold text-muted-foreground block text-[11px]">Description:</span>
            <span className="font-medium text-xs text-foreground leading-snug">{header.description}</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          {header?.author && (
            <div className="text-[11px]">
              <span className="font-semibold text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" /> Author
              </span>
              <span className="font-bold text-foreground block truncate">{header.author}</span>
            </div>
          )}
          {header?.date && (
            <div className="text-[11px]">
              <span className="font-semibold text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Date
              </span>
              <span className="font-bold text-foreground block">
                {(() => {
                  try {
                    const d = new Date(header.date);
                    return isNaN(d.getTime()) ? header.date : d.toLocaleDateString();
                  } catch {
                    return header.date;
                  }
                })()}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const OddProfileCard: React.FC<{ metadata?: ScenarioMetadata | null }> = ({ metadata }) => {
  const env = metadata?.environment;
  const road = metadata?.roadInfo;

  return (
    <Card className="p-3 border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10">
      <CardHeader className="p-0 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
            <Compass className="h-4 w-4" />
            1. Operational Design Domain (ODD)
          </CardTitle>
          <Badge className="text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white hover:bg-emerald-700">
            Priority 1 · ODD
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0 space-y-2.5 text-xs">
        {/* Environment & Weather Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-background/80 border border-border/60 p-2 rounded-lg">
            <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
              <Sun className="h-3 w-3 text-amber-500" /> Sun Illuminance
            </span>
            <span className="font-mono text-xs font-bold text-foreground block mt-0.5">
              {env?.sunIntensity !== undefined ? `${env.sunIntensity} lx` : 'Standard Daylight'}
            </span>
          </div>

          <div className="bg-background/80 border border-border/60 p-2 rounded-lg">
            <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
              <CloudRain className="h-3 w-3 text-sky-500" /> Visibility / Fog
            </span>
            <span className="font-mono text-xs font-bold text-foreground block mt-0.5">
              {env?.fogVisualRange !== undefined ? `${env.fogVisualRange} m` : 'Clear (Unlimited)'}
            </span>
          </div>

          <div className="bg-background/80 border border-border/60 p-2 rounded-lg">
            <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
              <Gauge className="h-3 w-3 text-emerald-500" /> Road Surface Friction
            </span>
            <span className="font-mono text-xs font-bold text-foreground block mt-0.5">
              {env?.friction !== undefined ? `${env.friction.toFixed(2)} µ` : '1.00 µ (Dry Asphalt)'}
            </span>
          </div>

          <div className="bg-background/80 border border-border/60 p-2 rounded-lg">
            <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
              <Wind className="h-3 w-3 text-indigo-500" /> Wind &amp; Temp
            </span>
            <span className="font-mono text-xs font-bold text-foreground block mt-0.5">
              {env?.windSpeed !== undefined ? `${env.windSpeed} m/s` : 'Calm'}
              {env?.temperature !== undefined ? ` · ${(env.temperature - 273.15).toFixed(0)}°C` : ''}
            </span>
          </div>
        </div>

        {/* Precipitation / Cloud Banner if present */}
        {(env?.precipitationType || env?.cloudState) && (
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-sky-50/50 dark:bg-sky-950/30 border border-sky-500/20 text-[11px]">
            <span className="font-semibold text-sky-800 dark:text-sky-300">
              Weather State: {env.cloudState || 'Atmospheric'} {env.precipitationType ? `(${env.precipitationType})` : ''}
            </span>
            {env.precipitationIntensity !== undefined && (
              <span className="font-mono font-bold text-sky-900 dark:text-sky-200">
                Rate: {env.precipitationIntensity}
              </span>
            )}
          </div>
        )}

        {/* Road Rule Context */}
        <div className="flex justify-between items-center px-2 py-1 bg-muted/40 rounded border border-border/40 text-[11px]">
          <span className="text-muted-foreground font-medium">Road Infrastructure:</span>
          <span className="font-semibold text-foreground">
            {road?.rule ? (road.rule === 'RHT' ? 'Right-Hand Traffic (RHT)' : road.rule) : 'Standard RHT'} · {road?.length ? `${(road.length / 1000).toFixed(1)} km` : 'Open'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

const BehaviorProfileCard: React.FC<{ metadata?: ScenarioMetadata | null }> = ({ metadata }) => {
  const behavior = metadata?.behavior;
  const hasStory = behavior && (behavior.stories || behavior.acts || behavior.maneuvers || behavior.actions);

  return (
    <Card className="p-3 border-indigo-500/30 bg-indigo-50/20 dark:bg-indigo-950/10">
      <CardHeader className="p-0 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-400">
            <Activity className="h-4 w-4" />
            2. Dynamic Behavior &amp; Maneuvers
          </CardTitle>
          <Badge className="text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white hover:bg-indigo-700">
            Priority 2 · Behavior
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0 space-y-2 text-xs">
        {hasStory ? (
          <div className="space-y-1.5">
            {behavior.actions && behavior.actions.length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Maneuver Actions &amp; Dynamics:
                </span>
                <div className="flex flex-wrap gap-1">
                  {behavior.actions.map((act, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px] font-mono font-semibold">
                      {act.replace('Action', '')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {behavior.startTriggers && behavior.startTriggers.length > 0 && (
              <div className="pt-1 border-t border-border/40">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Activation Triggers:
                </span>
                <div className="flex flex-wrap gap-1">
                  {behavior.startTriggers.map((trig, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 border-indigo-500/30">
                      {trig.replace('Condition', '')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 p-2 rounded bg-background/60 border border-border/50">
            <Workflow className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
            <span className="text-[11px] text-muted-foreground font-medium leading-tight">
              Dynamic actor trajectories, longitudinal setpoints, and cut-in maneuvers defined via scenario parameters.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface ParametersExplorerProps {
  parameters: ScenarioParameterMetadata[];
  domainCounts: Record<ParameterDomainCategory | 'all', number>;
  selectedCategory: ParameterDomainCategory | 'all';
  onSelectCategory: (cat: ParameterDomainCategory | 'all') => void;
  paramSearch: string;
  onParamSearchChange: (val: string) => void;
}

const ParametersExplorerCard: React.FC<ParametersExplorerProps> = ({
  parameters,
  domainCounts,
  selectedCategory,
  onSelectCategory,
  paramSearch,
  onParamSearchChange,
}) => {
  return (
    <Card className="p-3 border-border/70">
      <CardHeader className="p-0 pb-2.5">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xs font-bold text-foreground">
            <Sliders className="h-4 w-4 text-primary" />
            OpenSCENARIO Parameters ({domainCounts.all})
          </CardTitle>
          <span className="text-[11px] font-medium text-muted-foreground">
            ODD First · Ordered
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0 space-y-2.5">
        {/* Domain Category Filter Tabs (ODD First) */}
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => onSelectCategory('all')}
            className={cn(
              'px-2 py-1 rounded-md text-[11px] font-bold transition-all',
              selectedCategory === 'all'
                ? 'bg-foreground text-background shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:text-foreground'
            )}
          >
            All ({domainCounts.all})
          </button>
          <button
            type="button"
            onClick={() => onSelectCategory('odd')}
            className={cn(
              'px-2 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1',
              selectedCategory === 'odd'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20'
            )}
          >
            <Compass className="h-3 w-3" />
            ODD ({domainCounts.odd})
          </button>
          <button
            type="button"
            onClick={() => onSelectCategory('behavior')}
            className={cn(
              'px-2 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1',
              selectedCategory === 'behavior'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-500/20'
            )}
          >
            <Activity className="h-3 w-3" />
            Behavior ({domainCounts.behavior})
          </button>
          {domainCounts.entity > 0 && (
            <button
              type="button"
              onClick={() => onSelectCategory('entity')}
              className={cn(
                'px-2 py-1 rounded-md text-[11px] font-bold transition-all',
                selectedCategory === 'entity'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20'
              )}
            >
              Entities ({domainCounts.entity})
            </button>
          )}
          {domainCounts.general > 0 && (
            <button
              type="button"
              onClick={() => onSelectCategory('general')}
              className={cn(
                'px-2 py-1 rounded-md text-[11px] font-bold transition-all',
                selectedCategory === 'general'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'bg-slate-500/10 text-slate-700 dark:text-slate-400 hover:bg-slate-500/20'
              )}
            >
              System ({domainCounts.general})
            </button>
          )}
        </div>

        {/* Filter search bar */}
        {domainCounts.all > 3 && (
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search parameter name, meaning, or value..."
              value={paramSearch}
              onChange={(e) => onParamSearchChange(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 text-xs bg-muted/60 border border-border rounded-md font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {paramSearch && (
              <button
                type="button"
                onClick={() => onParamSearchChange('')}
                className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground"
                aria-label="Clear parameter filter"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Parameters list/table */}
        {parameters.length === 0 ? (
          <div className="text-center py-6 px-4 bg-muted/20 border border-dashed border-border/70 rounded-lg">
            <p className="text-xs font-semibold text-foreground">No matching parameters</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Try adjusting your category selection or clear search filters.
            </p>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden divide-y divide-border/40">
            {parameters.map((p, idx) => {
              const cat = (p.category && DOMAIN_CATEGORIES[p.category]) ? p.category : 'general';
              const categoryInfo = DOMAIN_CATEGORIES[cat] || DOMAIN_CATEGORIES.general;
              const isOdd = cat === 'odd';
              const isBehavior = cat === 'behavior';
              const formattedValue = formatParameterDisplayValue(p);

              return (
                <div
                  key={`${p.name}-${idx}`}
                  className={cn(
                    'p-2.5 transition-colors hover:bg-accent/40 flex flex-col gap-1',
                    isOdd
                      ? 'bg-emerald-50/10'
                      : isBehavior
                      ? 'bg-indigo-50/10'
                      : 'bg-card'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-[9px] px-1.5 py-0 font-black uppercase tracking-wider',
                          isOdd
                            ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                            : isBehavior
                            ? 'bg-indigo-500/20 text-indigo-800 dark:text-indigo-300'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {categoryInfo.label}
                      </Badge>
                      <span className="font-mono text-xs font-bold text-foreground truncate">
                        {p.name}
                      </span>
                    </div>

                    <span className="font-mono text-xs font-bold text-foreground shrink-0 text-right">
                      {formattedValue}
                    </span>
                  </div>

                  {/* Semantic Meaning & Type Info */}
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                    <span className="truncate pr-2 font-medium">
                      {p.meaning || categoryInfo.description}
                    </span>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 shrink-0 font-mono">
                      {p.type}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const EntityTelemetryList: React.FC<{
  entities: ScenarioObjectState[];
  onFocusEntity?: (id: number) => void;
}> = ({ entities, onFocusEntity }) => {
  if (entities.length === 0) {
    return (
      <div className="p-6 text-center bg-muted/20 border border-dashed border-border/70 rounded-xl">
        <Car className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
        <p className="text-sm font-bold text-foreground">No active vehicles</p>
        <p className="text-xs text-muted-foreground mt-1">
          Play the simulation to observe live entity positions, velocities, and Frenet coordinates.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between pb-0.5">
        <span className="text-xs font-extrabold text-foreground uppercase tracking-wider">
          Active Vehicles &amp; Objects ({entities.length})
        </span>
      </div>

      {entities.map((obj) => {
        const isEgo = obj.name.toLowerCase().includes('ego');
        const isTarget =
          !isEgo &&
          (obj.name.toLowerCase().includes('cutin') ||
            obj.name.toLowerCase().includes('target'));
        const speedKmh = (obj.speed * 3.6).toFixed(1);

        return (
          <Card
            key={obj.id}
            className={cn(
              'p-3 border rounded-xl shadow-xs transition-all',
              isEgo
                ? 'border-blue-500/50 bg-blue-50/40 dark:bg-blue-950/20'
                : isTarget
                ? 'border-red-500/50 bg-red-50/40 dark:bg-red-950/20'
                : 'border-border bg-card'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs',
                    isEgo
                      ? 'bg-blue-600 text-white'
                      : isTarget
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-700 text-white'
                  )}
                >
                  {isEgo ? 'EGO' : isTarget ? 'TARGET' : `ID ${obj.id}`}
                </span>
                <span className="text-sm font-bold text-foreground">{obj.name}</span>
              </div>

              {onFocusEntity && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6.5 text-xs font-semibold gap-1 px-2.5 text-primary border-primary/30 hover:bg-primary/10 hover:border-primary"
                  onClick={() => onFocusEntity(obj.id)}
                  title={`Focus 3D camera on ${obj.name}`}
                >
                  <Crosshair className="h-3 w-3" />
                  Focus
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs pt-1 border-t border-border/50">
              <div>
                <span className="text-[11px] font-semibold text-muted-foreground block">Velocity</span>
                <span className="font-mono text-sm font-bold text-foreground">
                  {speedKmh} km/h{' '}
                  <span className="text-xs font-medium text-muted-foreground">
                    ({obj.speed.toFixed(1)} m/s)
                  </span>
                </span>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-muted-foreground block">Frenet Station (s)</span>
                <span className="font-mono text-sm font-bold text-primary">{obj.s.toFixed(1)} m</span>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-muted-foreground block">Lane &amp; Offset (t)</span>
                <span className="font-mono text-sm font-bold text-foreground">
                  Ln {obj.lane_id || '-'} (t: {obj.t.toFixed(2)}m)
                </span>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-muted-foreground block">Heading (Yaw)</span>
                <span className="font-mono text-sm font-bold text-foreground">
                  {(obj.h * (180 / Math.PI)).toFixed(1)}°
                </span>
              </div>

              <div className="col-span-2 pt-0.5 flex items-center justify-between text-xs">
                <span className="text-[11px] font-semibold text-muted-foreground">World Coordinates:</span>
                <span className="font-mono text-xs font-bold text-foreground">
                  ({obj.x.toFixed(1)}, {obj.y.toFixed(1)}, {obj.z.toFixed(1)})
                </span>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

const RoadSpecificationsCard: React.FC<{ metadata?: ScenarioMetadata | null }> = ({ metadata }) => {
  const road = metadata?.roadInfo;

  return (
    <Card className="p-3 border-border/70">
      <CardHeader className="p-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-xs font-bold text-foreground">
          <MapPin className="h-4 w-4 text-primary" />
          OpenDRIVE Road Specifications
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 space-y-2 text-xs">
        <div className="flex justify-between items-center py-1.5 border-b border-border/40">
          <span className="font-semibold text-muted-foreground">Road ID:</span>
          <span className="font-mono font-bold text-sm text-foreground">{road?.id || '1'}</span>
        </div>
        <div className="flex justify-between items-center py-1.5 border-b border-border/40">
          <span className="font-semibold text-muted-foreground">Road Name:</span>
          <span className="font-bold text-sm text-foreground">{road?.name || 'Main Road'}</span>
        </div>
        <div className="flex justify-between items-center py-1.5 border-b border-border/40">
          <span className="font-semibold text-muted-foreground">Total Road Length:</span>
          <span className="font-mono font-bold text-sm text-primary">
            {road?.length ? `${(road.length / 1000).toFixed(2)} km (${road.length} m)` : 'Unknown'}
          </span>
        </div>
        {road?.speedMax && (
          <div className="flex justify-between items-center py-1.5 border-b border-border/40">
            <span className="font-semibold text-muted-foreground">Max Speed Limit:</span>
            <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
              {(road.speedMax * 3.6).toFixed(1)} km/h ({road.speedMax.toFixed(1)} m/s)
            </span>
          </div>
        )}
        {road?.rule && (
          <div className="flex justify-between items-center py-1.5 border-b border-border/40">
            <span className="font-semibold text-muted-foreground">Traffic Rule:</span>
            <span className="font-bold text-xs text-foreground">
              {road.rule === 'RHT' ? 'Right-Hand Traffic (RHT)' : road.rule}
            </span>
          </div>
        )}
        {road?.laneCount !== undefined && (
          <div className="flex justify-between items-center py-1.5">
            <span className="font-semibold text-muted-foreground">Driving Lanes:</span>
            <span className="font-mono font-bold text-sm text-foreground">
              {road.laneCount} lane elements
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const LegalAttributionCard: React.FC<{
  onClose: () => void;
  onOpenAbout?: () => void;
}> = ({ onClose, onOpenAbout }) => {
  return (
    <div className="space-y-3">
      {/* ASAM OpenX Trademark Notice */}
      <Card className="p-3 border-border/70">
        <CardHeader className="p-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-xs font-bold text-foreground">
            <ShieldCheck className="h-4 w-4 text-blue-500" />
            ASAM OpenX® Standards
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 space-y-2 text-xs text-muted-foreground leading-relaxed">
          <p>
            <strong className="text-foreground">ASAM OpenDRIVE®</strong> and{' '}
            <strong className="text-foreground">ASAM OpenSCENARIO®</strong> are registered trademarks of{' '}
            <a
              href="https://www.asam.net"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-0.5 font-semibold"
            >
              ASAM e.V.
              <ExternalLink className="h-3 w-3" />
            </a>
            .
          </p>
          <p className="text-[11px] bg-muted/40 p-2 rounded border border-border/50">
            OpenX Studio is an independent open-source tool and is not officially affiliated with, endorsed by, or certified by ASAM e.V.
          </p>
        </CardContent>
      </Card>

      {/* esmini WASM Engine Attribution */}
      <Card className="p-3 border-border/70">
        <CardHeader className="p-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-xs font-bold text-foreground">
            <Car className="h-4 w-4 text-emerald-500" />
            esmini WASM Runtime
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 space-y-2 text-xs text-muted-foreground leading-relaxed">
          <p>
            Scenario execution is powered by{' '}
            <a
              href="https://github.com/esmini/esmini"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-0.5 font-semibold"
            >
              esmini
              <ExternalLink className="h-3 w-3" />
            </a>
            , created by Emil Knabe and open-source contributors.
          </p>
          <p className="text-[11px]">
            Licensed under the <strong className="text-foreground">Mozilla Public License 2.0 (MPL-2.0)</strong>.
          </p>
        </CardContent>
      </Card>

      {/* OpenX Studio License */}
      <Card className="p-3 border-border/70">
        <CardHeader className="p-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-xs font-bold text-foreground">
            <FileText className="h-4 w-4 text-amber-500" />
            OpenX Studio License
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 space-y-1.5 text-xs text-muted-foreground">
          <p>
            OpenX Studio UI and application code is open source under the{' '}
            <strong className="text-foreground">MIT License</strong>.
          </p>
        </CardContent>
      </Card>

      {/* About & Privacy Page Link */}
      <Card className="p-3 border-primary/30 bg-primary/5">
        <CardHeader className="p-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-xs font-bold text-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Privacy &amp; Architecture
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 space-y-2 text-xs text-muted-foreground">
          <p>100% client-side processing. Your scenario files never leave your browser.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onClose();
              onOpenAbout?.();
            }}
            className="w-full text-xs h-7 font-semibold"
          >
            View Full About &amp; Privacy
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
