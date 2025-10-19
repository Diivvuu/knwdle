

import { Label } from '@workspace/ui/components/label';
import ScrollCombo from './scrollable-combobox';
import { useEffect, useId, useMemo, useRef } from 'react';

// Curated, common timezones only (simpler & faster to search)
const COMMON_TZS: Array<{ tz: string; name: string; aliases?: string[] }> = [
  { tz: 'UTC', name: 'UTC' },
  { tz: 'Europe/London', name: 'UK (London, GMT/BST)', aliases: ['UK', 'London', 'GMT', 'BST'] },
  { tz: 'Europe/Berlin', name: 'Central Europe (Berlin, CET/CEST)', aliases: ['CET', 'CEST', 'Berlin', 'Paris', 'Central Europe'] },
  { tz: 'Europe/Moscow', name: 'Moscow (MSK)', aliases: ['MSK', 'Moscow'] },
  { tz: 'Africa/Lagos', name: 'West Africa (WAT, Lagos)', aliases: ['WAT', 'Lagos', 'West Africa'] },
  { tz: 'Africa/Johannesburg', name: 'South Africa (SAST, Johannesburg)', aliases: ['SAST', 'Johannesburg', 'South Africa'] },
  { tz: 'Asia/Dubai', name: 'Gulf (GST, Dubai)', aliases: ['GST', 'Dubai', 'Gulf'] },
  { tz: 'Asia/Kolkata', name: 'India (IST, Kolkata)', aliases: ['IST', 'India', 'Kolkata'] },
  { tz: 'Asia/Jakarta', name: 'Indonesia (WIB, Jakarta)', aliases: ['WIB', 'Jakarta', 'Indonesia'] },
  { tz: 'Asia/Shanghai', name: 'China (CST, Shanghai)', aliases: ['CST', 'Shanghai', 'China'] },
  { tz: 'Asia/Singapore', name: 'Singapore (SGT)', aliases: ['SGT', 'Singapore'] },
  { tz: 'Asia/Seoul', name: 'Korea (KST, Seoul)', aliases: ['KST', 'Seoul', 'Korea'] },
  { tz: 'Asia/Tokyo', name: 'Japan (JST, Tokyo)', aliases: ['JST', 'Tokyo', 'Japan'] },
  { tz: 'Australia/Sydney', name: 'Australia (AEST/AEDT, Sydney)', aliases: ['AEST', 'AEDT', 'Sydney', 'Australia'] },
  { tz: 'America/Sao_Paulo', name: 'Brazil (BRT, São Paulo)', aliases: ['BRT', 'Sao Paulo', 'São Paulo', 'Brazil'] },
  { tz: 'America/New_York', name: 'US Eastern (ET, New York)', aliases: ['ET', 'EST', 'EDT', 'New York', 'Eastern'] },
  { tz: 'America/Chicago', name: 'US Central (CT, Chicago)', aliases: ['CT', 'CST', 'CDT', 'Chicago', 'Central'] },
  { tz: 'America/Denver', name: 'US Mountain (MT, Denver)', aliases: ['MT', 'MST', 'MDT', 'Denver', 'Mountain'] },
  { tz: 'America/Los_Angeles', name: 'US Pacific (PT, Los Angeles)', aliases: ['PT', 'PST', 'PDT', 'Los Angeles', 'Pacific', 'LA'] },
];

// Try to show "UTC±hh:mm" in label, fallback cleanly if not supported
function formatOffset(tz: string): string {
  try {
    const dtf = new Intl.DateTimeFormat(undefined, {
      timeZone: tz,
      timeZoneName: 'shortOffset',
    });
    const parts = dtf.formatToParts(new Date());
    const off = parts.find((p) => p.type === 'timeZoneName')?.value || '';
    return off.replace('GMT', 'UTC');
  } catch {
    return 'UTC';
  }
}

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

  // If no portalContainer is provided by the modal, fall back to body.
  const fallbackPortalRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    fallbackPortalRef.current =
      portalContainer ?? (typeof document !== 'undefined' ? document.body : null);
  }, [portalContainer]);

  const TIMEZONE_OPTIONS = useMemo(
    () =>
      COMMON_TZS.map(({ tz, name, aliases }) => {
        const offset = formatOffset(tz);
        const hint = aliases && aliases.length ? ` · ${aliases.join(', ')}` : '';
        return {
          value: tz,
          label: `${name} — ${tz} (${offset})${hint}`,
        };
      }),
    []
  );

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>Timezone</Label>
      <ScrollCombo
        value={value}
        onChange={onChange}
        placeholder="Select timezone (common)"
        options={TIMEZONE_OPTIONS}
        portalContainer={fallbackPortalRef.current ?? undefined}
        aria-describedby={error ? `${id}-err` : undefined}
        invalid={!!error}
      />
      <Label id={`${id}-err`} variant="error">
        {error}
      </Label>
    </div>
  );
}
