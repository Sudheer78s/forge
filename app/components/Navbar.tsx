'use client';

import { useDarkMode } from '../hooks/useDarkMode';
import { Sun, Moon, Zap } from 'lucide-react';

export default function Navbar() {
  const { dark, toggle } = useDarkMode();

  return (
    <nav className="sticky top-0 z-50 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-orange-600 rounded-md flex items-center justify-center flex-shrink-0">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M2.5 12.5V7L7.5 2L12.5 7V12.5H9.5V9H5.5V12.5H2.5Z" fill="white" />
            </svg>
          </div>
          <span className="font-semibold text-[15px] tracking-tight text-neutral-900 dark:text-white">
            FileForge
          </span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
            <Zap size={12} />
            Go Pro
          </button>
        </div>
      </div>
    </nav>
  );
}
