'use client';
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Label } from '../../label';
import { ChevronRight } from 'lucide-react';

export function DashboardSection({
  title,
  actionHref,
  actionLabel = 'View all',
  children,
  accent = 'blue',
}: {
  title: string;
  actionHref?: string;
  actionLabel?: string;
  children: React.ReactNode;
  accent?: 'blue' | 'peach' | 'mint' | 'lavender' | 'honey';
}) {
  const accentBorder = {
    blue: 'border-sky-200/70 hover:border-sky-300/80',
    peach: 'border-rose-200/70 hover:border-rose-300/80',
    mint: 'border-emerald-200/70 hover:border-emerald-300/80',
    lavender: 'border-violet-200/70 hover:border-violet-300/80',
    honey: 'border-amber-200/70 hover:border-amber-300/80',
  }[accent];

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 200, damping: 16 }}
      className={`rounded-2xl border ${accentBorder} bg-card/80 backdrop-blur-sm shadow-sm transition-colors`}
    >
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <Label className="font-semibold text-foreground/90">{title}</Label>
          {actionHref && (
            <Link
              href={actionHref}
              className="text-xs inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-border/60 bg-background/60 hover:bg-muted/40 transition"
            >
              {actionLabel}
              <ChevronRight size={14} />
            </Link>
          )}
        </div>
        <div className="text-sm">{children}</div>
      </div>
    </motion.div>
  );
}