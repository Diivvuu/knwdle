'use client';

import { Button } from '@workspace/ui/components/button';

export default function SSOButtons({
  onGoogle,
  onApple,
}: {
  onGoogle?: () => void;
  onApple?: () => void;
}) {
  return (
    <div className="grid gap-2">
      <Button type="button" variant="secondary" onClick={onGoogle}>
        Continue with Google
      </Button>
      <Button type="button" variant="secondary" onClick={onApple}>
        Continue with Apple
      </Button>
    </div>
  );
}
