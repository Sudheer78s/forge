'use client';

import { useState, useRef } from 'react';
import { TOOLS, ConversionTool, UploadedFile, ConversionResult, ConversionStatus } from '../lib/types';
import DropZone from './DropZone';
import ProgressBar from './ProgressBar';
import ResultsPanel from './ResultsPanel';
import { useUsageLimit } from '../hooks/useUsageLimit';
import { convertImagesToPdf, compressImages, mergePdfs, generateId } from '../lib/converters';
import { ArrowRight, RefreshCw, Zap } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

type Props = {
  toolId: string;
};

export default function ConverterPanel({ toolId }: Props) {
  const tool = TOOLS.find(t => t.id === toolId)!;
  const { isLimited, increment } = useUsageLimit();

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ConversionStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [results, setResults] = useState<ConversionResult[]>([]);
  const abortRef = useRef(false);

  const onProgress = (pct: number, msg: string) => {
    setProgress(pct);
    setProgressMsg(msg);
  };

  const reset = () => {
    setFiles([]);
    setStatus('idle');
    setProgress(0);
    setProgressMsg('');
    setResults([]);
    abortRef.current = false;
  };

  const convert = async () => {
    if (!files.length) { toast.error('Please add at least one file'); return; }
    if (isLimited) { toast.error('Daily limit reached — upgrade to Pro for unlimited conversions'); return; }
    if (tool.isPremium) { toast('This feature requires FileForge Pro', { icon: '⚡' }); return; }

    abortRef.current = false;
    setStatus('converting');
    setResults([]);

    try {
      let output: ConversionResult[] = [];

      // ── Client-side conversions ────────────────────────────────────────────
      if (tool.id === 'jpg2pdf') {
        output = await convertImagesToPdf(files.map(f => f.file), onProgress);
      } else if (tool.id === 'compress') {
        output = await compressImages(files.map(f => f.file), onProgress);
      } else if (tool.id === 'merge') {
        output = await mergePdfs(files.map(f => f.file), onProgress);
      }

      // ── Server-side conversions ────────────────────────────────────────────
      else if (tool.id === 'docx2pdf') {
        output = await serverConvert('/api/convert/docx2pdf', files[0], onProgress);
      } else if (tool.id === 'pdf2docx') {
        output = await serverConvert('/api/convert/pdf2docx', files[0], onProgress);
      } else if (tool.id === 'pdf2jpg') {
        output = await serverConvertPdf2Jpg(files[0], onProgress);
      }

      increment();
      setResults(output);
      setStatus('done');
      toast.success(`Converted successfully!`);
    } catch (err: unknown) {
      setStatus('error');
      toast.error(err instanceof Error ? err.message : 'Conversion failed');
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{tool.icon}</span>
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {tool.name}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded font-mono">
                {tool.fromLabel}
              </span>
              <ArrowRight size={10} className="text-neutral-400" />
              <span className="text-xs text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400 px-1.5 py-0.5 rounded font-mono">
                {tool.toLabel}
              </span>
            </div>
          </div>
        </div>
        {status !== 'idle' && (
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
          >
            <RefreshCw size={13} />
            Reset
          </button>
        )}
      </div>

      {/* Drop zone */}
      {status === 'idle' && (
        <DropZone tool={tool} files={files} onChange={setFiles} />
      )}

      {/* Progress */}
      {status === 'converting' && (
        <ProgressBar percent={progress} message={progressMsg} />
      )}

      {/* Results */}
      {status === 'done' && results.length > 0 && (
        <ResultsPanel results={results} />
      )}

      {/* Error state */}
      {status === 'error' && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 p-4 text-sm text-red-700 dark:text-red-400">
          Conversion failed. Please check your file and try again.
        </div>
      )}

      {/* Convert button */}
      {status === 'idle' && (
        <button
          onClick={convert}
          disabled={!files.length || isLimited}
          className={clsx(
            'w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200',
            'flex items-center justify-center gap-2',
            !files.length || isLimited
              ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
              : 'bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white shadow-sm shadow-orange-200 dark:shadow-orange-900/30'
          )}
        >
          {isLimited ? (
            <>
              <Zap size={15} />
              Daily limit reached — upgrade for more
            </>
          ) : (
            `Convert ${files.length > 0 ? `${files.length} file${files.length > 1 ? 's' : ''}` : 'files'} →`
          )}
        </button>
      )}

      {/* Try again */}
      {(status === 'done' || status === 'error') && (
        <button
          onClick={reset}
          className="w-full py-2.5 rounded-xl text-sm font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          Convert another file
        </button>
      )}
    </div>
  );
}

// ─── Server conversion helpers ───────────────────────────────────────────────

async function serverConvert(
  url: string,
  uf: UploadedFile,
  onProgress: (pct: number, msg: string) => void
): Promise<ConversionResult[]> {
  onProgress(10, 'Uploading file…');

  const form = new FormData();
  form.append('file', uf.file);

  onProgress(30, 'Converting on server…');
  const res = await fetch(url, { method: 'POST', body: form });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Server error' }));
    throw new Error(err.error || 'Conversion failed');
  }

  onProgress(85, 'Downloading result…');
  const blob = await res.blob();

  // Determine output filename from Content-Disposition or derive it
  const cd = res.headers.get('Content-Disposition') || '';
  const match = cd.match(/filename="?([^"]+)"?/);
  const ext = url.includes('docx2pdf') ? '.pdf' : '.docx';
  const fileName = match?.[1] || uf.file.name.replace(/\.[^.]+$/, ext);

  onProgress(100, 'Done!');
  return [{ id: generateId(), fileName, blob, size: blob.size }];
}

async function serverConvertPdf2Jpg(
  uf: UploadedFile,
  onProgress: (pct: number, msg: string) => void
): Promise<ConversionResult[]> {
  onProgress(10, 'Uploading PDF…');

  const form = new FormData();
  form.append('file', uf.file);

  onProgress(30, 'Extracting pages…');
  const res = await fetch('/api/convert/pdf2jpg', { method: 'POST', body: form });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Server error' }));
    throw new Error(err.error || 'Conversion failed');
  }

  onProgress(80, 'Processing images…');
  const data = await res.json();

  const results: ConversionResult[] = data.pages.map((p: { name: string; dataUrl: string; size: number }) => {
    // Convert base64 data URL → Blob
    const byteStr = atob(p.dataUrl.split(',')[1]);
    const arr = new Uint8Array(byteStr.length);
    for (let i = 0; i < byteStr.length; i++) arr[i] = byteStr.charCodeAt(i);
    const blob = new Blob([arr], { type: 'image/jpeg' });
    return { id: generateId(), fileName: p.name, blob, size: blob.size };
  });

  onProgress(100, 'Done!');
  return results;
}
