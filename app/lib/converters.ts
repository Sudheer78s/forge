import { ConversionResult } from './types';

// ─── Helpers ────────────────────────────────────────────────────────────────

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = reject;
    img.src = url;
  });
}

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

// ─── JPG/PNG → PDF (client-side via jsPDF) ──────────────────────────────────

export async function convertImagesToPdf(
  files: File[],
  onProgress: (pct: number, msg: string) => void
): Promise<ConversionResult[]> {
  onProgress(5, 'Loading converter…');

  // Dynamically import jsPDF (only in browser)
  const { jsPDF } = await import('jspdf');
  onProgress(20, 'Processing images…');

  const firstImg = await loadImage(files[0]);
  const isLandscape = firstImg.width > firstImg.height;

  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'px',
    format: [firstImg.width, firstImg.height],
    hotfixes: ['px_scaling'],
  });

  for (let i = 0; i < files.length; i++) {
    onProgress(20 + Math.round((i / files.length) * 65), `Adding image ${i + 1} of ${files.length}…`);
    const img = await loadImage(files[i]);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext('2d')!.drawImage(img, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    if (i > 0) {
      pdf.addPage([img.width, img.height], img.width > img.height ? 'landscape' : 'portrait');
    }
    pdf.addImage(dataUrl, 'JPEG', 0, 0, img.width, img.height);
    await delay(30);
  }

  onProgress(95, 'Generating PDF…');
  const blob = pdf.output('blob');
  return [{ id: generateId(), fileName: 'converted.pdf', blob, size: blob.size }];
}

// ─── Compress image (client-side canvas) ────────────────────────────────────

export async function compressImages(
  files: File[],
  onProgress: (pct: number, msg: string) => void
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = [];
  const MAX_DIM = 1920;

  for (let i = 0; i < files.length; i++) {
    onProgress(10 + Math.round((i / files.length) * 80), `Compressing ${i + 1} of ${files.length}…`);
    const file = files[i];
    const img = await loadImage(file);

    let w = img.naturalWidth, h = img.naturalHeight;
    if (w > MAX_DIM || h > MAX_DIM) {
      const ratio = Math.min(MAX_DIM / w, MAX_DIM / h);
      w = Math.floor(w * ratio);
      h = Math.floor(h * ratio);
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);

    const blob = await new Promise<Blob>((res, rej) =>
      canvas.toBlob(b => b ? res(b) : rej(new Error('Canvas toBlob failed')), 'image/jpeg', 0.78)
    );

    const outName = file.name.replace(/\.[^.]+$/, '-compressed.jpg');
    results.push({ id: generateId(), fileName: outName, blob, size: blob.size, originalSize: file.size });
    await delay(20);
  }

  onProgress(100, 'Done!');
  return results;
}

// ─── Merge PDFs (client-side via pdf-lib) ───────────────────────────────────

export async function mergePdfs(
  files: File[],
  onProgress: (pct: number, msg: string) => void
): Promise<ConversionResult[]> {
  onProgress(5, 'Loading pdf-lib…');
  const { PDFDocument } = await import('pdf-lib');
  onProgress(15, 'Reading PDFs…');

  const merged = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    onProgress(15 + Math.round((i / files.length) * 70), `Merging ${files[i].name}…`);
    const buf = await files[i].arrayBuffer();
    const doc = await PDFDocument.load(buf);
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach(p => merged.addPage(p));
    await delay(50);
  }

  onProgress(92, 'Saving merged PDF…');
  const bytes = await merged.save();
  const blob = new Blob([bytes], { type: 'application/pdf' });
  return [{ id: generateId(), fileName: 'merged.pdf', blob, size: blob.size }];
}
