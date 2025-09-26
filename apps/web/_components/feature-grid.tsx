'use client';

import { roleCopy } from '@/hooks/role-copy';
import { useRole } from '@/providers/role-provider';

export default function FeatureGrid() {
  const { audience } = useRole();
  const features = roleCopy[audience].features;

  return (
    <section id="features" className="py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-2xl md:text-3xl font-bold mb-8">
          Features for you
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-xl bg-white dark:bg-zinc-900 shadow-sm border"
            >
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
