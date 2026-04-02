'use client';

import { useUsageLimit } from '../hooks/useUsageLimit';
import clsx from 'clsx';

export default function UsageIndicator() {
  const { used, remaining, max, loaded } = useUsageLimit();

  if (!loaded) return null;

  return (
    <div className="flex items-center gap-3 text-xs text-neutral-600 dark:text-neutral-400">
      <span>Free conversions today:</span>
      <div className="flex items-center gap-1">
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className={clsx(
              'w-2 h-2 rounded-full transition-colors',
              i < used
                ? 'bg-orange-500'
                : 'bg-neutral-300 dark:bg-neutral-600'
            )}
          />
        ))}
      </div>
      <span className={clsx(remaining === 0 ? 'text-red-500 font-medium' : 'text-neutral-500 dark:text-neutral-400')}>
        {remaining}/{max} left
      </span>
    </div>
  );
}
