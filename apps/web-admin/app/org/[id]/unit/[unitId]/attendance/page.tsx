'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'next/navigation';
import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@workspace/ui/components/card';
import { PlusCircle } from 'lucide-react';

import type { AppDispatch, RootState } from '@/store/store';
import {
  fetchAttendanceSessions,
  fetchAttendanceSummary,
  selectAttendanceSessions,
  selectAttendanceSummary,
  createAttendanceSession,
} from '@workspace/state';
import { AttendanceList } from './_components/attendance-list';
import { AttendanceSummary } from './_components/attendance-summary';
import { AttendanceCreateDialog } from './_components/attendance-create-dialog';

export default function OrgUnitAttendancePage() {
  const { id : orgId, unitId } = useParams<{ id: string; unitId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const sessions = useSelector((s: RootState) =>
    selectAttendanceSessions(s, unitId)
  );
  const summary = useSelector((s: RootState) =>
    selectAttendanceSummary(s, orgId)
  );
  const status = useSelector((s: RootState) => s.orgUnitAttendance.status);

  // modal state
  const [open, setOpen] = React.useState(false);

  useEffect(() => {
    if (!orgId || !unitId) return;
    dispatch(fetchAttendanceSessions({ orgId, unitId }));
    dispatch(fetchAttendanceSummary({ orgId }));
  }, [orgId, unitId, dispatch]);

  return (
    <div className="space-y-6 p-6 container mx-auto w-full">
      {/* ───────────── Summary ───────────── */}
      <AttendanceSummary summary={summary} status={status} />

      {/* ───────────── Header ───────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Attendance Sessions</h1>
        <Button
          onClick={() => setOpen(true)}
          size="sm"
          className="flex items-center gap-1"
        >
          <PlusCircle className="size-4" />
          Create Session
        </Button>
      </div>

      {/* ───────────── List ───────────── */}
      <Card className="crayon-card">
        <CardContent>
          <AttendanceList sessions={sessions} loading={status === 'loading'} />
        </CardContent>
      </Card>

      {/* ───────────── Create Dialog ───────────── */}
      <AttendanceCreateDialog
        open={open}
        onOpenChange={setOpen}
        onCreate={(body) => {
          dispatch(createAttendanceSession({ orgId, unitId, body }));
          setOpen(false);
        }}
      />
    </div>
  );
}
