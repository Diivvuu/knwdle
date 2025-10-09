'use client';
import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Skeleton } from '@workspace/ui/components/skeleton';
import {
  FolderTree,
  ShieldCheck,
  UsersRound,
  GraduationCap,
  Users2,
} from 'lucide-react';
import type { OrgSummary } from '@workspace/state';

export default function KpiDeck({
  summary,
}: {
  summary?: { status: string; data?: OrgSummary };
}) {
  const isLoading = summary?.status === 'loading';
  const sum = summary?.data;
  const roleCounts = useMemo(() => {
    const rc = sum?.roleCounts || { admin: 0, staff: 0, student: 0, parent: 0 };
    return [
      { title: 'Units', value: sum?.unitsCount ?? 0, icon: FolderTree },
      { title: 'Admins', value: rc.admin, icon: ShieldCheck },
      { title: 'Staff', value: rc.staff, icon: UsersRound },
      { title: 'Students', value: rc.student, icon: GraduationCap },
      { title: 'Parents', value: rc.parent, icon: Users2 },
    ];
  }, [sum]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {roleCounts.map((k) => (
        <Card key={k.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{k.title}</CardTitle>
            <k.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{k.value}</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
