import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'FileForge — Free File Converter',
  description: 'Convert PDF, Word, and images instantly. Free, private, no signup required. PDF to Word, Word to PDF, JPG to PDF and more.',
  keywords: 'file converter, pdf to word, word to pdf, jpg to pdf, pdf to jpg, free converter',
  openGraph: {
    title: 'FileForge — Free File Converter',
    description: 'Convert PDF, Word, and images instantly.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `(function(){var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark');})()`
        }} />
      </head>
      <body className="bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 min-h-screen transition-colors duration-300">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: '!bg-white dark:!bg-neutral-800 !text-neutral-900 dark:!text-neutral-100 !shadow-lg !border !border-neutral-200 dark:!border-neutral-700 !text-sm !font-medium',
            duration: 3500,
          }}
        />
      </body>
    </html>
  );
}
