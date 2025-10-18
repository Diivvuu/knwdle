'use client';

import { motion } from 'framer-motion';
import { useRole } from '@/providers/role-provider';

const OPTIONS = [
  { key: 'students', label: 'Students' },
  { key: 'parents', label: 'Parents' },
  { key: 'educators', label: 'Teachers / Tutors' },
  { key: 'institutions', label: 'Schools / Colleges' },
] as const;

export default function RoleSwitcher() {
  const { audience, setAudience } = useRole();

  return (
    <div
      className="
        inline-flex flex-wrap justify-center
        gap-1
        p-1.5
        rounded-full
          bg-[color-mix(in_srgb,var(--primary)_8%,transparent)]  
        border border-muted-foreground/20
        max-w-full
      "
      // prevent iOS rubber-band from selecting text during swipe
      style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
    >
      {OPTIONS.map((opt) => {
        const active = audience === opt.key;
        return (
          <button
            key={opt.key}
            onClick={() => setAudience(opt.key as any)}
            className={`
        relative
        px-3.5 sm:px-4
        py-2
        rounded-full
        text-[13px] sm:text-sm
        font-medium
        leading-none
        min-h-[40px]
        focus:outline-none
        transition
        ${active ? 'text-white' : 'text-muted-foreground hover:text-foreground'}
      `}
          >
            {active && (
              <motion.span
                layoutId="rs-pill"
                className="absolute inset-0 rounded-full bg-[var(--primary)]"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
