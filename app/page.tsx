'use client';

import { useState } from 'react';
import Navbar from './components/Navbar';
import ToolGrid from './components/ToolGrid';
import ConverterPanel from './components/ConverterPanel';
import PremiumCTA from './components/PremiumCTA';
import UsageIndicator from './components/UsageIndicator';
import Footer from './components/Footer';
import { Shield, Zap, Lock } from 'lucide-react';

export default function Home() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    setSelectedTool(id);
    setTimeout(() => {
      document.getElementById('converter')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-10 space-y-10">

        {/* Hero */}
        <section className="text-center space-y-4 py-4">
          <div className="inline-flex items-center gap-2 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 text-xs font-medium px-3 py-1.5 rounded-full border border-orange-200 dark:border-orange-800 mb-2">
            <Zap size={12} />
            Free · No signup · Files never stored
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Convert files{' '}
            <span className="gradient-text">instantly</span>
          </h1>
          <p className="text-base text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
            PDF, Word, and images — convert anything in seconds. Private, fast, and free.
          </p>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 pt-2">
            {[
              { icon: <Shield size={13} />, label: '100% Private' },
              { icon: <Zap size={13} />, label: 'Instant Conversion' },
              { icon: <Lock size={13} />, label: 'No Account Needed' },
            ].map(b => (
              <div key={b.label} className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                <span className="text-orange-500">{b.icon}</span>
                {b.label}
              </div>
            ))}
          </div>
        </section>

        {/* Tool grid */}
        <section>
          <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-4">
            Choose a conversion
          </h2>
          <ToolGrid selected={selectedTool} onSelect={handleSelect} />
        </section>

        {/* Converter */}
        {selectedTool && (
          <section id="converter" className="scroll-mt-20 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Convert
              </h2>
              <UsageIndicator />
            </div>
            <ConverterPanel key={selectedTool} toolId={selectedTool} />
          </section>
        )}

        {/* Ad slot placeholder */}
        {selectedTool && (
          <div className="border border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl p-4 text-center text-xs text-neutral-400 dark:text-neutral-600">
            {/* Google AdSense: Replace with <ins class="adsbygoogle" ...> */}
            Advertisement · <a href="#" className="underline">FileForge Free Tier</a>
          </div>
        )}

        {/* Premium CTA */}
        <PremiumCTA />

        {/* Features section */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              icon: '🔒',
              title: 'Your files stay private',
              desc: 'Client-side conversions never leave your browser. Server conversions are deleted immediately after processing.',
            },
            {
              icon: '⚡',
              title: 'Fast & lightweight',
              desc: 'Built on Next.js and deployed on Vercel edge infrastructure for sub-second response times worldwide.',
            },
            {
              icon: '🛠️',
              title: 'No install required',
              desc: 'Works entirely in your browser. No software to download, no extensions, no plugins.',
            },
          ].map(f => (
            <div key={f.title} className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-2">
              <span className="text-2xl">{f.icon}</span>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{f.title}</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </section>

      </main>

      <Footer />
    </div>
  );
}
