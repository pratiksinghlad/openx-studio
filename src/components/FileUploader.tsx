import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileCode, CheckCircle2, AlertCircle, PlayCircle, Loader2 } from 'lucide-react';
import { FilePayload } from '../types/protocol';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { cn } from '../lib/utils';
import { validateScenarioFile } from '../lib/xmlValidator';

interface FileUploaderProps {
  onScenarioReady: (xosc: FilePayload, xodr: FilePayload, extraFiles?: FilePayload[]) => void;
  isLoading: boolean;
}

interface ProcessedFilesResult {
  xosc: FilePayload | null;
  xodr: FilePayload | null;
  extraFiles: FilePayload[];
  errorMessage?: string;
}

async function processUploadedFileList(
  files: FileList | File[],
  initialXosc: FilePayload | null,
  initialXodr: FilePayload | null
): Promise<ProcessedFilesResult> {
  let newXosc = initialXosc;
  let newXodr = initialXodr;
  const extraFiles: FilePayload[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const name = file.name.toLowerCase();
    const content = await file.text();

    const validation = validateScenarioFile(file.name, content);
    if (!validation.isValid) {
      return {
        xosc: newXosc,
        xodr: newXodr,
        extraFiles,
        errorMessage: validation.errorMessage,
      };
    }

    if (name.endsWith('.xosc')) {
      newXosc = { name: file.name, content };
    } else if (name.endsWith('.xodr')) {
      newXodr = { name: file.name, content };
    } else {
      extraFiles.push({ name: file.name, content });
    }
  }

  return { xosc: newXosc, xodr: newXodr, extraFiles };
}

function resolveValidationWarning(xosc: FilePayload | null, xodr: FilePayload | null): string | null {
  if (xosc && !xodr) {
    return 'OpenSCENARIO (.xosc) uploaded. Please upload the matching OpenDRIVE (.xodr) road network file.';
  }
  if (!xosc && xodr) {
    return 'OpenDRIVE (.xodr) uploaded. Please upload the matching OpenSCENARIO (.xosc) scenario file.';
  }
  return null;
}

interface FileStatusCardProps {
  label: string;
  file: FilePayload | null;
}

const FileStatusCard: React.FC<FileStatusCardProps> = ({ label, file }) => (
  <div
    className={cn(
      'flex items-center justify-between p-3.5 rounded-lg border transition-all text-sm',
      file
        ? 'border-success/40 bg-success/5 text-foreground'
        : 'border-border bg-muted/30 text-muted-foreground'
    )}
  >
    <div className="flex items-center gap-2.5 min-w-0 pr-2">
      <FileCode className={cn('h-5 w-5 shrink-0', file ? 'text-success' : 'text-muted-foreground')} />
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="text-xs font-mono font-medium truncate text-foreground">
          {file ? file.name : 'No file selected'}
        </span>
      </div>
    </div>
    {file ? (
      <Badge variant="success" className="gap-1 shrink-0">
        <CheckCircle2 className="h-3 w-3" /> Ready
      </Badge>
    ) : (
      <Badge variant="secondary" className="shrink-0 text-[10px]">
        Required
      </Badge>
    )}
  </div>
);

const DropzoneArea: React.FC<{
  isDragging: boolean;
  hasBothFiles: boolean;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onClick: () => void;
}> = ({ isDragging, hasBothFiles, onDrop, onDragOver, onDragLeave, onClick }) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 text-center bg-card/60 hover:bg-accent/40',
      isDragging && 'border-primary bg-primary/10 scale-[0.99]',
      hasBothFiles && 'border-success/60 bg-success/5'
    )}
    onDrop={onDrop}
    onDragOver={onDragOver}
    onDragLeave={onDragLeave}
    onClick={onClick}
  >
    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
      <Upload className="h-7 w-7" />
    </div>

    <div className="flex flex-col gap-1">
      <h3 className="text-base font-semibold text-foreground">
        Drag &amp; Drop Scenario Files
      </h3>
      <p className="text-xs text-muted-foreground max-w-sm">
        Drop your <strong className="text-foreground">.xosc</strong> (OpenSCENARIO) and{' '}
        <strong className="text-foreground">.xodr</strong> (OpenDRIVE) files together, or click to browse
      </p>
    </div>
  </div>
);

async function fetchSampleFiles(baseUrl: string): Promise<{ xosc: FilePayload; xodr: FilePayload; cat: FilePayload }> {
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const [xoscRes, xodrRes, catRes] = await Promise.all([
    fetch(`${cleanBase}samples/example.xosc`),
    fetch(`${cleanBase}samples/example.xodr`),
    fetch(`${cleanBase}samples/catalogs/VehicleCatalog.xosc`),
  ]);

  if (!xoscRes.ok || !xodrRes.ok) {
    throw new Error('Failed to load sample scenario files');
  }

  const [xoscText, xodrText, catText] = await Promise.all([
    xoscRes.text(),
    xodrRes.text(),
    catRes.ok ? catRes.text() : Promise.resolve(''),
  ]);

  return {
    xosc: { name: 'example.xosc', content: xoscText },
    xodr: { name: 'example.xodr', content: xodrText },
    cat: { name: 'VehicleCatalog.xosc', content: catText },
  };
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onScenarioReady, isLoading }) => {
  const [xoscFile, setXoscFile] = useState<FilePayload | null>(null);
  const [xodrFile, setXodrFile] = useState<FilePayload | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndProcessFiles = useCallback(async (files: FileList | File[]) => {
    setErrorMessage(null);
    setValidationWarning(null);

    const result = await processUploadedFileList(files, xoscFile, xodrFile);
    if (result.errorMessage) {
      setErrorMessage(result.errorMessage);
      return;
    }

    setXoscFile(result.xosc);
    setXodrFile(result.xodr);

    if (result.xosc && result.xodr) {
      onScenarioReady(result.xosc, result.xodr, result.extraFiles);
    } else {
      setValidationWarning(resolveValidationWarning(result.xosc, result.xodr));
    }
  }, [xoscFile, xodrFile, onScenarioReady]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFiles(e.dataTransfer.files);
    }
  }, [validateAndProcessFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFiles(e.target.files);
    }
  }, [validateAndProcessFiles]);

  const handleLoadSample = useCallback(async () => {
    try {
      setErrorMessage(null);
      setValidationWarning(null);

      const samples = await fetchSampleFiles(import.meta.env.BASE_URL);
      setXoscFile(samples.xosc);
      setXodrFile(samples.xodr);
      onScenarioReady(samples.xosc, samples.xodr, [samples.cat]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load sample scenario';
      setErrorMessage(msg);
    }
  }, [onScenarioReady]);

  return (
    <div className="flex flex-col gap-4 w-full">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".xosc,.xodr,.xml"
        onChange={handleFileInput}
        className="hidden"
      />

      <DropzoneArea
        isDragging={isDragging}
        hasBothFiles={Boolean(xoscFile && xodrFile)}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => fileInputRef.current?.click()}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FileStatusCard label="OpenSCENARIO (.xosc)" file={xoscFile} />
        <FileStatusCard label="OpenDRIVE (.xodr)" file={xodrFile} />
      </div>

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
