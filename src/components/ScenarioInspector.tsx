import React, { useState } from 'react';
import {
  ScenarioMetadata,
  ScenarioFrame,
  ScenarioObjectState,
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
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

interface ScenarioInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  metadata?: ScenarioMetadata | null;
  currentFrame: ScenarioFrame | null;
  scenarioName: string;
  onFocusEntity?: (entityId: number) => void;
}

export const ScenarioInspector: React.FC<ScenarioInspectorProps> = ({
  isOpen,
  onClose,
  metadata,
  currentFrame,
  scenarioName,
  onFocusEntity,
}) => {
  const [paramSearch, setParamSearch] = useState('');

  if (!isOpen) return null;

  const header = metadata?.fileHeader;
  const road = metadata?.roadInfo;
  const env = metadata?.environment;
  const rawParams = metadata?.parameters || [];
  const entities: ScenarioObjectState[] = currentFrame?.object_states || [];

  const filteredParams = rawParams.filter(
    (p) =>
      p.name.toLowerCase().includes(paramSearch.toLowerCase()) ||
      p.value.toLowerCase().includes(paramSearch.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in-0 duration-200"
      onClick={onClose}
    >
      <aside
        className="w-[min(94vw,460px)] h-full bg-background/95 backdrop-blur-xl border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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

        {/* Tab System */}
        <Tabs defaultValue="entities" className="flex-1 flex flex-col min-h-0">
          <div className="px-4 pt-2.5 pb-2 border-b border-border/60">
            <TabsList className="w-full grid grid-cols-4 h-9">
              <TabsTrigger value="entities" className="text-xs font-bold gap-1 px-1">
                <Car className="h-3.5 w-3.5" />
                <span>Entities ({entities.length})</span>
              </TabsTrigger>
              <TabsTrigger value="scenario" className="text-xs font-bold gap-1 px-1">
                <Sliders className="h-3.5 w-3.5" />
                <span>Scenario</span>
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
            {/* TAB 1: LIVE ENTITIES (DEFAULT) */}
            <TabsContent value="entities" className="mt-0 space-y-2.5">
              <div className="flex items-center justify-between pb-0.5">
                <span className="text-xs font-extrabold text-foreground uppercase tracking-wider">
                  Active Vehicles & Objects ({entities.length})
                </span>
              </div>

              {entities.length === 0 ? (
                <p className="text-sm font-medium text-muted-foreground py-6 text-center">
                  No active entities detected in current frame.
                </p>
              ) : (
                <div className="space-y-2">
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
                        {/* Compact Card Header */}
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
                            <span className="text-sm font-bold text-foreground">
                              {obj.name}
                            </span>
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

                        {/* Compact 2-Column Telemetry Grid with Large High-Visibility Text */}
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs pt-1 border-t border-border/50">
                          <div>
                            <span className="text-[11px] font-semibold text-muted-foreground block">
                              Velocity
                            </span>
                            <span className="font-mono text-sm font-bold text-foreground">
                              {speedKmh} km/h{' '}
                              <span className="text-xs font-medium text-muted-foreground">
                                ({obj.speed.toFixed(1)} m/s)
                              </span>
                            </span>
                          </div>

                          <div>
                            <span className="text-[11px] font-semibold text-muted-foreground block">
                              Frenet Station (s)
                            </span>
                            <span className="font-mono text-sm font-bold text-primary">
                              {obj.s.toFixed(1)} m
                            </span>
                          </div>

                          <div>
                            <span className="text-[11px] font-semibold text-muted-foreground block">
                              Lane & Offset (t)
                            </span>
                            <span className="font-mono text-sm font-bold text-foreground">
                              Ln {obj.lane_id || '-'} (t: {obj.t.toFixed(2)}m)
                            </span>
                          </div>

                          <div>
                            <span className="text-[11px] font-semibold text-muted-foreground block">
                              Heading (Yaw)
                            </span>
                            <span className="font-mono text-sm font-bold text-foreground">
                              {(obj.h * (180 / Math.PI)).toFixed(1)}°
                            </span>
                          </div>

                          <div className="col-span-2 pt-0.5 flex items-center justify-between text-xs">
                            <span className="text-[11px] font-semibold text-muted-foreground">
                              World Coordinates:
                            </span>
                            <span className="font-mono text-xs font-bold text-foreground">
                              ({obj.x.toFixed(1)}, {obj.y.toFixed(1)}, {obj.z.toFixed(1)})
                            </span>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* TAB 2: SCENARIO INFO */}
            <TabsContent value="scenario" className="mt-0 space-y-3">
              {/* File Info */}
              <Card className="p-3 border-border/70">
                <CardHeader className="p-0 pb-2">
                  <CardTitle className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <FileText className="h-4 w-4 text-primary" />
                    OpenSCENARIO File Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-border/40">
                    <span className="font-semibold text-muted-foreground">Scenario:</span>
                    <span className="font-bold text-sm text-foreground">{scenarioName || 'Unnamed'}</span>
                  </div>
                  {header?.description && (
                    <div className="py-1 border-b border-border/40">
                      <span className="font-semibold text-muted-foreground block text-[11px]">Description:</span>
                      <span className="font-medium text-xs text-foreground leading-snug">{header.description}</span>
                    </div>
                  )}
                  {header?.author && (
                    <div className="flex justify-between items-center py-1 border-b border-border/40">
                      <span className="font-semibold text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" /> Author:
                      </span>
                      <span className="font-bold text-xs text-foreground">{header.author}</span>
                    </div>
                  )}
                  {header?.date && (
                    <div className="flex justify-between items-center py-1 border-b border-border/40">
                      <span className="font-semibold text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Date:
                      </span>
                      <span className="font-bold text-xs text-foreground">
                        {new Date(header.date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {header?.revMajor && (
                    <div className="flex justify-between items-center py-1">
                      <span className="font-semibold text-muted-foreground">Standard Version:</span>
                      <Badge variant="outline" className="text-xs font-mono font-bold">
                        OpenSCENARIO {header.revMajor}.{header.revMinor || '0'}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Environment Conditions */}
              {env && (
                <Card className="p-3 border-border/70">
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <Sun className="h-4 w-4 text-warning" />
                      Environment & Weather
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 grid grid-cols-2 gap-2 text-xs">
                    {env.sunElevation !== undefined && (
                      <div className="bg-muted/50 p-2 rounded-md">
                        <span className="text-[11px] font-semibold text-muted-foreground block">Sun Elevation</span>
                        <span className="font-mono text-sm font-bold text-foreground">
                          {(env.sunElevation * (180 / Math.PI)).toFixed(1)}°
                        </span>
                      </div>
                    )}
                    {env.sunAzimuth !== undefined && (
                      <div className="bg-muted/50 p-2 rounded-md">
                        <span className="text-[11px] font-semibold text-muted-foreground block">Sun Azimuth</span>
                        <span className="font-mono text-sm font-bold text-foreground">
                          {(env.sunAzimuth * (180 / Math.PI)).toFixed(1)}°
                        </span>
                      </div>
                    )}
                    {env.sunIntensity !== undefined && (
                      <div className="bg-muted/50 p-2 rounded-md">
                        <span className="text-[11px] font-semibold text-muted-foreground block">Sun Intensity</span>
                        <span className="font-mono text-sm font-bold text-foreground">{env.sunIntensity} lx</span>
                      </div>
                    )}
                    {env.windSpeed !== undefined && (
                      <div className="bg-muted/50 p-2 rounded-md">
                        <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                          <Wind className="h-3 w-3" /> Wind Speed
                        </span>
                        <span className="font-mono text-sm font-bold text-foreground">{env.windSpeed} m/s</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Parameters Table */}
              <Card className="p-3 border-border/70">
                <CardHeader className="p-0 pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <Sliders className="h-4 w-4 text-primary" />
                      Parameters ({rawParams.length})
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0 space-y-2">
                  {rawParams.length > 3 && (
                    <div className="relative">
                      <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Filter parameters..."
                        value={paramSearch}
                        onChange={(e) => setParamSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted/60 border border-border rounded-md font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  )}

                  {filteredParams.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2 text-center">
                      No parameters found.
                    </p>
                  ) : (
                    <div className="border border-border rounded-lg overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/80 text-foreground text-[11px] uppercase font-bold">
                          <tr>
                            <th className="text-left p-2">Parameter</th>
                            <th className="text-left p-2">Type</th>
                            <th className="text-right p-2">Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {filteredParams.map((p, idx) => (
                            <tr key={idx} className="hover:bg-accent/40">
                              <td className="p-2 font-mono text-primary font-bold">{p.name}</td>
                              <td className="p-2">
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-semibold">
                                  {p.type}
                                </Badge>
                              </td>
                              <td className="p-2 text-right font-mono font-bold text-foreground">{p.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: ROAD SPECIFICATIONS */}
            <TabsContent value="road" className="mt-0 space-y-3">
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
            </TabsContent>

            {/* TAB 4: STANDARDS, LICENSING & ATTRIBUTION */}
            <TabsContent value="standards" className="mt-0 space-y-3">
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
                    <strong className="text-foreground">ASAM OpenDRIVE®</strong> and <strong className="text-foreground">ASAM OpenSCENARIO®</strong> are registered trademarks of <a href="https://www.asam.net" target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">ASAM e.V.<ExternalLink className="h-3 w-3" /></a>.
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
                    Scenario execution is powered by <a href="https://github.com/esmini/esmini" target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5 font-semibold">esmini<ExternalLink className="h-3 w-3" /></a>, created by Emil Knabe and open-source contributors.
                  </p>
                  <p className="text-[11px]">
                    Licensed under the <strong className="text-foreground">Mozilla Public License 2.0 (MPL-2.0)</strong>. Source code available at <a href="https://github.com/esmini/esmini" target="_blank" rel="noreferrer" className="text-primary hover:underline">github.com/esmini/esmini</a>.
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
                    OpenX Studio UI and application code is open source under the <strong className="text-foreground">MIT License</strong>.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </aside>
    </div>
  );
};
