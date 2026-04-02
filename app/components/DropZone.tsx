'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ConversionTool, UploadedFile, MAX_FILE_MB } from '../lib/types';
import { Upload, X, FileText, Image as ImageIcon, File } from 'lucide-react';
import { generateId, formatBytes } from '../lib/converters';
import clsx from 'clsx';
import toast from 'react-hot-toast';

type Props = {
  tool: ConversionTool;
  files: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
};

function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext))
    return <ImageIcon size={16} className="text-green-600" />;
  if (ext === 'pdf')
    return <FileText size={16} className="text-red-500" />;
  return <File size={16} className="text-blue-500" />;
}

export default function DropZone({ tool, files, onChange }: Props) {
  const [previewing, setPreviewing] = useState<string | null>(null);

  const onDrop = useCallback(async (accepted: File[], rejected: any[]) => {
    // Handle rejected files
    rejected.forEach(({ file, errors }) => {
      toast.error(`${file.name}: ${errors[0]?.message || 'Unsupported file'}`);
    });

    if (!accepted.length) return;

    const newFiles: UploadedFile[] = await Promise.all(
      accepted.slice(0, tool.maxFiles - files.length).map(async file => {
        const uf: UploadedFile = { id: generateId(), file };
        // Generate preview for images
        if (file.type.startsWith('image/')) {
          uf.preview = await new Promise<string>(res => {
            const reader = new FileReader();
            reader.onload = e => res(e.target?.result as string);
            reader.readAsDataURL(file);
          });
        }
        return uf;
      })
    );

    if (files.length + newFiles.length > tool.maxFiles) {
      toast.error(`Max ${tool.maxFiles} files for this tool`);
    }

    onChange([...files, ...newFiles]);
  }, [files, onChange, tool.maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: tool.acceptedExts.reduce((acc, ext) => {
      const mime =
        ext === 'pdf' ? 'application/pdf'
        : ext === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : ext === 'doc' ? 'application/msword'
        : `image/${ext}`;
      return { ...acc, [mime]: [`.${ext}`] };
    }, {} as Record<string, string[]>),
    maxSize: MAX_FILE_MB * 1024 * 1024,
    maxFiles: tool.maxFiles,
    disabled: files.length >= tool.maxFiles,
  });

  const removeFile = (id: string) => {
    onChange(files.filter(f => f.id !== id));
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={clsx(
          'relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
          isDragActive
            ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20 scale-[1.01]'
            : files.length >= tool.maxFiles
            ? 'border-neutral-200 dark:border-neutral-700 opacity-50 cursor-not-allowed'
            : 'border-neutral-300 dark:border-neutral-700 hover:border-orange-400 dark:hover:border-orange-600 hover:bg-orange-50/50 dark:hover:bg-orange-950/10'
        )}
      >
        <input {...getInputProps()} />

        <div className={clsx('flex flex-col items-center gap-3 transition-transform', isDragActive && 'scale-105')}>
          <div className={clsx(
            'w-12 h-12 rounded-xl flex items-center justify-center transition-colors',
            isDragActive ? 'bg-orange-500 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
          )}>
            <Upload size={22} />
          </div>

          <div>
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {isDragActive ? 'Drop files here…' : 'Drag & drop files here'}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              or <span className="text-orange-600 dark:text-orange-400 font-medium">click to browse</span>
              {' · '}{tool.acceptedExts.map(e => e.toUpperCase()).join(', ')}
              {' · '}max {MAX_FILE_MB} MB
            </p>
          </div>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map(uf => (
            <div
              key={uf.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 group"
            >
              {/* Preview / icon */}
              {uf.preview ? (
                <img
                  src={uf.preview}
                  alt={`Preview of ${uf.file.name}`}
                  className="w-9 h-9 rounded-md object-cover flex-shrink-0 border border-neutral-200 dark:border-neutral-700 cursor-pointer"
                  onClick={() => setPreviewing(previewing === uf.id ? null : uf.id)}
                />
              ) : (
                <div className="w-9 h-9 rounded-md bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center flex-shrink-0">
                  <FileIcon name={uf.file.name} />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200 truncate">
                  {uf.file.name}
                </p>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {formatBytes(uf.file.size)}
                </p>
              </div>

              {/* Remove */}
              <button
                onClick={() => removeFile(uf.id)}
                className="p-1.5 rounded-md text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
              >
                <X size={13} />
              </button>
            </div>
          ))}

          {/* Expanded preview */}
          {previewing && (() => {
            const uf = files.find(f => f.id === previewing);
            return uf?.preview ? (
              <div className="rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700">
                <img 
                  src={uf.preview} 
                  alt={`Expanded preview of ${uf.file.name}`} 
                  className="w-full max-h-56 object-contain bg-neutral-50 dark:bg-neutral-900" 
                />
              </div>
            ) : null;
          })()}
        </div>
      )}
    </div>
  );
}
