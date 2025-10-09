'use client';
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';

export default function AttendanceSnapshot({ orgId }: { orgId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          Wiring placeholder — add GET /orgs/:id/attendance/summary to populate.
        </div>
      </CardContent>
    </Card>
  );
}
