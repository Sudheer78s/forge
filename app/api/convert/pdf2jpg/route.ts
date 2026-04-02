import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Convert file to base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64File = buffer.toString("base64");

    // 🔥 CloudConvert job
    const response = await axios.post(
      "https://api.cloudconvert.com/v2/jobs",
      {
        tasks: {
          "import-file": {
            operation: "import/base64",
            file: base64File,
            filename: file.name,
          },
          "convert-file": {
            operation: "convert",
            input: "import-file",
            output_format: "jpg",
          },
          "export-file": {
            operation: "export/url",
            input: "convert-file",
          },
        },
      },
      {
        headers: {
          Authorization: `eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiYzliMmIzYjMxYjFkOWQ2YmUxZTViMmZmMDkwZjFkYTZmN2ExNWEyNWIwNTFjNmM3NGIzZTQ5ZWYxY2JlNzhlMzVmNmYwZmY5YzI1ZDEzNDciLCJpYXQiOjE3NzUxMzY3MjkuODY0MjUzLCJuYmYiOjE3NzUxMzY3MjkuODY0MjU0LCJleHAiOjQ5MzA4MTAzMjkuODU5NjA1LCJzdWIiOiI3NDk2MTU0MiIsInNjb3BlcyI6WyJ0YXNrLndyaXRlIiwidGFzay5yZWFkIl19.A2nH3smh8RBPy2mujlrXwCgcsPCro4OSGDscpNCaVDJDKqDIsZDbw5AHu0pbWk_LyCsM_ngun-L1xUoUHj0y5BYsppPmoBqq_Yg-XQXLI64IQ28lgu0tq02pfTKZneVTAZScCuwvawMYIXxs77DdJmVB0LPT7fruv6YaL9oDyiZA7mYIQC81W3AEOu9vcfboKZESOcSzKKwfaelIFmm9-uEEz1IyQ0YpPoMxOpAmABfVgIe_Jy0SOLIKpYBaofBPGtN6d-SL3qjNbZXU8-RLrooyUjm9kPXg6rVaQOO4koxoE1mYxjmhRngSzQtdaEwAZhtqfnz-j_0yD_5TOQhBNzqfZVH-uynyv7VL6gTsso9EOM4t5KTK6Azgc9PJRwcWQ0ftdwbsqPpLOukQxDl0-OnSIa9iQe2d64pREjqY0DZzoKAOuPnbPasBx2a7bca2gz6yK3VBl4VxAR4Zx44AWBBJpKnnlUVuXIupkKTDcnAfeV-ouq1ewr3Nf2jpVT91Tg9XVoOYyDX1bWBOx-jD6V6KbHiOHGt4Nc1m-oNFW3sI67m0nr1TIn3j_m_2uOejpgt8YVmBuw6ffM7ZMuqyv6vosMLGiIdRvkrwtBS6ZafN5kVkeEKJ-VI4bs2off4Ul1Xhcy15FT6ImYKFdvwxBnlEnES0PFSh6xBLvzjBiik
`, // 👈 PUT YOUR TOKEN HERE
          "Content-Type": "application/json",
        },
      }
    );

    const exportTask = response.data.data.tasks.find(
      (t: any) => t.name === "export-file"
    );

    const fileUrl = exportTask.result.files[0].url;

    return NextResponse.json({ url: fileUrl });

  } catch (error: any) {
    console.error(error.response?.data || error.message);
    return NextResponse.json({ error: "Conversion failed" }, { status: 500 });
  }
}