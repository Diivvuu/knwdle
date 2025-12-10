// app/_components/landing/section-how-it-works.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion, useInView } from 'framer-motion';
import Image from 'next/image';
import { useRole } from '@/providers/role-provider';
import { roleCopy } from '@/hooks/role-copy';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { icons, type LucideIcon } from 'lucide-react'; // typed map of icons

type Step = {
  title: string;
  desc: string;
  icon: keyof typeof icons;
  media: string;
};

function lucideKey(name: string): keyof typeof icons {
  const k = name.replace(/-./g, (s) => (s && s[1] ? s[1].toUpperCase() : ''));
  return (k[0] ? k[0].toLowerCase() + k.slice(1) : '') as keyof typeof icons;
}

export default function SectionHowItWorks() {
  const { audience } = useRole();
  const copy = roleCopy[audience];
  const prefersReduced = useReducedMotion();
  const steps = useMemo(() => (copy.steps as Step[]).slice(0, 4), [copy.steps]);

  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inView = useInView(containerRef, {
    amount: 0.2,
    once: true,
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        setActive((a) => Math.min(a + 1, steps.length - 1));
      }
      if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [steps.length]);

  const mediaAnim = prefersReduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -12 },
      };

  return (
    <section
      ref={containerRef}
      className="relative mx-auto w-full px-4 sm:px-6 py-14 sm:py-16"
    >
      {/* soft gradient/mesh background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-60 md:opacity-80"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#e8f4ff] via-white to-white dark:from-[#0f172a] dark:via-[#0b1222] dark:to-[#0b1222]" />
        <div className="absolute inset-0 [background:radial-gradient(circle_at_20%_20%,rgba(111,182,233,0.08),transparent_35%),radial-gradient(circle_at_80%_30%,rgba(129,212,250,0.08),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(255,255,255,0.08),transparent_30%)]" />
        <div className="absolute -left-24 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="mb-8 text-center">
        <p className="text-xs uppercase tracking-wider text-primary/80">
          How it works
        </p>
        <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">
          From first click to result — for {audience}.
        </h2>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground">
          A quick, focused flow. No admin maze.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 items-start">
        {/* LEFT: steps list */}
        <ol className="space-y-3">
          {steps.map((s, i) => {
            const key = lucideKey(s.icon as string);
            const Icon = (icons[key] ?? icons.LayoutDashboard) as LucideIcon;
            const isActive = i === active;
            return (
              <motion.li
                key={s.title}
                initial={{ opacity: 0, x: -12 }}
                animate={
                  prefersReduced
                    ? { opacity: 1, x: 0 }
                    : { opacity: inView ? 1 : 0, x: inView ? 0 : -12 }
                }
                transition={{ duration: 0.35, delay: i * 0.05 }}
              >
                <Card
                  className={`group transition-all duration-300 border-transparent bg-gradient-to-r from-primary/5 to-background/60 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 ${
                    isActive
                      ? 'border-primary/40 ring-1 ring-primary/20'
                      : 'border-transparent'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    className="w-full text-left rounded-xl p-0"
                  >
                    <CardHeader className="flex flex-row items-start gap-3 pb-2">
                      <div
                        className={`mt-1 rounded-lg border bg-primary/10 p-2 transition-transform duration-300 group-hover:-translate-y-1 ${
                          isActive ? 'ring-1 ring-primary/30' : ''
                        }`}
                      >
                        <Icon className="h-5 w-5 text-primary/90" />
                      </div>
                      <div className="space-y-1">
                        <CardTitle className="text-base">
                          {i + 1}. {s.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {s.desc}
                        </p>
                      </div>
                    </CardHeader>
                  </button>
                </Card>
              </motion.li>
            );
          })}
        </ol>

        {/* RIGHT: sticky preview */}
        <div className="relative">
          <motion.div
            className="sticky top-[calc(var(--header-h,64px)+24px)]"
            initial={{ opacity: 0, x: 30 }}
            animate={
              prefersReduced
                ? { opacity: 1, x: 0 }
                : { opacity: inView ? 1 : 0, x: inView ? 0 : 30 }
            }
            transition={{ duration: 0.4, delay: 0.08 }}
          >
            <Card className="backdrop-blur-md bg-white/40 dark:bg-slate-900/50 border border-white/30 dark:border-white/10 shadow-2xl shadow-primary/10 rotate-0 md:-rotate-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Step {active + 1} preview
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-hidden">
                {/* ✅ clamps content */}
                <motion.div
                  key={active}
                  initial={mediaAnim.initial}
                  animate={mediaAnim.animate}
                  exit={mediaAnim.exit}
                  transition={{ duration: 0.28 }}
                  className="relative w-full aspect-video overflow-hidden rounded-xl border bg-gradient-to-br from-white/70 to-background/60 shadow-lg shadow-primary/10"
                >
                  <div className="absolute left-0 right-0 top-0 z-10 flex h-8 items-center gap-1 border-b bg-background/80 px-3">
                    <span className="h-3 w-3 rounded-full bg-red-400" />
                    <span className="h-3 w-3 rounded-full bg-yellow-400" />
                    <span className="h-3 w-3 rounded-full bg-green-400" />
                    <span className="ml-2 text-xs text-muted-foreground">
                      preview.knwdle.app
                    </span>
                  </div>

                  {steps[active] && (
                    <Image
                      src={steps[active].media}
                      alt={steps[active].title}
                      fill
                      className="object-contain pt-6 pb-2"
                      priority
                    />
                  )}
                </motion.div>
                {/* animated dots */}
                <div className="mt-4 flex items-center justify-center gap-3">
                  {steps.map((_, i) => (
                    <motion.button
                      key={i}
                      aria-label={`Go to step ${i + 1}`}
                      onClick={() => setActive(i)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className={`h-2.5 w-2.5 rounded-full transition
            ${i === active ? 'bg-primary shadow shadow-primary/40' : 'bg-muted hover:bg-muted-foreground/30'}`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
