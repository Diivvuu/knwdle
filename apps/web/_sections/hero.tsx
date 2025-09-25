'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export default function Hero() {
  return (
    <section className="pt-20 relative flex flex-col items-center justify-center min-h-[90vh] text-center px-6 bg-gradient-to-b from-[hsla(149,97%,14%,0.05)] via-background to-background">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-4"
      >
        <Image
          src="/knwdle.svg"
          alt="Knwdle Logo"
          width={160}
          height={160}
          priority
          className="w-32 h-auto sm:w-40 md:w-48 lg:w-56"
        />
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight"
      >
        Smart Management for Learning Organisations
      </motion.h1>

      {/* Subcopy */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="mt-6 text-base sm:text-lg text-muted-foreground max-w-3xl"
      >
        From{' '}
        <span className="font-semibold text-foreground">
          attendance tracking
        </span>{' '}
        to <span className="font-semibold text-foreground">fee billing</span>,
        from <span className="font-semibold text-foreground">assignments</span>{' '}
        to <span className="font-semibold text-foreground">announcements</span>{' '}
        — Knwdle unifies academics, finance, and organisation structure in a
        single platform. With built-in{' '}
        <span className="font-semibold text-foreground">AI insights</span> to
        predict defaulters, summarise performance, and generate content.
      </motion.p>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="mt-10 flex gap-4"
      >
        <a
          href="https://login.knwdle.com"
          className="px-5 py-2.5 rounded-lg bg-[hsla(149,97%,14%,1)] text-white text-sm sm:text-base font-medium hover:opacity-90 transition shadow-md"
        >
          Explore Knwdle
        </a>
        <a
          href="#features"
          className="px-5 py-2.5 rounded-lg border border-[hsla(149,97%,14%,0.3)] text-sm sm:text-base font-medium hover:bg-green-50 transition"
        >
          See Features
        </a>
      </motion.div>
    </section>
  );
}
