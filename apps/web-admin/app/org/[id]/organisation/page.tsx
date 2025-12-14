'use client';

import { Label } from '@workspace/ui/components/label';
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from '@workspace/ui/components/alert';

export default function OrganisationPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="space-y-2">
        <Label className="text-2xl font-semibold tracking-tight">
          Organisation Audiences
        </Label>
        <p className="text-sm text-muted-foreground">
          Org audience APIs have been removed. This section is now read-only.
        </p>
      </div>

      <div className="mt-6">
        <Alert>
          <AlertTitle>Not available</AlertTitle>
          <AlertDescription>
            Organisation audiences have been replaced by the new audiences
            model. No audience data is loaded here anymore.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
