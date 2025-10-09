'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { RefreshCw, FolderTree, UserPlus, Palette } from 'lucide-react';
import type { OrgBasic } from '@workspace/state';

export default function OrgHero({
  orgId,
  basic,
  onRefresh,
}: {
  orgId: string;
  basic?: { status: string; data?: OrgBasic };
  onRefresh: () => void;
}) {
  const org = basic?.data;
  const isLoading = basic?.status === 'loading';

  const brand = org?.brand_color || '#e5e7eb'; // fallback to gray-200
  return (
    <Card className="overflow-hidden border-none shadow-none">
      {/* Cover */}
      <div
        className="relative h-36 md:h-44 lg:h-52 w-full bg-muted"
        style={{
          background: org?.coverUrl
            ? undefined
            : `linear-gradient(90deg, ${brand}33, ${brand}66)`,
        }}
      >
        {org?.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={org.coverUrl}
            alt="cover"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
      </div>
      <CardContent className="-mt-10 md:-mt-12 lg:-mt-16">
        <div className="flex gap-4 items-end">
          <div className="h-20 w-20 md:h-24 md:w-24 rounded-2xl bg-white shadow -mt-8 overflow-hidden ring-1 ring-border">
            {org?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={org.logoUrl}
                alt="logo"
                className="h-full w-full object-contain p-2"
              />
            ) : (
              <div className="h-full w-full grid place-items-center text-sm text-muted-foreground">
                Logo
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight truncate">
                {isLoading ? (
                  <Skeleton className="h-8 w-64" />
                ) : (
                  org?.name || '—'
                )}
              </h1>
              {org?.type ? <Badge variant="secondary">{org.type}</Badge> : null}
            </div>
            <div className="mt-1 text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
              {org?.country ? <span>Country: {org.country}</span> : null}
              {org?.timezone ? <span>Timezone: {org.timezone}</span> : null}
              {org?.address ? (
                <span className="truncate">Address: {org.address}</span>
              ) : null}
              {org?.contactPhone ? (
                <span>Phone: {org.contactPhone}</span>
              ) : null}
            </div>
            {org?.profile?.meta ? (
              <div className="mt-2 text-xs text-muted-foreground line-clamp-2">
                Meta: {JSON.stringify(org.profile.meta)}
              </div>
            ) : null}
          </div>
          <div className="shrink-0 flex gap-2 items-center">
            <Button variant="outline" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Link href={`/org/${orgId}/units`}>
              <Button>
                <FolderTree className="h-4 w-4 mr-2" />
                Manage Units
              </Button>
            </Link>
            <Link href={`/org/${orgId}/members?invite=1`}>
              <Button variant="secondary">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite
              </Button>
            </Link>
            <Link href={`/org/${orgId}/settings/branding`}>
              <Button variant="ghost">
                <Palette className="h-4 w-4 mr-2" />
                Branding
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
