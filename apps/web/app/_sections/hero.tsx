'use client';

import { motion } from 'framer-motion';

export default function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center min-h-[90vh] text-center px-6 bg-gradient-to-b from-primary/10 via-background to-background">
      <motion.h1
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-5xl sm:text-7xl font-bold tracking-tight"
      >
        Smarter Management <br />
        for <span className="text-primary">Modern Organisations</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="mt-6 text-lg text-muted-foreground max-w-2xl"
      >
        AI-powered dashboards to simplify academics, finance, and people — all
        in one place.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="mt-10 flex gap-4"
      >
        <a
          href="https://login.yourdomain.com"
          className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
        >
          Get Started
        </a>
        <a
          href="#features"
          className="px-6 py-3 rounded-lg bg-accent text-accent-foreground font-medium hover:opacity-90 transition"
        >
          Learn More
        </a>
      </motion.div>
    </section>
  );
}
