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

// Placeholder – backend endpoint not present in provided routes.
export default function AnnouncementsList({ orgId }: { orgId: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Announcements</CardTitle>
        <Link href={`/org/${orgId}/announcements/create`}>
          <Button size="sm">Create</Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          Wiring placeholder — add GET /orgs/:id/announcements to populate.
        </div>
      </CardContent>
    </Card>
  );
}
