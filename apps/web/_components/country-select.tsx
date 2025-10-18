import { Label } from '@workspace/ui/components/label';
import { useId, useMemo } from 'react';
import ScrollCombo from './scrollable-combobox';
import { getCountries } from 'react-phone-number-input';

function flagEmoji(cc: string) {
  const cps = cc
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .split('')
    .map((c) => 127397 + c.charCodeAt(0));
  try {
    return String.fromCodePoint(...cps);
  } catch {
    return cc.toUpperCase();
  }
}

const COUNTRY_CODES = getCountries();

const RegionNames =
  typeof Intl !== 'undefined' && (Intl as any).DisplayNames
    ? new (Intl as any).DisplayNames(['en'], { type: 'region' })
    : null;

const countryLabel = (code: string) =>
  (RegionNames ? RegionNames.of(code) : code) ?? code;

export default function CountrySelect({
  value,
  onChange,
  label = 'Country',
  portalContainer,
  error,
}: {
  value?: string;
  onChange: (v: string) => void;
  label?: string;
  portalContainer?: HTMLElement | null;
  error?: string;
}) {
  const id = useId();
  const options = useMemo(
    () =>
      COUNTRY_CODES.map((c) => ({
        value: c,
        label: `${countryLabel(c)} (${c})`,
      })),
    []
  );
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <ScrollCombo
        value={value}
        onChange={onChange}
        placeholder="Select country"
        options={options}
        portalContainer={portalContainer}
        aria-describedby={error ? `${id}-err` : undefined}
        invalid={!!error}
        renderLabel={(o) => (
          <div className="flex items-center gap-2">
            <span className="text-lg leading-none">{flagEmoji(o.value)}</span>
            <span className="truncate">{o.label}</span>
          </div>
        )}
      />
      <Label variant="error">{error}</Label>
    </div>
  );
}
