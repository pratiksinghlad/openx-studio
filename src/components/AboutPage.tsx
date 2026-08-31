import React from 'react';
import {
  ShieldCheck,
  Smartphone,
  Layers,
  Zap,
  Car,
  Lock,
  Heart,
  ExternalLink,
  ArrowLeft,
  CheckCircle2,
  Code2,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';

interface AboutPageProps {
  onBackToSimulator: () => void;
}

const GithubIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const FEATURES = [
  {
    icon: ShieldCheck,
    title: '100% Client-Side',
    desc: 'All processing happens locally on your device.',
  },
  {
    icon: Lock,
    title: 'Privacy First',
    desc: 'No API calls or data upload to any server.',
  },
  {
    icon: Smartphone,
    title: 'Cross-Platform',
    desc: 'Full browser and installable desktop app support.',
  },
  {
    icon: Layers,
    title: 'Responsive UI',
    desc: 'Adaptive interface for both desktop and mobile.',
  },
  {
    icon: Zap,
    title: 'Web Worker Engine',
    desc: 'Multi-threaded physics stepping for fluid 60+ FPS.',
  },
] as const;

const AboutHeader: React.FC<{ onBackToSimulator: () => void }> = ({ onBackToSimulator }) => (
  <header className="h-14 min-h-14 bg-card/95 backdrop-blur-md border-b border-border flex items-center justify-between px-5 sm:px-8 shrink-0 shadow-sm">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white shadow-sm shrink-0">
        <Car className="h-4 w-4" />
      </div>
      <div>
        <h1 className="text-sm font-bold tracking-tight text-foreground leading-none">
          OpenX Studio
        </h1>
        <span className="text-xs text-muted-foreground">About &amp; Privacy</span>
      </div>
    </div>

    <Button
      variant="outline"
      size="sm"
      onClick={onBackToSimulator}
      className="gap-1.5 h-8 px-3.5 text-xs font-semibold shadow-xs hover:bg-primary/10 hover:text-primary hover:border-primary/40"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      <span>Back to Simulator</span>
    </Button>
  </header>
);

const AboutHeroPrivacyCard: React.FC = () => (
  <Card className="p-5 border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card shadow-sm h-full flex flex-col justify-between">
    <div className="space-y-2.5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Badge
          variant="outline"
          className="gap-1 py-0.5 px-2.5 bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold"
        >
          <Lock className="h-3.5 w-3.5" />
          Privacy First Architecture
        </Badge>
        <span className="text-xs text-muted-foreground font-medium">
          Zero-Server Dependency
        </span>
      </div>

      <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-foreground leading-snug">
        In-Browser ASAM OpenSCENARIO &amp; OpenDRIVE Simulator
      </h2>

      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
        High-performance 3D scenario player, visual editor, and autonomous vehicle simulator powered by <strong className="text-foreground">esmini WebAssembly</strong>, <strong className="text-foreground">Three.js</strong>, and <strong className="text-foreground">Web Workers</strong>.
      </p>
    </div>

    <div className="mt-4 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs sm:text-sm text-muted-foreground space-y-1">
      <div className="font-semibold text-foreground flex items-center gap-1.5 text-xs sm:text-sm">
        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
        <span>100% Client-Side — No API calls or data upload to server.</span>
      </div>
      <p className="text-xs text-muted-foreground pl-5.5 leading-relaxed">
        Your files never leave your device. All XML parsing, coordinate transforms, and 3D simulation run strictly in your browser with zero network transmission.
      </p>
    </div>
  </Card>
);

const AboutCreatorCard: React.FC<{ onBackToSimulator: () => void }> = ({ onBackToSimulator }) => (
  <Card className="p-5 border-border/80 bg-card shadow-sm h-full flex flex-col justify-between">
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Creator &amp; Project Info
        </span>
        <Badge variant="outline" className="text-xs py-0.5 px-2 bg-primary/10 border-primary/20 text-primary font-semibold">
          MIT License
        </Badge>
      </div>

      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
          <Heart className="h-5 w-5 text-rose-500 fill-rose-500/20" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            Built with <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500 inline" /> by
          </span>
          <a
            href="https://github.com/pratiksinghlad"
            target="_blank"
            rel="noreferrer"
            className="text-base font-bold text-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5 truncate"
          >
            Pratik Singh Lad
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </a>
          <span className="text-xs text-muted-foreground truncate">
            github.com/pratiksinghlad
          </span>
        </div>
      </div>
    </div>

    <div className="mt-4 flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-2">
        <a
          href="https://github.com/pratiksinghlad"
          target="_blank"
          rel="noreferrer"
          className="w-full"
        >
          <Button variant="outline" size="sm" className="w-full h-9 text-xs font-semibold gap-1.5 justify-center">
            <GithubIcon className="h-3.5 w-3.5" />
            <span>GitHub Profile</span>
          </Button>
        </a>

        <a
          href="https://github.com/pratiksinghlad/openx-studio"
          target="_blank"
          rel="noreferrer"
          className="w-full"
        >
          <Button variant="default" size="sm" className="w-full h-9 text-xs font-semibold gap-1.5 justify-center">
            <Code2 className="h-3.5 w-3.5" />
            <span>Repository</span>
          </Button>
        </a>
      </div>

      <Button
        variant="secondary"
        size="sm"
        onClick={onBackToSimulator}
        className="w-full h-9 text-xs font-semibold gap-1.5 justify-center border border-border/60"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Launch 3D Simulator</span>
      </Button>
    </div>
  </Card>
);

const AboutFeatureCards: React.FC = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
    {FEATURES.map((item) => {
      const Icon = item.icon;
      return (
        <Card key={item.title} className="p-3.5 border-border/70 bg-card hover:border-primary/40 hover:shadow-xs transition-all flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-foreground leading-tight">
              {item.title}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground leading-snug">
            {item.desc}
          </p>
        </Card>
      );
    })}
  </div>
);

const AboutFooter: React.FC = () => (
  <footer className="w-full mt-auto text-xs sm:text-sm text-muted-foreground pt-4 pb-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
    <p className="font-medium text-foreground/80">
      OpenX Studio is open source under <strong className="text-foreground font-semibold">MIT License</strong>. esmini is licensed under <strong className="text-foreground font-semibold">MPL-2.0</strong>.
    </p>
    <p className="text-muted-foreground">
      ASAM OpenSCENARIO® &amp; ASAM OpenDRIVE® are registered trademarks of ASAM e.V.
    </p>
  </footer>
);

export const AboutPage: React.FC<AboutPageProps> = ({ onBackToSimulator }) => {
  return (
    <div className="h-screen w-full bg-background text-foreground flex flex-col overflow-y-auto overflow-x-hidden">
      <AboutHeader onBackToSimulator={onBackToSimulator} />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-10 pb-4 flex flex-col">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch shrink-0">
          <div className="md:col-span-7 flex flex-col h-full">
            <AboutHeroPrivacyCard />
          </div>
          <div className="md:col-span-5 flex flex-col h-full">
            <AboutCreatorCard onBackToSimulator={onBackToSimulator} />
          </div>
        </div>

        <div className="mt-12 mb-12 shrink-0">
          <AboutFeatureCards />
        </div>

        <AboutFooter />
      </main>
    </div>
  );
};

export default AboutPage;
