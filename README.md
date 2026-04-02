# FileForge 🔥

A modern, privacy-focused file conversion tool. Convert PDF ↔ Word, images ↔ PDF, and compress images — all for free.

## Features

- **JPG/PNG → PDF** — Combine multiple images into a single PDF (client-side, jsPDF)
- **PDF → JPG** — Extract pages as JPEG images (server-side, sharp + pdf-lib)
- **Word → PDF** — Convert .docx to PDF with text extraction (server-side, mammoth + pdf-lib)
- **PDF → Word** — Extract text from PDF into .docx (server-side, pdf-parse)
- **Compress Image** — Reduce image file size up to 80% (client-side, canvas)
- **Merge PDFs** — Combine multiple PDFs *(Pro feature, pdf-lib)*

### UX features
- Drag & drop with previews
- Animated progress bars
- Dark / light mode
- 5 free conversions/day (localStorage-based)
- Premium upgrade CTA
- AdSense-ready ad slot
- Fully responsive

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Animations | CSS + Framer Motion ready |
| Client PDF | jsPDF, pdf-lib |
| Server PDF | pdf-lib, mammoth, pdf-parse, sharp |
| Deployment | Vercel (serverless) |

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Copy env file
cp .env.example .env.local

# 3. Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect your GitHub repo to Vercel for automatic deployments.

### Environment Variables (optional)

| Variable | Description |
|----------|-------------|
| `CLOUDCONVERT_API_KEY` | For higher-quality PDF↔Word via CloudConvert API |
| `NEXT_PUBLIC_ADSENSE_ID` | Google AdSense publisher ID |
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4 measurement ID |

---

## Project Structure

```
fileforge/
├── app/
│   ├── api/
│   │   └── convert/
│   │       ├── docx2pdf/route.ts   # Word → PDF (server)
│   │       ├── pdf2docx/route.ts   # PDF → Word (server)
│   │       └── pdf2jpg/route.ts    # PDF → JPG (server)
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── ToolGrid.tsx
│   │   ├── DropZone.tsx
│   │   ├── ConverterPanel.tsx      # Main conversion orchestrator
│   │   ├── ProgressBar.tsx
│   │   ├── ResultsPanel.tsx
│   │   ├── UsageIndicator.tsx
│   │   ├── PremiumCTA.tsx
│   │   └── Footer.tsx
│   ├── hooks/
│   │   ├── useDarkMode.ts
│   │   └── useUsageLimit.ts
│   ├── lib/
│   │   ├── types.ts                # Shared types + tool definitions
│   │   └── converters.ts           # Client-side conversion logic
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── public/
│   └── favicon.svg
├── vercel.json
└── package.json
```

---

## Upgrading PDF ↔ Word Quality

For production-grade Word ↔ PDF conversion, integrate [CloudConvert](https://cloudconvert.com/api):

```typescript
// In your API route
const response = await fetch('https://api.cloudconvert.com/v2/jobs', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${process.env.CLOUDCONVERT_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    tasks: {
      'upload': { operation: 'import/upload' },
      'convert': { operation: 'convert', input: 'upload', output_format: 'pdf' },
      'export': { operation: 'export/url', input: 'convert' },
    },
  }),
});
```

---

## License

MIT
