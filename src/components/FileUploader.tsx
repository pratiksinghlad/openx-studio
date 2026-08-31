import React, { useState, useRef } from 'react';
import { Upload, FileCode, CheckCircle2, AlertCircle, PlayCircle, Loader2 } from 'lucide-react';
import { FilePayload } from '../types/protocol';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { cn } from '../lib/utils';

interface FileUploaderProps {
  onScenarioReady: (xosc: FilePayload, xodr: FilePayload, extraFiles?: FilePayload[]) => void;
  isLoading: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onScenarioReady, isLoading }) => {
  const [xoscFile, setXoscFile] = useState<FilePayload | null>(null);
  const [xodrFile, setXodrFile] = useState<FilePayload | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndProcessFiles = async (files: FileList | File[]) => {
    setErrorMessage(null);
    setValidationWarning(null);

    let newXosc: FilePayload | null = xoscFile;
    let newXodr: FilePayload | null = xodrFile;
    const extraFiles: FilePayload[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const name = file.name.toLowerCase();
      const content = await file.text();

      // Validate XML structure
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(content, 'application/xml');
      const parseError = xmlDoc.querySelector('parsererror');

      if (parseError) {
        setErrorMessage(`Invalid XML in "${file.name}": ${parseError.textContent?.slice(0, 100)}`);
        return;
      }

      if (name.endsWith('.xosc')) {
        const rootTag = xmlDoc.documentElement.tagName;
        if (rootTag !== 'OpenSCENARIO') {
          setErrorMessage(`File "${file.name}" has .xosc extension but root tag is <${rootTag}> instead of <OpenSCENARIO>.`);
          return;
        }
        newXosc = { name: file.name, content };
      } else if (name.endsWith('.xodr')) {
        const rootTag = xmlDoc.documentElement.tagName;
        if (rootTag !== 'OpenDRIVE') {
          setErrorMessage(`File "${file.name}" has .xodr extension but root tag is <${rootTag}> instead of <OpenDRIVE>.`);
          return;
        }
        newXodr = { name: file.name, content };
      } else {
        extraFiles.push({ name: file.name, content });
      }
    }

    setXoscFile(newXosc);
    setXodrFile(newXodr);

    if (newXosc && newXodr) {
      onScenarioReady(newXosc, newXodr, extraFiles);
    } else if (newXosc && !newXodr) {
      setValidationWarning('OpenSCENARIO (.xosc) uploaded. Please upload the matching OpenDRIVE (.xodr) road network file.');
    } else if (!newXosc && newXodr) {
      setValidationWarning('OpenDRIVE (.xodr) uploaded. Please upload the matching OpenSCENARIO (.xosc) scenario file.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFiles(e.target.files);
    }
  };

  const handleLoadSample = async () => {
    try {
      setErrorMessage(null);
      setValidationWarning(null);

      const [xoscRes, xodrRes, catRes] = await Promise.all([
        fetch('/samples/example.xosc'),
        fetch('/samples/example.xodr'),
        fetch('/samples/catalogs/VehicleCatalog.xosc'),
      ]);

      if (!xoscRes.ok || !xodrRes.ok) {
        throw new Error('Failed to load sample scenario files');
      }

      const xoscText = await xoscRes.text();
      const xodrText = await xodrRes.text();
      const catText = catRes.ok ? await catRes.text() : '';

      const sampleXosc: FilePayload = { name: 'example.xosc', content: xoscText };
      const sampleXodr: FilePayload = { name: 'example.xodr', content: xodrText };
      const sampleCat: FilePayload = { name: 'VehicleCatalog.xosc', content: catText };

      setXoscFile(sampleXosc);
      setXodrFile(sampleXodr);

      onScenarioReady(sampleXosc, sampleXodr, [sampleCat]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load sample scenario');
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Dropzone */}
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 text-center bg-card/60 hover:bg-accent/40',
          isDragging && 'border-primary bg-primary/10 scale-[0.99]',
          xoscFile && xodrFile && 'border-success/60 bg-success/5'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".xosc,.xodr,.xml"
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
          <Upload className="h-7 w-7" />
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-foreground">
            Drag & Drop Scenario Files
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            Drop your <strong className="text-foreground">.xosc</strong> (OpenSCENARIO) and{' '}
            <strong className="text-foreground">.xodr</strong> (OpenDRIVE) files together, or click to browse
          </p>
        </div>
      </div>

      {/* File Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* XOSC Status Card */}
        <div
          className={cn(
            'flex items-center justify-between p-3.5 rounded-lg border transition-all text-sm',
            xoscFile
              ? 'border-success/40 bg-success/5 text-foreground'
              : 'border-border bg-muted/30 text-muted-foreground'
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <FileCode className={cn('h-5 w-5 shrink-0', xoscFile ? 'text-success' : 'text-muted-foreground')} />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                OpenSCENARIO (.xosc)
              </span>
              <span className="text-xs font-mono font-medium truncate text-foreground">
                {xoscFile ? xoscFile.name : 'No file selected'}
              </span>
            </div>
          </div>
          {xoscFile ? (
            <Badge variant="success" className="gap-1 shrink-0">
              <CheckCircle2 className="h-3 w-3" /> Ready
            </Badge>
          ) : (
            <Badge variant="secondary" className="shrink-0 text-[10px]">
              Required
            </Badge>
          )}
        </div>

        {/* XODR Status Card */}
        <div
          className={cn(
            'flex items-center justify-between p-3.5 rounded-lg border transition-all text-sm',
            xodrFile
              ? 'border-success/40 bg-success/5 text-foreground'
              : 'border-border bg-muted/30 text-muted-foreground'
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <FileCode className={cn('h-5 w-5 shrink-0', xodrFile ? 'text-success' : 'text-muted-foreground')} />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                OpenDRIVE (.xodr)
              </span>
              <span className="text-xs font-mono font-medium truncate text-foreground">
                {xodrFile ? xodrFile.name : 'No file selected'}
              </span>
            </div>
          </div>
          {xodrFile ? (
            <Badge variant="success" className="gap-1 shrink-0">
              <CheckCircle2 className="h-3 w-3" /> Ready
            </Badge>
          ) : (
            <Badge variant="secondary" className="shrink-0 text-[10px]">
              Required
            </Badge>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="relative my-1">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-3 text-muted-foreground font-semibold">
            Or Load Sample
          </span>
        </div>
      </div>

      {/* Demo Scenario Button */}
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={handleLoadSample}
        disabled={isLoading}
        className="w-full gap-2 border-primary/30 hover:border-primary hover:bg-primary/5 text-primary font-semibold"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading Sample Scenario...</span>
          </>
        ) : (
          <>
            <PlayCircle className="h-5 w-5" />
            <span>Load Demo Scenario (Cut-In / Lane Change)</span>
          </>
        )}
      </Button>

      {/* Alerts */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {validationWarning && (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{validationWarning}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};
