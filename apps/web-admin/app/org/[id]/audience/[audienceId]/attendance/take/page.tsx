'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { AppDispatch, RootState } from '@/store/store';
import {
  fetchAudienceMembers,
  takeAttendance,
  fetchAttendanceSession,
  selectAttendanceSession,
} from '@workspace/state';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Label } from '@workspace/ui/components/label';
import { Textarea } from '@workspace/ui/components/textarea';
import { RadioGroup, RadioGroupItem } from '@workspace/ui/components/radio-group';
import { Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirmDialog } from '@/features/confirm/use-confirm-dialog';

type RecordDraft = {
  studentId: string;
  name: string;
  status: 'present' | 'absent';
};

export default function TakeAttendancePage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const params = useSearchParams();
  const { id: orgId = '', audienceId = '' } =
    useParams<{ id: string; audienceId: string }>() ?? {};
  const sessionId = params.get('sessionId') || null;
  const { confirm } = useConfirmDialog();

  const attendanceSession = useSelector(selectAttendanceSession);
  const members = useSelector((s: RootState) => s.audienceMembers.list);
  const membersStatus = useSelector(
    (s: RootState) => s.audienceMembers.status
  );

  const [date, setDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [period, setPeriod] = useState('');
  const [notes, setNotes] = useState('');
  const [records, setRecords] = useState<RecordDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const initialRef = useRef<{
    date: string;
    period: string;
    notes: string;
    records: RecordDraft[];
  } | null>(null);

  const base = useMemo(
    () => `/org/${orgId}/audience/${audienceId}/attendance`,
    [orgId, audienceId]
  );

  // load members (students)
  useEffect(() => {
    if (!orgId || !audienceId) return;
    dispatch(
      fetchAudienceMembers({ orgId, audienceId, limit: 200 })
    );
  }, [dispatch, orgId, audienceId]);

  // If editing existing session, load it
  useEffect(() => {
    if (!orgId || !audienceId || !sessionId) return;
    dispatch(
      fetchAttendanceSession({
        orgId,
        audienceId,
        sessionId,
        includeRecords: true,
      })
    );
  }, [dispatch, orgId, audienceId, sessionId]);

  // Seed form when members or session change
  useEffect(() => {
    if (!members.length) return;

    if (attendanceSession && sessionId) {
      setDate(attendanceSession.date?.slice(0, 10) || date);
      setPeriod(attendanceSession.period || '');
      setNotes(attendanceSession.notes || '');
      const existing = attendanceSession.records || [];
      const drafts: RecordDraft[] = members
        .filter((m: any) => m.role === 'student')
        .map((m: any) => {
        const match = existing.find((r: any) => r.studentId === m.userId);
        return {
          studentId: m.userId,
          name: m.user?.name || m.name || m.userId,
          status: match?.status ?? 'present',
        };
        });
      setRecords(drafts);
      initialRef.current = {
        date: attendanceSession.date?.slice(0, 10) || date,
        period: attendanceSession.period || '',
        notes: attendanceSession.notes || '',
        records: drafts,
      };
    } else {
      const drafts: RecordDraft[] = members
        .filter((m: any) => m.role === 'student')
        .map((m: any) => ({
          studentId: m.userId,
          name: m.user?.name || m.name || m.userId,
          status: 'present',
        }));
      setRecords(drafts);
      initialRef.current = {
        date,
        period: '',
        notes: '',
        records: drafts,
      };
    }
  }, [members, attendanceSession, sessionId]);

  const updateStatus = (studentId: string, status: 'present' | 'absent') => {
    setRecords((prev) =>
      prev.map((r) =>
        r.studentId === studentId ? { ...r, status } : r
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !audienceId) {
      toast.error('Missing audience context');
      return;
    }
    try {
      setSaving(true);
      await dispatch(
        takeAttendance({
          orgId,
          audienceId,
          body: {
            date,
            period: period || null,
            notes: notes || undefined,
            records: records.map((r) => ({
              studentId: r.studentId,
              status: r.status,
            })),
          },
        })
      ).unwrap();
      toast.success('Attendance saved');
      router.push(base);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const loadingMembers = membersStatus === 'loading';

  const markAll = (status: 'present' | 'absent') => {
    setRecords((prev) => prev.map((r) => ({ ...r, status })));
  };

  const hasChanges = useMemo(() => {
    const initial = initialRef.current;
    if (!initial) return false;
    if (initial.date !== date) return true;
    if (initial.period !== period) return true;
    if (initial.notes !== notes) return true;
    if (initial.records.length !== records.length) return true;
    for (let i = 0; i < records.length; i += 1) {
      if (records[i].status !== initial.records[i]?.status) return true;
    }
    return false;
  }, [date, period, notes, records]);

  const handleLeave = () => {
    if (!hasChanges || saving) {
      router.push(base);
      return;
    }
    confirm({
      title: 'Leave without saving?',
      description: 'Your changes will be lost.',
      confirmText: 'Leave',
      cancelText: 'Stay',
      onConfirm: () => router.push(base),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={handleLeave}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <Label className="text-2xl font-semibold tracking-tight">
            Take Attendance
          </Label>
          <p className="text-sm text-muted-foreground">
            Create or update attendance for this audience.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Period (optional)</Label>
                  <Input
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    placeholder="e.g. P1"
                  />
                </div>
              </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">Students</Label>
                {loadingMembers && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading students...
                  </div>
                )}
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => markAll('present')}
                  >
                    Mark all present
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => markAll('absent')}
                  >
                    Mark all absent
                  </Button>
                </div>
              </div>
              <div className="rounded-md border divide-y">
                {records.map((r) => (
                  <div
                    key={r.studentId}
                    className="flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <div className="font-medium">{r.name || r.studentId}</div>
                    <RadioGroup
                      value={r.status}
                      onValueChange={(v) =>
                        updateStatus(r.studentId, v as 'present' | 'absent')
                      }
                      className="flex items-center gap-4"
                    >
                      <label className="flex items-center gap-2 text-xs">
                        <RadioGroupItem value="present" />
                        Present
                      </label>
                      <label className="flex items-center gap-2 text-xs">
                        <RadioGroupItem value="absent" />
                        Absent
                      </label>
                    </RadioGroup>
                  </div>
                ))}
                {!records.length && (
                  <div className="px-3 py-4 text-sm text-muted-foreground">
                    No students found in this audience.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes for this session"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleLeave}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving || loadingMembers}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Attendance'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
