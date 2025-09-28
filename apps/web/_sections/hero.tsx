'use client';

import RoleSwitcher from '@/hooks/role-switcher';
import { roleCopy } from '@/hooks/role-copy';
import { useRole } from '@/providers/role-provider';
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
      {/* mesh gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10
             [background:radial-gradient(60%_40%_at_20%_20%,hsl(152_70%_92%)/.9,transparent_60%),radial-gradient(40%_30%_at_80%_10%,hsl(152_70%_85%)/.6,transparent_60%),radial-gradient(30%_50%_at_50%_80%,hsl(152_70%_90%)/.7,transparent_60%)]"
      />

      {/* grain overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.06]
             [background-image:radial-gradient(black_1px,transparent_1px)]
             [background-size:5px_5px]"
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
