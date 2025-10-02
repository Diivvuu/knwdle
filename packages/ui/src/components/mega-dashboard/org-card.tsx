'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../card';

import { Building2 } from 'lucide-react';
import { chip } from './utils';

export function OrgCard({ org }: { org: any }) {
  const brand = org.brand_color ?? '#6366f1';
  const gradient = `linear-gradient(180deg, ${brand}22 0%, transparent 60%)`;
  const meta = org?.profile?.meta ?? {};
  const features = Object.entries(meta.features ?? {})
    .filter(([, v]) => !!v)
    .map(([k]) => k);
  const teamSize = meta.teamSize ?? org.teamSize;
  const focusArea = meta.focusArea;
  const desc = meta.description;

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all border">
      {/* Cover */}
      <div className="relative h-24">
        <div className="absolute inset-0" style={{ background: gradient }} />
        {org.coverUrl ? (
          <img
            src={org.coverUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-80"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-muted to-background" />
        )}
        <div className="absolute bottom-2 left-3 flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl grid place-items-center border bg-background/80 backdrop-blur">
            {org.logoUrl ? (
              <img
                src={org.logoUrl}
                alt=""
                className="h-10 w-10 object-cover rounded-xl"
              />
            ) : (
              <span className="text-xs font-semibold">
                {org.name?.slice(0, 2)?.toUpperCase()}
              </span>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground">
            Since {new Date(org.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Body */}
      <CardHeader className="pb-2">
        <CardTitle className="text-base truncate">{org.name}</CardTitle>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {org.myRole && chip(org.myRole)}
          {typeof teamSize === 'number' && chip(`${teamSize} team`)}
          {focusArea && chip(focusArea)}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {desc ? (
          <p className="text-xs text-muted-foreground line-clamp-2">{desc}</p>
        ) : (
          <p className="text-xs text-muted-foreground italic">No description</p>
        )}
        {features.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {features.map((f) => (
              <span
                key={f}
                className="text-[10.5px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 capitalize"
              >
                {f}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
