'use client';

import React from 'react';
import { motion } from 'framer-motion';

type Tone = 'default' | 'blue' | 'peach' | 'mint' | 'lavender' | 'honey';

export function DashboardCard({
  children,
  tone = 'default',
  className = '',
  interactive = true,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
  interactive?: boolean;
}) {
  const toneClass = {
    default: 'border-border bg-card/80',
    blue: 'border-sky-100 bg-sky-50',
    peach: 'border-rose-100 bg-rose-50',
    mint: 'border-emerald-100 bg-emerald-50',
    lavender: 'border-violet-100 bg-violet-50',
    honey: 'border-amber-100 bg-amber-50',
  }[tone];

  const Wrapper = interactive ? motion.div : 'div';

  return (
    <Wrapper
      {...(interactive ? { whileHover: { y: -2 } } : {})}
      className={`rounded-xl border ${toneClass} p-4 overlay-sheen hover-lift hover-glow ${className}`}
    >
      {children}
    </Wrapper>
  );
}

export function SnapshotMetric({
  label,
  value,
  unit,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  unit?: string;
  tone?: Tone;
}) {
  return (
    <DashboardCard tone={tone}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-foreground/80">{label}</span>
        <span className="font-semibold text-lg text-foreground">
          {unit ? `${unit}` : ''}
          {value}
        </span>
      </div>
    </DashboardCard>
  );
}

export function StatPill({
  icon,
  label,
  value,
  tone = 'blue',
}: {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  tone?: Exclude<Tone, 'default'>;
}) {
  const toneClass = {
    blue: 'bg-sky-100 text-sky-900',
    peach: 'bg-rose-100 text-rose-900',
    mint: 'bg-emerald-100 text-emerald-900',
    lavender: 'bg-violet-100 text-violet-900',
    honey: 'bg-amber-100 text-amber-900',
  }[tone];

  return (
    <motion.div
      whileHover={{ scale: 1.04 }}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${toneClass} font-medium text-xs transition-all`}
    >
      {icon && <span className="opacity-80">{icon}</span>}
      <span>{label}</span>
      <span className="font-semibold">{value}</span>
    </motion.div>
  );
}