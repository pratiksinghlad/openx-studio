import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from './tooltip';
import { cn } from '../../lib/utils';

export interface ShortcutBadgeProps {
  keyLabel: string;
  className?: string;
}

export function ShortcutBadge({ keyLabel, className }: ShortcutBadgeProps) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center justify-center min-w-3.5 px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] font-mono font-bold tracking-tight bg-background/25 dark:bg-background/35 text-primary-foreground rounded border border-primary-foreground/30 shadow-2xs select-none',
        className
      )}
    >
      {keyLabel}
    </kbd>
  );
}

export interface ShortcutTooltipProps {
  label: React.ReactNode;
  shortcuts?: readonly string[] | string[];
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  className?: string;
}

export function ShortcutTooltip({
  label,
  shortcuts = [],
  children,
  side = 'top',
  align = 'center',
  className,
}: ShortcutTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side={side}
        align={align}
        className={cn('flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-0.5 sm:py-1 leading-tight', className)}
      >
        <span className="font-medium text-[11px] sm:text-xs tracking-tight">{label}</span>
        {shortcuts && shortcuts.length > 0 && (
          <div className="flex items-center gap-1 shrink-0 select-none">
            {shortcuts.map((k, index) => (
              <React.Fragment key={k}>
                {index > 0 && (
                  <span className="text-[10px] sm:text-[11px] text-primary-foreground/75 font-normal px-0.5 lowercase">
                    or
                  </span>
                )}
                <ShortcutBadge keyLabel={k} />
              </React.Fragment>
            ))}
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
