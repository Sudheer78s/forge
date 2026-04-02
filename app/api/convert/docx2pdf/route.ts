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
    const apiKey = process.env.CLOUDCONVERT_API_KEY;
    if (apiKey) {
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
        const ccMsg = ccErr instanceof Error ? ccErr.message : 'Unknown CloudConvert error';
        return NextResponse.json({ 
          error: `CloudConvert conversion failed: ${ccMsg}. Please check your CloudConvert dashboard and API key settings.` 
        }, { status: 500 });
      }
    } else {
      // Key is missing!
      console.warn('CLOUDCONVERT_API_KEY is not defined in environment.');
      return NextResponse.json({ 
        error: 'High-quality conversion requires a CloudConvert API Key. Please add CLOUDCONVERT_API_KEY to your Vercel Environment Variables.' 
      }, { status: 500 });
    }
  } catch (err: unknown) {
    console.error('docx2pdf error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Conversion failed' },
      { status: 500 }
    );
  }
}
