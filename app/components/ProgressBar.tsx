'use client';

import clsx from 'clsx';

type Props = {
  percent: number;
  message: string;
  className?: string;
};

export default function ProgressBar({ percent, message, className }: Props) {
  return (
    <div className={clsx('space-y-1.5', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-600 dark:text-neutral-400">{message}</span>
        <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{Math.round(percent)}%</span>
      </div>
      <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
        <div
          className={clsx(
            'h-full bg-orange-500 rounded-full transition-all duration-300 ease-out',
            percent < 100 && 'progress-bar-animated'
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
