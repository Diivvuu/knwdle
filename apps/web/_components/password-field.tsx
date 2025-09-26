'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Button } from '@workspace/ui/components/button';
import StrengthMeter from './strength-meter';

type Props = {
  label: string;
  id?: string;
  autoComplete?: string;
  error?: string;
  register: ReturnType<any>; // react-hook-form register('password')
  withStrength?: boolean;
};

export default function PasswordField({
  label,
  id,
  autoComplete = 'current-password',
  error,
  register,
  withStrength,
}: Props) {
  const rid = useId();
  const [type, setType] = useState<'password' | 'text'>('password');
  const [caps, setCaps] = useState(false);
  const [value, setValue] = useState('');
  const holdRef = useRef<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.getModifierState && e.getModifierState('CapsLock')) setCaps(true);
      else setCaps(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
    };
  }, []);

  const startPeek = () => {
    setType('text');
    if (holdRef.current) window.clearTimeout(holdRef.current);
  };
  const endPeek = () => {
    holdRef.current = window.setTimeout(() => setType('password'), 120);
  };

  return (
    <div className="grid gap-2">
      <Label htmlFor={id ?? rid}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={id ?? rid}
          type={type}
          autoComplete={autoComplete}
          {...register}
          onChange={(e: any) => {
            setValue(e.target.value);
            register.onChange?.(e);
          }}
        />
        <Button
          type="button"
          variant="outline"
          onMouseDown={startPeek}
          onMouseUp={endPeek}
          onMouseLeave={endPeek}
          aria-label={
            type === 'password'
              ? 'Hold to show password'
              : 'Release to hide password'
          }
        >
          {type === 'password' ? 'Peek' : 'Hide'}
        </Button>
      </div>
      {caps && <p className="text-xs text-amber-600">Caps Lock is on</p>}
      {withStrength && <StrengthMeter value={value} />}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
