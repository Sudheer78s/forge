import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64File = buffer.toString("base64");

    const { runCloudConvertJob } = await import('@/app/lib/cloudconvert');
    const fileUrl = await runCloudConvertJob(base64File, file.name, 'pdf', 'jpg');

    return NextResponse.json({ url: fileUrl });
  } catch (err: any) {
    console.error('pdf2jpg error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Conversion failed' },
      { status: 500 }
    );
  }
}