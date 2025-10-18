'use client';

import { AppDispatch } from '@/store/store';
import React, { use, useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useEditOrgModal } from './use-org-atom';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
} from '@workspace/ui/components/modal';
import { Textarea } from '@workspace/ui/components/textarea';
import z, { string } from 'zod';
import { fetchOrgs, Org, updateOrg } from '@workspace/state';
import { Input } from '@workspace/ui/components/input';
import { toast } from 'sonner';
import { cn } from '@workspace/ui/lib/utils';
import { ImageIcon, Upload } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { Label } from '@workspace/ui/components/label';
import CountrySelect from '@/_components/country-select';
import TimezoneSelect from '@/_components/timezone-select';
import { Separator } from '@workspace/ui/components/separator';
import PhoneField from '@/_components/phone-field';

const Schema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  description: z.string().max(1000, 'Max 1000 characters').optional(),
  teamSize: z
    .union([z.string().regex(/^(\d+|\d+\+|\d+-\d+)$/), z.literal('')])
    .optional(),
  country: z
    .union([
      z
        .string()
        .length(2)
        .transform((s) => s.toUpperCase()),
      z.literal(''),
    ])
    .optional(),
  timezone: z
    .union([z.string().min(1, 'Timezone is required'), z.literal('')])
    .optional(),
  contactPhone: z.union([z.string().min(1), z.literal('')]).optional(),
  logoUrl: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  coverUrl: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  brand_color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/, 'Use hex like #1E90FF')
    .optional()
    .or(z.literal('')),
  address: z.string().optional(),
});

type Values = z.infer<typeof Schema>;

type AddressParts = {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

function makeAddressString(parts: AddressParts): string {
  const segs = [
    parts.line1,
    parts.line2,
    [parts.city, parts.state].filter(Boolean).join(', '),
    parts.country,
  ].filter(Boolean);
  return segs.join('\n');
}
function parseAddressString(s?: string): AddressParts {
  const lines = (s || '')
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);
  const [
    line1 = '',
    line2 = '',
    cityState = '',
    postalCode = '',
    country = '',
  ] = lines;
  let city = '',
    state = '';
  if (cityState.includes(',')) {
    const [c, st] = cityState.split(',').map((x) => x.trim());
    city = c || '';
    state = st || '';
  } else {
    city = cityState || '';
  }
  return { line1, line2, city, state, postalCode, country };
}

function getDefaults(org: Org | null): Values {
  return {
    name: org?.name ?? '',
    description: org?.description ?? '',
    teamSize: String(org?.teamSize) ?? '',
    country: String(org?.country) ?? '',
    timezone: String(org?.timezone) ?? '',
    logoUrl: String(org?.logoUrl) ?? '',
    coverUrl: String(org?.coverUrl) ?? '',
    brand_color: String(org?.brand_color) ?? '',
    address: String(org?.address) ?? '',
    contactPhone: String(org?.contactPhone) ?? '',
  };
}

function BrandingHeader({
  coverUrl,
  logoUrl,
  brandColor,
  onCoverChange,
  onLogoChange,
  onBrandColorChange,
}: {
  coverUrl?: string;
  logoUrl?: string;
  brandColor?: string;
  onCoverChange: (url: string) => void;
  onLogoChange: (url: string) => void;
  onBrandColorChange: (hex: string) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const pickFile = useCallback(
    async (target: HTMLInputElement | null, cb: (url: string) => void) => {
      if (!target || !target.files || target.files.length === 0) return;
      const file = target.files[0];
      if (!file.type.match(/^image\/(png|jpe?g|webp|svg\+xml)$/)) {
        toast.error(`Unsupported file type: ${file.type}`);
        target.value = '';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Max size 5MB');
        target.value = '';
        return;
      }
      const demoUrl = URL.createObjectURL(file); // replace with real upload later
      cb(demoUrl);
      toast.success(`${file.name} selected`);
      target.value = '';
    },
    []
  );

  const onCoverDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dt = e.dataTransfer;
    if (!dt.files || dt.files.length === 0) return;
    const f = dt.files[0];
    if (!f.type.startsWith('image/')) {
      toast.error('Please drop an image');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error('Max size 5MB');
      return;
    }
    const demoUrl = URL.createObjectURL(f);
    onCoverChange(demoUrl);
    toast.success(`${f.name} selected`);
  };

  return (
    <div className="rounded-xl border border-border/60 overflow-hidden elev-1">
      {/* Cover area */}
      <div
        className={cn(
          'relative h-48 sm:h-56 md:h-64 w-full bg-muted/60 group',
          dragOver && 'ring-2 ring-primary/40'
        )}
        style={{
          backgroundImage: coverUrl ? `url(${coverUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onCoverDrop}
      >
        {!coverUrl && (
          <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="flex items-center gap-2 rounded-md border border-dashed border-border/70 bg-background/70 px-3 py-2 hover:bg-background/90 transition-colors"
            >
              <Upload className="h-4 w-4" />
              <span>Click or drag image to add a cover</span>
            </button>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/40 to-transparent">
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => coverInputRef.current?.click()}
              className="backdrop-blur bg-white/80 dark:bg-black/30"
            >
              Change cover
            </Button>
          </div>
        </div>

        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => pickFile(e.target, onCoverChange)}
        />

        {/* Logo chip */}
        <div className="absolute -bottom-8 left-5 h-20 w-20 sm:h-24 sm:w-24 rounded-xl border border-border/60 overflow-hidden bg-background shadow-lg grid place-items-center">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <ImageIcon className="h-4 w-4" /> Logo
            </div>
          )}

          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            className="absolute inset-0 bg-black/0 hover:bg-black/25 transition-colors"
            aria-label="Change logo"
            title="Change logo"
          />

          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pickFile(e.target, onLogoChange)}
          />
        </div>
      </div>

      {/* Toolbar under the header */}
      <div className="pt-10 px-4 sm:px-6 pb-4 flex items-center justify-between gap-3 bg-card/60">
        <div className="text-sm text-muted-foreground">Branding</div>
        <div className="flex items-center gap-3">
          <Input
            type="color"
            value={brandColor || '#78489d'}
            onChange={(e) => onBrandColorChange(e.target.value)}
            className="h-9 w-10 p-1 cursor-pointer rounded-md"
            aria-label="Brand color"
          />
          <Input
            placeholder="#78489d"
            value={brandColor || ''}
            onChange={(e) => onBrandColorChange(e.target.value)}
            className="h-9 w-28"
            inputMode="text"
          />
        </div>
      </div>
    </div>
  );
}

const EditOrgModal = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [state, setState] = useEditOrgModal();
  const { open, org } = state;

  const [values, setValues] = useState<Values>(getDefaults(org));
  const [addr, setAddr] = useState<AddressParts>(
    parseAddressString(values.address)
  );
  const [errors, setErrors] = useState<
    Partial<
      Record<
        keyof Values | 'address.block' | 'contactPhone.formatted',
        string | undefined
      >
    >
  >({});
  const [loading, setLoading] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const v = getDefaults(org);
    setValues(v);
    setAddr(parseAddressString(v.address));
    setErrors({});
    setDirty(false);
  }, [org, open]);

  const validateField = useCallback(
    <K extends keyof Values>(key: K, next: Values) => {
      const fieldSchema = (Schema.shape as any)[key] as z.ZodTypeAny;
      const result = fieldSchema.safeParse(next[key]);
      setErrors((e) => ({
        ...e,
        [key]: result.success ? undefined : result.error.issues[0]?.message,
      }));
    },
    []
  );

  async function onSave() {
    if (!org) return;
    const address = makeAddressString({
      ...addr,
      country: values.country || addr.country,
    });
    if (values.contactPhone && !isValidPhoneNumber(values.contactPhone)) {
      setErrors((r) => ({ ...r, contactPhone: 'Phone number is invalid' }));
      toast.error('Phone number is invalid. Please correct it');
      return;
    }

    const cleaned: Values = {
      ...values,
      country: values.country?.trim()
        ? values.country.trim().toUpperCase()
        : undefined,
      timezone: values.timezone?.trim() ? values.timezone?.trim() : undefined,
      logoUrl: values.logoUrl?.trim() || undefined,
      coverUrl: values.coverUrl?.trim() || undefined,
      brand_color: values.brand_color?.trim() || undefined,
      address: address?.trim() || undefined,
      contactPhone: values?.contactPhone?.trim() || undefined,
      description: values?.description?.trim() || undefined,
      teamSize: values.teamSize?.trim() || undefined,
      name: values.name?.trim() || '',
    };

    const parsed = Schema.safeParse(cleaned);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      if (issue?.path?.[0]) {
        setErrors((e) => ({
          ...e,
          [issue.path[0] as keyof Values]: issue.message,
        }));
      }
      toast.error(issue?.message ?? 'Invalid input');
      return;
    }

    setLoading(true);

    try {
      const minimalPayload = {
        id: org.id,
        name: cleaned.name,
        teamSize: cleaned.teamSize ?? null,
        description: cleaned.description ?? null,
      } as const;

      await dispatch(updateOrg(minimalPayload)).unwrap();
      dispatch(fetchOrgs());
      toast.success('Organisation updated');

      setDirty(false);
      handleClose();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update');
    } finally {
      setLoading(false);
    }
  }

  const popoverContainerRef = useRef<HTMLDivElement | null>(null);

  const set = <K extends keyof Values>(key: K, v: Values[K]) => {
    setValues((prev) => {
      const next = { ...prev, [key]: v };
      validateField(key, next);
      return next;
    });
    setDirty(true);
  };

  const handleClose = useCallback(() => {
    setState({ open: false, org: null });
  }, [setState]);

  return (
    <Modal open={open} onOpenChange={handleClose}>
      <ModalContent size="full" blur separators stickyFooter>
        <ModalHeader className="space-y-1.5">
          <ModalTitle className="text-xl">Edit organisation</ModalTitle>
          <ModalDescription>
            Update general, contact, and branding details.
          </ModalDescription>
        </ModalHeader>

        <ModalBody>
          <div ref={popoverContainerRef} className="contents">
            <section className="space-y-4">
              <BrandingHeader
                coverUrl={values.coverUrl}
                logoUrl={values.logoUrl}
                brandColor={values.brand_color}
                onCoverChange={(url) => {
                  set('coverUrl', url);
                }}
                onLogoChange={(url) => {
                  set('logoUrl', url);
                }}
                onBrandColorChange={(hex) => {
                  set('brand_color', hex);
                }}
              />
              <Label className="text-sm font-medium text-muted-foreground">
                General
              </Label>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="org-name">Organisation Name</Label>
                    <Input
                      id="org-name"
                      value={values.name}
                      onChange={(e) => set('name', e.target.value)}
                      onBlur={() => validateField('name', values)}
                      autoFocus
                      aria-invalid={!!errors.name}
                      aria-describedby={
                        errors.name ? 'org-name-err' : undefined
                      }
                      className={cn(
                        'h-11',
                        errors.name &&
                          'ring-2 ring-destructive/20 border-destructive'
                      )}
                    />
                    <Label variant="error">{errors.name}</Label>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="org-teamsize">Team size</Label>
                    <Input
                      id="org-teamsize"
                      value={values.teamSize ?? ''}
                      onChange={(e) => set('teamSize', e.target.value)}
                      placeholder="e.g. 1–10, 50+, or 37"
                      className="h-11"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <CountrySelect
                      value={values.country}
                      onChange={(c) => {
                        set('country', c);
                        setAddr((a) => ({ ...a, country: c }));
                      }}
                      portalContainer={popoverContainerRef.current}
                      error={errors.country}
                    />
                    <TimezoneSelect
                      value={values.timezone}
                      onChange={(tz) => set('timezone', tz)}
                      portalContainer={popoverContainerRef.current}
                      error={errors.timezone}
                    />
                  </div>
                </div>{' '}
                <div className="space-y-1.5">
                  <Label htmlFor="org-desc">Description</Label>
                  <Textarea
                    id="org-desc"
                    rows={10}
                    placeholder="Brief overview or mission of your organisation…"
                    value={values.description ?? ''}
                    onChange={(e) => {
                      set('description', e.target.value);
                      if (e.target.value.length <= 1000) {
                        setErrors((er) => ({ ...er, description: undefined }));
                      } else {
                        setErrors((er) => ({
                          ...er,
                          description: 'Max 1000 characters',
                        }));
                      }
                    }}
                    aria-invalid={!!errors.description}
                    aria-describedby={
                      errors.description
                        ? 'org-desc-err org-desc-help'
                        : 'org-desc-help'
                    }
                  />
                  <div className="flex items-center justify-between">
                    <Label variant="error">{errors.description}</Label>
                    <Label variant="info">
                      {values.description?.length ?? 0}/1000
                    </Label>
                  </div>
                </div>
              </div>
            </section>

            <Separator className="my-8" />

            <section className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Contact & Address
              </h3>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <PhoneField
                  value={values.contactPhone}
                  onChange={(v) => set('contactPhone', v || '')}
                  error={errors.contactPhone}
                />

                <div className="space-y-2">
                  <Label>Address</Label>
                  <div className="grid grid-cols-1 gap-3">
                    <Input
                      placeholder="Address line 1"
                      value={addr.line1}
                      onChange={(e) => {
                        setAddr((a) => ({ ...a, line1: e.target.value }));
                        setDirty(true);
                      }}
                      className="h-11"
                    />
                    <Input
                      placeholder="Address line 2"
                      value={addr.line2}
                      onChange={(e) => {
                        setAddr((a) => ({ ...a, line2: e.target.value }));
                        setDirty(true);
                      }}
                      className="h-11"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input
                        placeholder="City"
                        value={addr.city}
                        onChange={(e) => {
                          setAddr((a) => ({ ...a, city: e.target.value }));
                          setDirty(true);
                        }}
                        className="h-11"
                      />
                      <Input
                        placeholder="State / Province"
                        value={addr.state}
                        onChange={(e) => {
                          setAddr((a) => ({ ...a, state: e.target.value }));
                          setDirty(true);
                        }}
                        className="h-11"
                      />
                      <Input
                        placeholder="Postal code"
                        inputMode="text"
                        value={addr.postalCode}
                        onChange={(e) =>
                          setAddr((a) => ({
                            ...a,
                            postalCode: e.target.value.replace(
                              /[^\dA-Za-z-\s]/g,
                              ''
                            ),
                          }))
                        }
                        className="h-11"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default EditOrgModal;
