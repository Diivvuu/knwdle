'use client';

import { motion } from 'framer-motion';

export default function CTA() {
  return (
    <section className="py-28 text-center bg-primary text-primary-foreground">
      <motion.h2
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="text-3xl sm:text-5xl font-bold"
      >
        Ready to Level Up?
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="mt-8"
      >
        <a
          href="/auth"
          className="px-8 py-4 rounded-lg bg-card text-card-foreground font-medium hover:opacity-90 transition"
        >
          Create Your Account
        </a>
      </motion.div>
    </section>
  );
}
