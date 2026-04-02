'use client';

import { ConversionTool, TOOLS } from '../lib/types';
import { ArrowRight, Lock } from 'lucide-react';
import clsx from 'clsx';

type Props = {
  selected: string | null;
  onSelect: (id: string) => void;
};

export default function ToolGrid({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {TOOLS.map(tool => (
        <ToolCard
          key={tool.id}
          tool={tool}
          isActive={selected === tool.id}
          onSelect={() => !tool.isPremium && onSelect(tool.id)}
        />
      ))}
    </div>
  );
}

function ToolCard({ tool, isActive, onSelect }: {
  tool: ConversionTool;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={clsx(
        'relative text-left p-4 rounded-xl border transition-all duration-200 group',
        'flex flex-col gap-2',
        isActive
          ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30 shadow-sm shadow-orange-200 dark:shadow-orange-900/20'
          : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-orange-300 dark:hover:border-orange-700 hover:-translate-y-0.5',
        tool.isPremium && 'opacity-70 cursor-not-allowed'
      )}
    >
      {/* Badge */}
      {tool.isPremium ? (
        <span className="absolute top-2 right-2 flex items-center gap-0.5 text-[9px] font-semibold bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400 px-1.5 py-0.5 rounded-full">
          <Lock size={8} />
          PRO
        </span>
      ) : (
        <span className="absolute top-2 right-2 text-[9px] font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400 px-1.5 py-0.5 rounded-full">
          FREE
        </span>
      )}

      <span className="text-2xl">{tool.icon}</span>

      <div>
        <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 leading-tight">
          {tool.name}
        </div>
        <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-tight">
          {tool.description}
        </div>
      </div>

      {/* From → To */}
      <div className="flex items-center gap-1 mt-auto">
        <span className="text-[9px] font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-1.5 py-0.5 rounded">
          {tool.fromLabel}
        </span>
        <ArrowRight size={8} className="text-neutral-400" />
        <span className="text-[9px] font-mono bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-1.5 py-0.5 rounded">
          {tool.toLabel}
        </span>
      </div>
    </button>
  );
}
