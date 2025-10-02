// apps/web/src/components/create-org/TypePicker.tsx
'use client';

import * as React from 'react';
import { Building2, GraduationCap, School, Briefcase } from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  SCHOOL: School,
  COLLEGE: GraduationCap,
  UNIVERSITY: GraduationCap,
  COACHING_CENTER: Briefcase,
  TUITION_CENTER: Briefcase,
  EDTECH: Building2,
  TRAINING: Briefcase,
  NGO: Building2,
};

export function TypePicker({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[]; // <- from Redux API
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((v) => {
        const Icon = ICON_MAP[v] ?? Building2;
        const active = value === v;
        const label = v
          .toLowerCase()
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (m) => m.toUpperCase());

        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`group rounded-xl border p-4 text-left transition
              ${
                active
                  ? 'border-primary ring-2 ring-primary/30'
                  : 'border-border hover:border-foreground/20'
              }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`h-10 w-10 grid place-items-center rounded-lg
                ${active ? 'bg-primary/10 text-primary' : 'bg-muted text-foreground/80'}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">{label}</div>
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {v}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
