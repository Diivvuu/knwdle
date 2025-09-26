'use client';

import { useMemo } from 'react';

type Props = { value: string };

function scorePwd(pwd: string) {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return Math.min(score, 5);
}

export default function StrengthMeter({ value }: Props) {
  const s = useMemo(() => scorePwd(value), [value]);

  // pick color gradient based on score
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-green-500',
    'bg-emerald-600',
  ];
  const pct = (s / 5) * 100;

  return (
    <div className="mt-1 h-2 w-full rounded-full bg-muted overflow-hidden">
      <div
        className={`h-full transition-[width,background-color] duration-500 ease-out ${
          colors[s - 1] || 'bg-red-500'
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
