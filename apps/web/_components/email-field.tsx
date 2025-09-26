'use client';

import { useId, useMemo, useState } from 'react';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';

const DISPOSABLE = [
  'mailinator.com',
  '10minutemail.com',
  'yopmail.com',
  'guerrillamail.com',
];

type Props = {
  label: string;
  id?: string;
  autoComplete?: string;
  placeholder?: string;
  error?: string;
  register: ReturnType<any>; // react-hook-form register('email')
};

export default function EmailField({
  label,
  id,
  autoComplete = 'email',
  placeholder = 'you@example.com',
  error,
  register,
}: Props) {
  const rid = useId();
  const [val, setVal] = useState('');
  const domain = useMemo(() => val.split('@')[1]?.toLowerCase() || '', [val]);
  const disposable = domain && DISPOSABLE.includes(domain);

  return (
    <div className="grid gap-2">
      <Label htmlFor={id ?? rid}>{label}</Label>
      <Input
        id={id ?? rid}
        type="email"
        placeholder={placeholder}
        autoComplete={autoComplete}
        {...register}
        onChange={(e: any) => {
          setVal(e.target.value);
          register.onChange?.(e);
        }}
      />
      {disposable && (
        <p className="text-xs text-amber-600">
          This email provider is often disposable. Consider using a permanent
          email.
        </p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
