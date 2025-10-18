import { Label } from '@workspace/ui/components/label';
import ScrollCombo from './scrollable-combobox';
import { useId } from 'react';

const ALL_TZ: string[] =
  typeof Intl !== 'undefined' && (Intl as any).supportedValuesOf
    ? (Intl as any).supportedValuesOf('timeZone')
    : ['UTC', 'Asia/Kolkata', 'Europe/London', 'America/New_York'];
const TIMEZONE_OPTIONS = ALL_TZ.map((tz) => ({ value: tz, label: tz }));

export default function TimezoneSelect({
  value,
  onChange,
  portalContainer,
  error,
}: {
  value?: string;
  onChange: (v: string) => void;
  portalContainer?: HTMLElement | null;
  error?: string;
}) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>Timezone</Label>
      <ScrollCombo
        value={value}
        onChange={onChange}
        placeholder="Select timezone"
        options={TIMEZONE_OPTIONS}
        portalContainer={portalContainer}
        aria-describedby={error ? `${id}-err` : undefined}
        invalid={!!error}
      />
      <Label variant="error">{error}</Label>
    </div>
  );
}
