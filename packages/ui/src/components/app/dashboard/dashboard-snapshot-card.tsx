'use client';
import { motion } from 'framer-motion';
import React from 'react';

export function DashboardSnapshotCard({
  label,
  value,
  unit,
  tone = 'blue',
}: {
  label: string;
  value: string | number;
  unit?: string;
  tone?: 'blue' | 'peach' | 'mint' | 'lavender' | 'honey';
}) {
  const bgTone = {
    blue: 'bg-sky-50 border-sky-100',
    peach: 'bg-rose-50 border-rose-100',
    mint: 'bg-emerald-50 border-emerald-100',
    lavender: 'bg-violet-50 border-violet-100',
    honey: 'bg-amber-50 border-amber-100',
  }[tone];

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`rounded-xl border ${bgTone} p-4 shadow-sm`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-foreground/80">{label}</span>
        <span className="font-semibold text-lg text-foreground">
          {unit}
          {value}
        </span>
      </div>
    </motion.div>
  );
}