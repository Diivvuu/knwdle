'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useRouter } from 'next/navigation';
import { AppDispatch, RootState } from '@/store/store';
import {
  fetchAttendanceSessions,
  selectAttendanceSessions,
  selectAttendanceStatus,
} from '@workspace/state';
import { Button } from '@workspace/ui/components/button';
import { Label } from '@workspace/ui/components/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Input } from '@workspace/ui/components/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
import { Loader2, CheckCircle2, Clock3 } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';

export default function AudienceAttendancePage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { id: orgId = '', audienceId = '' } =
    useParams<{ id: string; audienceId: string }>() ?? {};

  const sessions = useSelector(selectAttendanceSessions);
  const loading = useSelector(selectAttendanceStatus) === 'loading';

  const [date, setDate] = useState('');
  const [cursor, setCursor] = useState<string | null>(null);

  const base = useMemo(
    () => `/org/${orgId}/audience/${audienceId}/attendance`,
    [orgId, audienceId]
  );

  const lastSig = useRef('');
  useEffect(() => {
    if (!orgId || !audienceId) return;
    const sig = JSON.stringify({ orgId, audienceId, date, cursor });
    if (lastSig.current === sig) return;
    lastSig.current = sig;

    dispatch(
      fetchAttendanceSessions({
        orgId,
        audienceId,
        ...(date ? { date } : {}),
        ...(cursor ? { cursor } : {}),
      })
    );
  }, [dispatch, orgId, audienceId, date, cursor]);

  const statusBadge = (recordsCount?: number) => {
    const done = (recordsCount ?? 0) > 0;
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
          done ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
        )}
      >
        {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
        {done ? 'Done' : 'Open'}
      </span>
    );
  };

  const handleRowClick = (s: any) => {
    const done = (s.recordsCount ?? 0) > 0;
    if (done) router.push(`${base}/sessions/${s.id}`);
    else router.push(`${base}/take?sessionId=${s.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Label className="text-2xl font-semibold tracking-tight">
            Attendance
          </Label>
          <p className="text-sm text-muted-foreground">
            Manage attendance sessions for this audience.
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <Input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setCursor(null);
            }}
            className="w-full md:w-auto"
          />
          <Button onClick={() => router.push(`${base}/take`)}>Take Attendance</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading sessions...
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sessions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Taken By</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((s) => {
                    const done = (s.recordsCount ?? 0) > 0;
                    return (
                      <TableRow
                        key={s.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleRowClick(s)}
                      >
                        <TableCell>{s.date ? new Date(s.date).toDateString() : '—'}</TableCell>
                        <TableCell>{s.period || '—'}</TableCell>
                        <TableCell>{s.takenById || '—'}</TableCell>
                        <TableCell>{statusBadge(s.recordsCount)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {/* Load more button to support cursor pagination later; currently cursor comes from slice if wired */}
        </CardContent>
      </Card>
    </div>
  );
}
