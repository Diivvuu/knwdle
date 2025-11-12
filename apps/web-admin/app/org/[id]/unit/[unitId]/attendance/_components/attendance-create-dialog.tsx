'use client';
import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@workspace/ui/components/dialog';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';

export function AttendanceCreateDialog({ open, onOpenChange, onCreate }: any) {
  const [topic, setTopic] = React.useState('');
  const [date, setDate] = React.useState(() => new Date().toISOString().split('T')[0]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Attendance Session</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input placeholder="Topic / Description" value={topic} onChange={(e) => setTopic(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onCreate({ date, topic });
            }}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}