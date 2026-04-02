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

    // Primary: CloudConvert for high-quality extraction & OCR
    const apiKey = process.env.CLOUDCONVERT_API_KEY;
    if (apiKey) {
      try {
        const { runCloudConvertJob } = await import('@/app/lib/cloudconvert');
        const fileUrl = await runCloudConvertJob(
          buffer.toString('base64'), 
          file.name, 
          'pdf', 
          'docx',
          { engine: 'office', ocr: true } // 🚀 OCR enabled
        );
        
        const axios = (await import('axios')).default;
        const res = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        const docxBytes = Buffer.from(res.data);
        const outName = file.name.replace(/\.pdf$/i, '.docx');

        return new NextResponse(docxBytes, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename="${outName}"`,
            'Content-Length': docxBytes.byteLength.toString(),
          },
        });
      } catch (ccErr) {
        console.error('CloudConvert pdf2docx error:', ccErr);
        const ccMsg = ccErr instanceof Error ? ccErr.message : 'Unknown CloudConvert error';
        return NextResponse.json({ 
          error: `CloudConvert OCR failed: ${ccMsg}. Please check your API key and CloudConvert limits.` 
        }, { status: 500 });
      }
    } else {
      return NextResponse.json({ 
        error: 'OCR and high-quality PDF-to-Word conversion requires a CloudConvert API Key. Please add CLOUDCONVERT_API_KEY to your Vercel Environment Variables.' 
      }, { status: 500 });
    }
  } catch (err: unknown) {
    console.error('pdf2docx error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Conversion failed' },
      { status: 500 }
    );
  }
}
