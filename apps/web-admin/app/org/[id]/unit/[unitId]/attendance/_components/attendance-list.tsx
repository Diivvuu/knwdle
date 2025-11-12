'use client';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@workspace/ui/components/table';

import Link from 'next/link';

export function AttendanceList({ sessions, loading }: { sessions: any[]; loading?: boolean }) {
  if (loading)
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((k) => (
          <Skeleton key={k} className="h-10 w-full rounded-md" />
        ))}
      </div>
    );

  if (!sessions?.length)
    return <div className="text-center text-muted-foreground/70 py-6">No attendance sessions found.</div>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Topic</TableHead>
          <TableHead>Present / Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sessions.map((s) => (
          <TableRow key={s.id}>
            <TableCell>
              <Link href={`./attendance/${s.id}`} className="text-primary hover:underline">
                {new Date(s.date).toLocaleDateString()}
              </Link>
            </TableCell>
            <TableCell>{s.topic || '—'}</TableCell>
            <TableCell>
              {s.presentCount ?? 0}/{s.totalCount ?? 0}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}