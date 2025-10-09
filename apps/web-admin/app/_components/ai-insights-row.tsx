'use client';
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';

export default function AiInsightsRow({ orgId }: { orgId: string }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {[0, 1, 2].map((i) => (
        <Card key={i}>
          <CardHeader>
            <CardTitle>Insight</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Wiring placeholder — add GET /orgs/:id/insights.
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
