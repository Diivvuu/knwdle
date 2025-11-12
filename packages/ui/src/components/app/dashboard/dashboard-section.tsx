'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

type Accent = 'default' | 'blue' | 'peach' | 'mint' | 'lavender' | 'honey';

export function DashboardSection({
  title,
  subtitle,
  actionHref,
  actionLabel = 'View all',
  children,
  accent = 'default',
  padded = true,
  className = '',
}: {
  title?: string;
  subtitle?: string;
  actionHref?: string;
  actionLabel?: string;
  children: React.ReactNode;
  accent?: Accent;
  padded?: boolean;
  className?: string;
}) {
  const borderTone = {
    default: 'border-border',
    blue: 'border-sky-200/70 hover:border-sky-300/80',
    peach: 'border-rose-200/70 hover:border-rose-300/80',
    mint: 'border-emerald-200/70 hover:border-emerald-300/80',
    lavender: 'border-violet-200/70 hover:border-violet-300/80',
    honey: 'border-amber-200/70 hover:border-amber-300/80',
  }[accent];

  return (
    <motion.section
      whileHover={{ scale: 1.004 }}
      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      className={`rounded-2xl border ${borderTone} bg-card/80 glass shadow-sm transition-colors ${className}`}
    >
      {(title || actionHref || subtitle) && (
        <header className="px-5 pt-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground/90">
              {title}
            </h2>
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
          {subtitle && (
            <p className="text-xs text-muted-foreground mb-2">{subtitle}</p>
          )}
        </header>
      )}
      <div className={padded ? 'p-5 pt-3' : ''}>{children}</div>
    </motion.section>
  );
}