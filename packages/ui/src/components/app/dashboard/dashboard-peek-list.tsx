'use client';
import React from 'react';
import { motion } from 'framer-motion';

export function DashboardPeekList<T>({
  items,
  renderItem,
  emptyText = 'No data available',
}: {
  items?: T[];
  renderItem: (item: T, idx: number) => React.ReactNode;
  emptyText?: string;
}) {
  if (!items?.length)
    return (
      <p className="text-sm text-muted-foreground italic">{emptyText}</p>
    );

  return (
    <motion.ul
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.06 } },
      }}
      className="space-y-2"
    >
      {items.map((it, idx) => (
        <motion.li
          key={idx}
          variants={{
            hidden: { opacity: 0, y: 6 },
            show: { opacity: 1, y: 0 },
          }}
          className="rounded-lg border border-border bg-card/60 backdrop-blur-sm px-3 py-2 hover:bg-muted/40 transition"
        >
          {renderItem(it, idx)}
        </motion.li>
      ))}
    </motion.ul>
  );
}