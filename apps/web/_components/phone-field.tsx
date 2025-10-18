import { Label } from '@workspace/ui/components/label';
import { cn } from '@workspace/ui/lib/utils';
import { useEffect, useId, useState } from 'react';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { PhoneInput } from '@workspace/ui/components/phone-input';

export default function PhoneField({
  value,
  onChange,
  error,
}: {
  value?: string;
  onChange: (v?: string) => void;
  error?: string;
}) {
  const id = useId();
  const [hint, setHint] = useState('');

  useEffect(() => {
    if (!value) return setHint('');
    setHint(isValidPhoneNumber(value) ? 'Looks good' : 'Invalid number');
  }, [value]);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Contact phone</Label>

      <div
        className={cn(
          'flex rounded-lg border bg-background',
          error && 'border-destructive ring-2 ring-destructive/20'
        )}
      >
        <PhoneInput
          id={id}
          value={value}
          onChange={onChange}
          /* country selection is handled internally by the component */
          international
          countryCallingCodeEditable={false}
          className="w-full"
          numberInputProps={{
            className:
              'flex-1 h-11 bg-transparent outline-none text-base md:text-sm px-2',
            'aria-invalid': !!error,
            'aria-describedby': error ? `${id}-err` : undefined,
          }}
        />
      </div>

      <div className="min-h-4">
        {error ? (
          <p id={`${id}-err`} className="text-xs text-destructive">
            {error}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {value ? hint : 'Include country code if international.'}
          </p>
        )}
      </div>
    </div>
  );
}
