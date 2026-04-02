'use client';

import { ConversionResult } from '../lib/types';
import { Download, CheckCircle, TrendingDown } from 'lucide-react';
import { formatBytes } from '../lib/converters';
import toast from 'react-hot-toast';

type Props = {
  results: ConversionResult[];
};

export default function ResultsPanel({ results }: Props) {
  if (!results.length) return null;

  const downloadAll = () => {
    results.forEach(r => downloadOne(r));
  };

  const downloadOne = (r: ConversionResult) => {
    const url = URL.createObjectURL(r.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = r.fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    toast.success(`Downloading ${r.fileName}`);
  };

  return (
    <div className="space-y-3 fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <CheckCircle size={16} />
          <span className="text-sm font-semibold">
            {results.length} file{results.length > 1 ? 's' : ''} ready
          </span>
        </div>
        {results.length > 1 && (
          <button
            onClick={downloadAll}
            className="text-xs font-medium text-orange-600 dark:text-orange-400 hover:underline"
          >
            Download all
          </button>
        )}
      </div>

      {/* Files */}
      {results.map(r => (
        <div
          key={r.id}
          className="flex items-center gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50"
        >
          {/* Icon */}
          <div className="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
            <CheckCircle size={18} className="text-green-600 dark:text-green-400" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
              {r.fileName}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                {formatBytes(r.size)}
              </span>
              {r.originalSize && r.originalSize > r.size && (
                <span className="flex items-center gap-0.5 text-[10px] text-green-600 dark:text-green-400 font-medium">
                  <TrendingDown size={10} />
                  {Math.round((1 - r.size / r.originalSize) * 100)}% smaller
                </span>
              )}
            </div>
          </div>

          {/* Download button */}
          <button
            onClick={() => downloadOne(r)}
            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
          >
            <Download size={12} />
            Download
          </button>
        </div>
      ))}
    </div>
  );
}
