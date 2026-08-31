import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';

interface ErrorBannerProps {
  message: string;
  details?: string;
  onDismiss: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, details, onDismiss }) => {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 w-[min(92%,600px)] animate-in fade-in slide-in-from-top-4 duration-200">
      <Alert variant="destructive" className="bg-destructive/15 backdrop-blur-md border-destructive/40 shadow-xl pr-10">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle className="text-sm font-semibold">{message}</AlertTitle>
        {details && (
          <AlertDescription className="mt-1 text-xs opacity-90 font-mono break-all">
            {details}
          </AlertDescription>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          className="absolute right-2 top-2 text-destructive hover:bg-destructive/20 h-6 w-6 rounded-md"
          onClick={onDismiss}
          aria-label="Dismiss error"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </Alert>
    </div>
  );
};
