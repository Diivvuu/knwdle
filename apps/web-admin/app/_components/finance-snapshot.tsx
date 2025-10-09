'use client';
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';

export default function FinanceSnapshot({ orgId }: { orgId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fees & Billing</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          Wiring placeholder — add GET /orgs/:id/fees/summary to populate.
        </div>
      </CardContent>
    </Card>
  );
}
