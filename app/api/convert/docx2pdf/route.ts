import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

// Max 10 MB
const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File exceeds 10 MB limit' }, { status: 413 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['docx', 'doc'].includes(ext || '')) {
      return NextResponse.json({ error: 'Only .docx/.doc files accepted' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Primary: CloudConvert for 1:1 fidelity
    if (process.env.CLOUDCONVERT_API_KEY) {
      try {
        const { runCloudConvertJob } = await import('@/app/lib/cloudconvert');
        const fileUrl = await runCloudConvertJob(buffer.toString('base64'), file.name, 'docx', 'pdf');
        
        const axios = (await import('axios')).default;
        const pdfRes = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        const pdfBytes = Buffer.from(pdfRes.data);
        
        return new NextResponse(pdfBytes as any, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${file.name.replace(/\.docx?$/i, '.pdf')}"`,
            'Content-Length': pdfBytes.byteLength.toString(),
          },
        });
      } catch (ccErr) {
        console.error('CloudConvert docx2pdf error:', ccErr);
        // If it's a server error but we have a key, we should let the user know instead of a silent broken fallback
        const ccMsg = ccErr instanceof Error ? ccErr.message : 'Unknown CloudConvert error';
        if (ccMsg.toLowerCase().includes('job timed out') || ccMsg.toLowerCase().includes('api key')) {
           return NextResponse.json({ error: `CloudConvert error: ${ccMsg}. Check your API settings.` }, { status: 500 });
        }
        console.log('Falling back to local extraction (text-only)...');
      }
    }

    // Secondary: Local text-based extraction (Mammoth)
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value || '(No text content found)';

    // Build PDF from extracted text using pdf-lib
    const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const PAGE_W = 595;   // A4 pt
    const PAGE_H = 842;
    const MARGIN = 60;
    const LINE_H = 16;
    const FONT_SIZE = 10.5;
    const MAX_W = PAGE_W - MARGIN * 2;

    const sanitizedLines = text.split('\n').map(l => l.replace(/[^\x00-\xFF]/g, '?'));
    
    let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    let y = PAGE_H - MARGIN;

    // Title
    const sanitizedTitle = file.name.replace(/\.docx?$/i, '').replace(/[^\x00-\xFF]/g, '?');
    page.drawText(sanitizedTitle, {
      x: MARGIN, y,
      font: boldFont,
      size: 14,
      color: rgb(0.1, 0.1, 0.1),
      maxWidth: MAX_W,
    });
    y -= LINE_H * 2;

    // Divider
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_W - MARGIN, y },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });
    y -= LINE_H;

    for (const rawLine of sanitizedLines) {
      const trimmed = rawLine.trim();

      // Word-wrap each line
      const words = trimmed.split(' ');
      let currentLine = '';

      for (const word of words) {
        const test = currentLine ? `${currentLine} ${word}` : word;
        const w = font.widthOfTextAtSize(test, FONT_SIZE);
        if (w > MAX_W && currentLine) {
          // Draw current line
          if (y < MARGIN + LINE_H) {
            page = pdfDoc.addPage([PAGE_W, PAGE_H]);
            y = PAGE_H - MARGIN;
          }
          page.drawText(currentLine, {
            x: MARGIN, y,
            font,
            size: FONT_SIZE,
            color: rgb(0.15, 0.15, 0.15),
          });
          y -= LINE_H;
          currentLine = word;
        } else {
          currentLine = test;
        }
      }

      if (currentLine) {
        if (y < MARGIN + LINE_H) {
          page = pdfDoc.addPage([PAGE_W, PAGE_H]);
          y = PAGE_H - MARGIN;
        }
        page.drawText(currentLine, {
          x: MARGIN, y,
          font,
          size: FONT_SIZE,
          color: rgb(0.15, 0.15, 0.15),
        });
        y -= LINE_H;
      }

      // Blank line between paragraphs
      if (!trimmed) y -= LINE_H * 0.4;
    }

    const pdfBytes = await pdfDoc.save();
    const outName = file.name.replace(/\.docx?$/i, '.pdf');

    return new NextResponse(pdfBytes as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${outName}"`,
        'Content-Length': pdfBytes.byteLength.toString(),
      },
    });
  } catch (err: unknown) {
    console.error('docx2pdf error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Conversion failed' },
      { status: 500 }
    );
  }
}
