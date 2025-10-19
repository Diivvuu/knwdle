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
        relative overflow-hidden
        flex flex-col items-center justify-center
        text-center
        px-4 sm:px-6
        pb-10
        min-h-[85vh]
        -mt-[calc(var(--header-h,64px)+12px)]
        pt-[calc(var(--header-h,64px)+80px)]
      "
    >
      {/* Blobs are now centered & clipped inside the section */}
      {/* mesh gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10
             [background:radial-gradient(60%_40%_at_20%_20%,color-mix(in_srgb,var(--primary)_15%,transparent)_90%,transparent_60%),radial-gradient(40%_30%_at_80%_10%,color-mix(in_srgb,var(--primary)_10%,transparent)_60%,transparent_60%),radial-gradient(30%_50%_at_50%_80%,color-mix(in_srgb,var(--primary)_12%,transparent)_70%,transparent_60%)]"
      />

      {/* grain overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.06]
             [background-image:radial-gradient(black_1px,transparent_1px)]
             dark:[background-image:radial-gradient(white_1px,transparent_1px)]
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
          src="/knwdle-light.svg"
          alt="Knwdle"
          width={160}
          height={160}
          priority
          className="w-24 sm:w-32 md:w-44 lg:w-52 h-auto object-contain object-left dark:hidden"
        />
        {/* Dark mode logo */}
        <Image
          src="/knwdle-dark.svg"
          alt="Knwdle"
          width={160}
          height={160}
          priority
          className="w-24 sm:w-32 md:w-44 lg:w-52 h-auto. object-contain object-left hidden dark:block"
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
          className="px-5 py-2.5 rounded-lg bg-[var(--primary)] text-white text-sm sm:text-base font-medium hover:opacity-90 transition shadow-md w-full sm:w-auto"
        >
          {copy.primaryCta.label}
        </a>
        <a
          href={copy.secondaryCta.href}
          className="px-5 py-2.5 rounded-lg border border-[color-mix(in srgb,var(--primary) 30%,transparent)] text-sm sm:text-base font-medium hover:bg-[color-mix(in srgb,var(--primary) 8%,var(--card))] transition w-full sm:w-auto"
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
