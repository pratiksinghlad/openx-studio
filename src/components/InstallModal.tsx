import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Download,
  Laptop,
  CheckCircle2,
  Sparkles,
  Monitor,
  Apple,
  Globe,
  Share2,
} from 'lucide-react';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInstallable: boolean;
  isInstalled: boolean;
  onPromptInstall: () => Promise<void>;
}

const InstallBenefits: React.FC = () => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-2">
    <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
        <Monitor className="h-4 w-4 text-primary" />
        <span>Standalone App</span>
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Runs in a dedicated desktop window without browser bars.
      </p>
    </div>

    <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
        <Sparkles className="h-4 w-4 text-emerald-500" />
        <span>Instant Launch</span>
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Fast local launch from Desktop, Taskbar, or Applications menu.
      </p>
    </div>

    <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
        <CheckCircle2 className="h-4 w-4 text-blue-500" />
        <span>100% Offline</span>
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Cached WebAssembly and 3D viewer work with zero server connection.
      </p>
    </div>
  </div>
);

const BrowserInstructions: React.FC = () => (
  <div className="space-y-3 mt-3 pt-3 border-t border-border/80">
    <div className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
      <Globe className="h-3.5 w-3.5 text-primary" />
      <span>Alternative Browser Installation Steps</span>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
      <div className="p-3 rounded-lg bg-muted/40 border border-border/60 flex flex-col gap-1.5">
        <div className="font-semibold text-foreground flex items-center gap-1.5">
          <Laptop className="h-3.5 w-3.5 text-blue-500" />
          <span>Chrome &amp; Edge (Desktop)</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          Click the <strong className="text-foreground">Install App</strong> icon (
          <Download className="inline h-3 w-3 text-primary" />
          ) on the right side of the address bar, or open the menu (<strong>⋮</strong>) &rarr;{' '}
          <strong>Save and share</strong> &rarr; <strong>Install OpenX Studio</strong>.
        </p>
      </div>

      <div className="p-3 rounded-lg bg-muted/40 border border-border/60 flex flex-col gap-1.5">
        <div className="font-semibold text-foreground flex items-center gap-1.5">
          <Apple className="h-3.5 w-3.5 text-foreground" />
          <span>Safari (macOS / iOS)</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          On macOS: Click <strong>File</strong> &rarr; <strong>Add to Dock...</strong>
          <br />
          On iOS: Tap Share (<Share2 className="inline h-3 w-3" />) &rarr;{' '}
          <strong>Add to Home Screen</strong>.
        </p>
      </div>
    </div>
  </div>
);

export const InstallModal: React.FC<InstallModalProps> = ({
  isOpen,
  onClose,
  isInstallable,
  isInstalled,
  onPromptInstall,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="outline"
              className="py-0.5 px-2 bg-primary/10 border-primary/20 text-primary text-xs font-bold"
            >
              Desktop &amp; Web App
            </Badge>
            {isInstalled && (
              <Badge
                variant="outline"
                className="py-0.5 px-2 bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold gap-1"
              >
                <CheckCircle2 className="h-3 w-3" />
                Already Installed
              </Badge>
            )}
          </div>
          <DialogTitle className="text-lg sm:text-xl font-bold">
            Install OpenX Studio on Desktop
          </DialogTitle>
          <DialogDescription>
            Enjoy a native desktop workstation experience for ASAM OpenSCENARIO and OpenDRIVE
            simulation playback.
          </DialogDescription>
        </DialogHeader>

        <InstallBenefits />

        {isInstallable && !isInstalled && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-600/10 via-primary/10 to-transparent border border-primary/30 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-foreground font-medium">
              Ready to install natively in your browser.
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={onPromptInstall}
              className="gap-2 h-9 px-4 text-xs font-bold shrink-0 shadow-sm"
            >
              <Download className="h-4 w-4" />
              <span>Install Now</span>
            </Button>
          </div>
        )}

        <BrowserInstructions />
      </DialogContent>
    </Dialog>
  );
};
