'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { AppDispatch, RootState } from '@/store/store';
import {
  fetchStudentAttendanceHistory,
  selectAttendanceHistory,
  selectAttendanceHistoryStatus,
} from '@workspace/state';
import { Label } from '@workspace/ui/components/label';
import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
import { Input } from '@workspace/ui/components/input';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function StudentAttendanceHistoryPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const params = useSearchParams();
  const { id: orgId = '', studentId = '' } =
    useParams<{ id: string; studentId: string }>() ?? {};

  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';

  const records = useSelector(selectAttendanceHistory);
  const loading = useSelector(selectAttendanceHistoryStatus) === 'loading';

  useEffect(() => {
    if (!orgId || !studentId) return;
    dispatch(
      fetchStudentAttendanceHistory({
        orgId,
        studentId,
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
      })
    );
  }, [dispatch, orgId, studentId, from, to]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <Label className="text-2xl font-semibold tracking-tight">
            Attendance History
          </Label>
          <p className="text-sm text-muted-foreground">
            Student-level attendance across audiences.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label>From</Label>
            <Input
              type="date"
              defaultValue={from}
              onChange={(e) => {
                const sp = new URLSearchParams(params.toString());
                if (e.target.value) sp.set('from', e.target.value);
                else sp.delete('from');
                router.replace(`?${sp.toString()}`, { scroll: false });
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>To</Label>
            <Input
              type="date"
              defaultValue={to}
              onChange={(e) => {
                const sp = new URLSearchParams(params.toString());
                if (e.target.value) sp.set('to', e.target.value);
                else sp.delete('to');
                router.replace(`?${sp.toString()}`, { scroll: false });
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Records</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : records.length === 0 ? (
            <p className="text-sm text-muted-foreground">No history found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        {r.session?.date
                          ? new Date(r.session.date).toDateString()
                          : '—'}
                      </TableCell>
                      <TableCell>{r.session?.audience?.name || '—'}</TableCell>
                      <TableCell className="capitalize">{r.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
