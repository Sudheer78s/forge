'use client';

import { useState, useEffect } from 'react';
import { FREE_DAILY_LIMIT } from '../lib/types';

const STORAGE_KEY = 'fileforge_usage';

type UsageData = {
  date: string; // YYYY-MM-DD
  count: number;
};

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function useUsageLimit() {
  const [used, setUsed] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data: UsageData = JSON.parse(raw);
        if (data.date === todayStr()) {
          setUsed(data.count);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  const increment = () => {
    const next = used + 1;
    setUsed(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: todayStr(), count: next }));
  };

  const remaining = Math.max(0, FREE_DAILY_LIMIT - used);
  const isLimited = used >= FREE_DAILY_LIMIT;

  return { used, remaining, isLimited, increment, loaded, max: FREE_DAILY_LIMIT };
}
