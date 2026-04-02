export type ConversionTool = {
  id: string;
  name: string;
  description: string;
  icon: string;
  fromLabel: string;
  toLabel: string;
  acceptedExts: string[];
  acceptMime: string;
  isPremium: boolean;
  maxFiles: number;
};

export type UploadedFile = {
  id: string;
  file: File;
  preview?: string; // data URL for images
};

export type ConversionResult = {
  id: string;
  fileName: string;
  blob: Blob;
  size: number;
  originalSize?: number;
};

export type ConversionStatus =
  | 'idle'
  | 'uploading'
  | 'converting'
  | 'done'
  | 'error';

export const TOOLS: ConversionTool[] = [
  {
    id: 'jpg2pdf',
    name: 'JPG to PDF',
    description: 'Combine images into one PDF',
    icon: '🖼️',
    fromLabel: 'JPG/PNG',
    toLabel: 'PDF',
    acceptedExts: ['jpg', 'jpeg', 'png', 'webp'],
    acceptMime: 'image/jpeg,image/png,image/webp',
    isPremium: false,
    maxFiles: 20,
  },
  {
    id: 'pdf2jpg',
    name: 'PDF to JPG',
    description: 'Extract pages as images',
    icon: '📄',
    fromLabel: 'PDF',
    toLabel: 'JPG',
    acceptedExts: ['pdf'],
    acceptMime: 'application/pdf',
    isPremium: false,
    maxFiles: 1,
  },
  {
    id: 'docx2pdf',
    name: 'Word to PDF',
    description: 'Convert .docx files to PDF',
    icon: '📝',
    fromLabel: 'DOCX',
    toLabel: 'PDF',
    acceptedExts: ['docx', 'doc'],
    acceptMime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword',
    isPremium: false,
    maxFiles: 5,
  },
  {
    id: 'pdf2docx',
    name: 'PDF to Word',
    description: 'Extract text into Word doc',
    icon: '📋',
    fromLabel: 'PDF',
    toLabel: 'DOCX',
    acceptedExts: ['pdf'],
    acceptMime: 'application/pdf',
    isPremium: false,
    maxFiles: 1,
  },
  {
    id: 'compress',
    name: 'Compress Image',
    description: 'Reduce image file size',
    icon: '🗜️',
    fromLabel: 'JPG/PNG',
    toLabel: 'JPG',
    acceptedExts: ['jpg', 'jpeg', 'png', 'webp'],
    acceptMime: 'image/jpeg,image/png,image/webp',
    isPremium: false,
    maxFiles: 10,
  },
  {
    id: 'merge',
    name: 'Merge PDFs',
    description: 'Combine multiple PDFs into one',
    icon: '🔗',
    fromLabel: 'PDF',
    toLabel: 'PDF',
    acceptedExts: ['pdf'],
    acceptMime: 'application/pdf',
    isPremium: true,
    maxFiles: 20,
  },
];

export const MAX_FILE_MB = 10;
export const FREE_DAILY_LIMIT = 5;
