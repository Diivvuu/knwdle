'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useRouter } from 'next/navigation';
import { AppDispatch, RootState } from '@/store/store';
import {
  fetchAttendanceSession,
  updateAttendanceNotes,
  updateAttendanceRecord,
  selectAttendanceSession,
} from '@workspace/state';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Label } from '@workspace/ui/components/label';
import { Textarea } from '@workspace/ui/components/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
import { Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function AttendanceSessionDetailPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { id: orgId = '', audienceId = '', sessionId = '' } =
    useParams<{
      id: string;
      audienceId: string;
      sessionId: string;
    }>() ?? {};

  const session = useSelector(selectAttendanceSession);
  const sessionStatus = useSelector(
    (s: RootState) => s.attendance.sessionStatus
  );

  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!orgId || !audienceId || !sessionId) return;
    dispatch(
      fetchAttendanceSession({
        orgId,
        audienceId,
        sessionId,
        includeRecords: true,
      })
    ).catch(() => toast.error('Failed to load session'));
  }, [dispatch, orgId, audienceId, sessionId]);

  useEffect(() => {
    if (session) setNotes(session.notes || '');
  }, [session]);

  const handleUpdateNotes = async () => {
    if (!session) return;
    try {
      await dispatch(
        updateAttendanceNotes({
          orgId,
          audienceId,
          sessionId: session.id,
          notes,
        })
      ).unwrap();
      toast.success('Notes updated');
      setEditingNotes(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update notes');
    }
  };

  const toggleStatus = async (
    studentId: string,
    status: 'present' | 'absent'
  ) => {
    try {
      await dispatch(
        updateAttendanceRecord({
          orgId,
          audienceId,
          sessionId,
          studentId,
          status,
        })
      ).unwrap();
      toast.success('Attendance updated');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update record');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <Label className="text-2xl font-semibold tracking-tight">
            Attendance — {session?.date ? new Date(session.date).toDateString() : ''}
            {session?.period ? ` (${session.period})` : ''}
          </Label>
          <p className="text-sm text-muted-foreground">
            Taken by: {session?.takenById || '—'}
          </p>
        </div>
      </div>

      {sessionStatus === 'loading' && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading session...
        </div>
      )}

      {session && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Session Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {editingNotes ? (
                <>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleUpdateNotes}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setNotes(session.notes || '');
                        setEditingNotes(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-start justify-between">
                  <p className="text-sm text-muted-foreground">
                    {session.notes || 'No notes added.'}
                  </p>
                  <Button size="sm" variant="outline" onClick={() => setEditingNotes(true)}>
                    Edit Notes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Student Records</CardTitle>
            </CardHeader>
            <CardContent>
              {session.records && session.records.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {session.records.map((r: any) => (
                        <TableRow key={r.studentId}>
                          <TableCell>{r.student?.name || r.studentId}</TableCell>
                          <TableCell className="capitalize">{r.status}</TableCell>
                          <TableCell>
                            {r.status === 'present' ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleStatus(r.studentId, 'absent')}
                              >
                                Mark Absent
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleStatus(r.studentId, 'present')}
                              >
                                Mark Present
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No records yet. Take attendance to create records.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
