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

export default function MembersRecent({
  orgId,
  members,
}: {
  orgId: string;
  members: { isLoading?: boolean; page: { items: any[] } };
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Members</CardTitle>
        <Link href={`/org/${orgId}/members`}>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {members.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : members.page.items.length ? (
          <ul className="divide-y">
            {members.page.items.map((m: any) => (
              <li key={m.id} className="py-2 flex items-center justify-between">
                <div>
                  <div className="font-medium leading-tight">
                    {m.name || m.email}
                  </div>
                  <div className="text-xs text-muted-foreground">{m.role}</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {m.unitName || '—'}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-muted-foreground">
            No recent members found.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
