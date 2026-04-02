'use client';

import { Zap, Infinity, Shield, Gauge } from 'lucide-react';
import toast from 'react-hot-toast';

const FEATURES = [
  { icon: <Infinity size={14} />, label: 'Unlimited conversions' },
  { icon: <Gauge size={14} />, label: 'Priority processing' },
  { icon: <Shield size={14} />, label: 'Advanced security' },
  { icon: <Zap size={14} />, label: 'Batch processing' },
];

export default function PremiumCTA() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 p-6 text-white">
      {/* Decorative circles */}
      <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/5 rounded-full" />
      <div className="absolute -bottom-8 -left-4 w-24 h-24 bg-white/5 rounded-full" />

      <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <Zap size={16} className="text-yellow-300" />
            <span className="text-sm font-bold tracking-wide">FileForge Pro</span>
          </div>
          <p className="text-sm text-violet-200 mb-4">
            Remove limits and unlock all tools. Starting at just $4.99/month.
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {FEATURES.map(f => (
              <div key={f.label} className="flex items-center gap-1.5 text-xs text-violet-200">
                <span className="text-violet-300">{f.icon}</span>
                {f.label}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => toast('Pro plan coming soon! 🚀', { icon: '⚡' })}
          className="flex-shrink-0 bg-white text-violet-700 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-violet-50 transition-colors"
        >
          Upgrade — $4.99/mo
        </button>
      </div>
    </div>
  );
}
