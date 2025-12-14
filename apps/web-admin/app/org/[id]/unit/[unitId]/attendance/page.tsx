'use client';

import {
  Alert,
  AlertTitle,
  AlertDescription,
} from '@workspace/ui/components/alert';

export default function OrgAudienceAttendancePage() {
  return (
    <div className="space-y-6 p-6 container mx-auto w-full">
      <h1 className="text-xl font-semibold">Attendance</h1>
      <Alert>
        <AlertTitle>Not available</AlertTitle>
        <AlertDescription>
          Org audience attendance endpoints have been removed. This view is now
          disabled.
        </AlertDescription>
      </Alert>
    </div>
  );
}
