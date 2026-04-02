import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: 'File exceeds 10 MB' }, { status: 413 });

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf') return NextResponse.json({ error: 'Only PDF files accepted' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    // Extract text with pdf-parse
    // Dynamic require to avoid Next.js bundling issues
    let text = '';
    let pageCount = 0;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buffer);
      text = data.text || '';
      pageCount = data.numpages || 0;
    } catch {
      text = 'Could not extract text from this PDF.\nThe file may be scanned or image-based.\nFor scanned PDFs, please use an OCR tool first.';
    }

    // Build minimal DOCX (Office Open XML) manually — no heavy dependency
    const docxBytes = buildDocx(text, file.name, pageCount);

    const outName = file.name.replace(/\.pdf$/i, '.docx');

    return new NextResponse(docxBytes, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${outName}"`,
        'Content-Length': docxBytes.byteLength.toString(),
      },
    });
  } catch (err: unknown) {
    console.error('pdf2docx error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Conversion failed' },
      { status: 500 }
    );
  }
}

// ─── Minimal valid DOCX builder (no external lib needed) ────────────────────

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    // Remove non-printable characters except newline/tab
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

function buildDocx(text: string, originalName: string, pageCount: number): Uint8Array {
  const paragraphs = text.split(/\n+/).map(line => line.trim());

  const bodyXml = paragraphs.map(line => {
    if (!line) return '<w:p/>';
    return `<w:p><w:r><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`;
  }).join('\n');

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<w:body>
<w:p>
  <w:pPr><w:pStyle w:val="Title"/></w:pPr>
  <w:r><w:t>${escapeXml(originalName.replace(/\.pdf$/i, ''))}</w:t></w:r>
</w:p>
<w:p>
  <w:r><w:rPr><w:color w:val="888888"/><w:sz w:val="18"/></w:rPr>
    <w:t>Converted by FileForge · ${pageCount} pages</w:t>
  </w:r>
</w:p>
<w:p/>
${bodyXml}
<w:sectPr>
  <w:pgSz w:w="12240" w:h="15840"/>
  <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
</w:sectPr>
</w:body>
</w:document>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const wordRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:rPr><w:sz w:val="22"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:rPr><w:b/><w:sz w:val="36"/></w:rPr>
  </w:style>
</w:styles>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

  // Build a ZIP manually (minimal ZIP structure)
  const files: Array<{ name: string; data: Uint8Array }> = [
    { name: '[Content_Types].xml', data: str2bytes(contentTypesXml) },
    { name: '_rels/.rels', data: str2bytes(relsXml) },
    { name: 'word/document.xml', data: str2bytes(documentXml) },
    { name: 'word/_rels/document.xml.rels', data: str2bytes(wordRelsXml) },
    { name: 'word/styles.xml', data: str2bytes(stylesXml) },
  ];

  return buildZip(files);
}

function str2bytes(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

// ─── Minimal ZIP builder ─────────────────────────────────────────────────────

function crc32(data: Uint8Array): number {
  const table = makeCrcTable();
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

let _crcTable: number[] | null = null;
function makeCrcTable(): number[] {
  if (_crcTable) return _crcTable;
  _crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    _crcTable[n] = c;
  }
  return _crcTable;
}

function writeUint32LE(v: number, buf: Uint8Array, off: number) {
  buf[off] = v & 0xFF;
  buf[off + 1] = (v >> 8) & 0xFF;
  buf[off + 2] = (v >> 16) & 0xFF;
  buf[off + 3] = (v >> 24) & 0xFF;
}

function writeUint16LE(v: number, buf: Uint8Array, off: number) {
  buf[off] = v & 0xFF;
  buf[off + 1] = (v >> 8) & 0xFF;
}

function buildZip(files: Array<{ name: string; data: Uint8Array }>): Uint8Array {
  const parts: Uint8Array[] = [];
  const centralDir: Uint8Array[] = [];
  let offset = 0;

  for (const f of files) {
    const nameBytes = new TextEncoder().encode(f.name);
    const crc = crc32(f.data);
    const size = f.data.length;

    // Local file header
    const lh = new Uint8Array(30 + nameBytes.length);
    writeUint32LE(0x04034b50, lh, 0);  // signature
    writeUint16LE(20, lh, 4);           // version needed
    writeUint16LE(0, lh, 6);            // flags
    writeUint16LE(0, lh, 8);            // compression (stored)
    writeUint16LE(0, lh, 10);           // mod time
    writeUint16LE(0, lh, 12);           // mod date
    writeUint32LE(crc, lh, 14);
    writeUint32LE(size, lh, 18);
    writeUint32LE(size, lh, 22);
    writeUint16LE(nameBytes.length, lh, 26);
    writeUint16LE(0, lh, 28);
    lh.set(nameBytes, 30);

    parts.push(lh);
    parts.push(f.data);

    // Central directory entry
    const cd = new Uint8Array(46 + nameBytes.length);
    writeUint32LE(0x02014b50, cd, 0);  // signature
    writeUint16LE(20, cd, 4);
    writeUint16LE(20, cd, 6);
    writeUint16LE(0, cd, 8);
    writeUint16LE(0, cd, 10);
    writeUint16LE(0, cd, 12);
    writeUint16LE(0, cd, 14);
    writeUint32LE(crc, cd, 16);
    writeUint32LE(size, cd, 20);
    writeUint32LE(size, cd, 24);
    writeUint16LE(nameBytes.length, cd, 28);
    writeUint16LE(0, cd, 30);
    writeUint16LE(0, cd, 32);
    writeUint16LE(0, cd, 34);
    writeUint16LE(0, cd, 36);
    writeUint32LE(0, cd, 38);
    writeUint32LE(offset, cd, 42);
    cd.set(nameBytes, 46);

    centralDir.push(cd);
    offset += lh.length + f.data.length;
  }

  const cdBytes = concat(centralDir);
  const eocd = new Uint8Array(22);
  writeUint32LE(0x06054b50, eocd, 0);
  writeUint16LE(0, eocd, 4);
  writeUint16LE(0, eocd, 6);
  writeUint16LE(files.length, eocd, 8);
  writeUint16LE(files.length, eocd, 10);
  writeUint32LE(cdBytes.length, eocd, 12);
  writeUint32LE(offset, eocd, 16);
  writeUint16LE(0, eocd, 20);

  return concat([...parts, cdBytes, eocd]);
}

function concat(arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const a of arrays) { out.set(a, off); off += a.length; }
  return out;
}
