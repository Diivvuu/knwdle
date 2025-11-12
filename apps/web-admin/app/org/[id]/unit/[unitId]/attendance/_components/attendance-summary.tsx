'use client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@workspace/ui/components/card';
import { Skeleton } from '@workspace/ui/components/skeleton';

export function AttendanceSummary({
  summary,
  status,
}: {
  summary: any;
  status?: string;
}) {
  if (status === 'loading')
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((k) => (
          <Skeleton key={k} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );

  if (!summary)
    return (
      <Card className="crayon-card">
        <CardHeader>
          <CardTitle>Attendance Summary</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          No summary data available
        </CardContent>
      </Card>
    );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {Object.entries(summary).map(([label, value]) => (
        <Card key={label} className="crayon-card text-center">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              {label}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {value ?? '—'}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
