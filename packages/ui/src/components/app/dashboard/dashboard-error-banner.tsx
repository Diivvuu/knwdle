'use client';
import { motion } from 'framer-motion';
import React from 'react';

export function DashboardErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-900"
    >
      <p className="font-semibold">Error loading dashboard</p>
      <p className="text-sm mt-1">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 inline-flex items-center gap-1 rounded-md border border-rose-300 bg-white px-3 py-1.5 text-sm hover:bg-rose-100 transition"
        >
          Retry
        </button>
      )}
    </motion.div>
  );
}