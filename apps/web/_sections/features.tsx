'use client';

import { motion } from 'framer-motion';

const features = [
  {
    title: '📊 Smart Attendance',
    desc: 'Automated insights and monthly summaries.',
  },
  {
    title: '💳 Effortless Billing',
    desc: 'Track payments, receipts, and fee defaulters.',
  },
  {
    title: '📈 Performance Tracking',
    desc: 'Identify struggling students with AI-powered analytics.',
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="py-28 bg-muted flex flex-col items-center px-6"
    >
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="text-3xl sm:text-5xl font-bold text-center"
      >
        Everything You Need
      </motion.h2>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
        {features.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.2, duration: 0.6 }}
            viewport={{ once: true }}
            className="rounded-2xl bg-card p-8 shadow-sm hover:shadow-lg transition cursor-pointer"
            whileHover={{ y: -6 }}
          >
            <h3 className="text-xl font-semibold">{f.title}</h3>
            <p className="mt-2 text-muted-foreground">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
