'use client';
import React from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { ArrowRight, Plus, FolderTree } from 'lucide-react';
import type { OrgUnit } from '@workspace/state';

export default function UnitsSnapshot({
  orgId,
  units,
}: {
  orgId: string;
  units?: { status: string; items: OrgUnit[] };
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Units Snapshot</CardTitle>
        <div className="flex gap-2">
          <Link href={`/org/${orgId}/units`}>
            <Button variant="outline" size="sm">
              View All <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          <Link href={`/org/${orgId}/units?create=1`}>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Unit
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {units?.status === 'loading' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : units?.items?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {units.items.slice(0, 6).map((u) => (
              <div
                key={u.id}
                className="rounded-2xl border p-3 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium leading-tight">{u.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {u.code || u.id}
                  </div>
                </div>
                <Link
                  href={`/org/${orgId}/units?selected=${u.id}`}
                  className="text-sm inline-flex items-center"
                >
                  Open <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-sm text-muted-foreground">
            No units yet. Create your first Campus / Department / Class.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
