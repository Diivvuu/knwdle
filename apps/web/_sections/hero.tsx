'use client';

import RoleSwitcher from '@/_components/role-switcher';
import { roleCopy } from '@/hooks/role-copy';
import { useRole } from '@/hooks/role-provider';
import { useAutoHeight } from '@/hooks/use-auto-height';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';

export default function Hero() {
  const { audience } = useRole();
  const copy = roleCopy[audience];
  const autoHeightRef = useAutoHeight([audience]);
  const prefersReducedMotion = useReducedMotion();

  const hVars = prefersReducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 24 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -24 },
      };

  const pVars = prefersReducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -12 },
      };

  return (
    <section
      className="
        relative overflow-hidden   /* 🔒 prevents blob overflow causing horizontal scroll */
        flex flex-col items-center justify-center
        text-center
        px-4 sm:px-6
        pt-20 pb-10
        min-h-[85vh]
      "
    >
      {/* Blobs are now centered & clipped inside the section */}
      <div
        aria-hidden
        className="
          pointer-events-none absolute
          left-1/2 -translate-x-1/2 -top-28
          h-56 w-56 sm:h-72 sm:w-72
          rounded-full bg-[hsla(149,97%,14%,0.06)] blur-3xl
        "
      />
      <div
        aria-hidden
        className="
          pointer-events-none absolute
          right-1/2 translate-x-1/2 top-56
          h-56 w-56 sm:h-96 sm:w-96
          rounded-full bg-[hsla(149,97%,14%,0.05)] blur-3xl
        "
      />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mb-4"
      >
        <Image
          src="/knwdle.svg"
          alt="Knwdle Logo"
          width={160}
          height={160}
          priority
          className="w-24 sm:w-32 md:w-44 lg:w-52 h-auto"
        />
      </motion.div>

      {/* Switcher */}
      <div className="mb-5 w-full flex justify-center">
        <RoleSwitcher />
      </div>

      {/* Headline + Subline with smooth height */}
      <div ref={autoHeightRef} className="w-full max-w-4xl">
        <AnimatePresence mode="wait">
          <motion.h1
            key={audience + '-h'}
            {...hVars}
            transition={{ duration: 0.4 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mx-auto max-w-[22ch] sm:max-w-[20ch]"
          >
            {copy.headline}
          </motion.h1>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.p
            key={audience + '-p'}
            {...pVars}
            transition={{ duration: 0.32, delay: 0.04 }}
            className="mt-5 text-base sm:text-lg text-muted-foreground mx-auto max-w-3xl"
          >
            {copy.subline}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* CTAs (stack on mobile) */}
      <div className="mt-8 flex w-full max-w-md sm:max-w-none flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
        <a
          href={copy.primaryCta.href}
          className="px-5 py-2.5 rounded-lg bg-[hsla(149,97%,14%,1)] text-white text-sm sm:text-base font-medium hover:opacity-90 transition shadow-md w-full sm:w-auto"
        >
          {copy.primaryCta.label}
        </a>
        <a
          href={copy.secondaryCta.href}
          className="px-5 py-2.5 rounded-lg border border-[hsla(149,97%,14%,0.3)] text-sm sm:text-base font-medium hover:bg-green-50 transition w-full sm:w-auto"
        >
          {copy.secondaryCta.label}
        </a>
      </div>

      {/* Badges */}
      <div className="mt-8 flex flex-wrap gap-2 justify-center px-1">
        {copy.badges.map((b) => (
          <span
            key={b}
            className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground border border-muted-foreground/20"
          >
            {b}
          </span>
        ))}
      </div>

      {/* Screenshot / visual placeholder */}
      <div className="mt-10 w-full max-w-5xl px-1">
        <div className="rounded-2xl border bg-card/50 backdrop-blur p-4 text-left shadow-sm">
          <div className="text-sm text-muted-foreground mb-3">
            Product preview
          </div>
          <div className="aspect-video w-full rounded-xl bg-gradient-to-br from-muted to-background grid place-items-center text-muted-foreground">
            <span className="text-sm">
              Dashboard mock / screenshot goes here
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
