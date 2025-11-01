'use client';
import { motion } from 'framer-motion';
import React from 'react';

export function DashboardStatPill({
  icon,
  label,
  value,
  tone = 'blue',
}: {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  tone?: 'blue' | 'peach' | 'mint' | 'lavender' | 'honey';
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