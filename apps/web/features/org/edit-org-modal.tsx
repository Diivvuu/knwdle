'use client';

import { AppDispatch } from '@/store/store';
import React, { use, useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useEditOrgModal } from './use-org-atom';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
  ModalFooter,
} from '@workspace/ui/components/modal';
import {
  uploadImage,
  selectUpload,
  fetchOrgBasic,
  fetchOrgById,
} from '@workspace/state';
import { Textarea } from '@workspace/ui/components/textarea';
import { z } from 'zod';
import { nanoid } from '@reduxjs/toolkit';
import { fetchOrgs, Org, updateOrg } from '@workspace/state';
import { Input } from '@workspace/ui/components/input';
import { toast } from 'sonner';
import { cn } from '@workspace/ui/lib/utils';
import { ImageIcon, Upload } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import {
  isValidPhoneNumber,
  getCountries,
  type Country,
} from 'react-phone-number-input';
import { Label } from '@workspace/ui/components/label';
import CountrySelect from '@/_components/country-select';
import TimezoneSelect from '@/_components/timezone-select';
import { Separator } from '@workspace/ui/components/separator';
import PhoneField from '@/_components/phone-field';
import BrandingHeader from '@workspace/ui/components/app/branding-header';

// Country -> sensible default IANA timezone (must exist in COMMON_TZS)
const COUNTRY_DEFAULT_TZ: Record<string, string> = {
  IN: 'Asia/Kolkata',
  AE: 'Asia/Dubai',
  SA: 'Asia/Riyadh',
  SG: 'Asia/Singapore',
  MY: 'Asia/Singapore',
  ID: 'Asia/Jakarta',
  CN: 'Asia/Shanghai',
  JP: 'Asia/Tokyo',
  KR: 'Asia/Seoul',
  AU: 'Australia/Sydney',

  GB: 'Europe/London',
  IE: 'Europe/London',
  DE: 'Europe/Berlin',
  FR: 'Europe/Berlin',
  NL: 'Europe/Berlin',
  BE: 'Europe/Berlin',
  ES: 'Europe/Berlin',
  IT: 'Europe/Berlin',
  SE: 'Europe/Berlin',
  NO: 'Europe/Berlin',
  DK: 'Europe/Berlin',
  PL: 'Europe/Berlin',

  RU: 'Europe/Moscow',
  ZA: 'Africa/Johannesburg',
  NG: 'Africa/Lagos',
  BR: 'America/Sao_Paulo',

  US: 'America/New_York',
  CA: 'America/Toronto',
  MX: 'America/Mexico_City',

  AR: 'America/Sao_Paulo',
  CO: 'America/Bogota',
  CL: 'America/Santiago',
};

const COUNTRY_SET = new Set(getCountries());

function pickTimezoneForCountry(cc?: string): string | undefined {
  if (!cc) return undefined;
  return COUNTRY_DEFAULT_TZ[cc.toUpperCase()];
}

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
  logoUrl: z.string().optional().or(z.literal('')),
  coverUrl: z.string().optional().or(z.literal('')),
  brand_color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/, 'Use hex like #1E90FF')
    .optional()
    .or(z.literal('')),
  address: z.string().optional(),

  // New structured business address separate from org country
  business_address: z
    .object({
      line1: z.string().optional().or(z.literal('')),
      line2: z.string().optional().or(z.literal('')),
      city: z.string().optional().or(z.literal('')),
      state: z.string().optional().or(z.literal('')),
      postalCode: z.string().optional().or(z.literal('')),
      country: z.string().optional().or(z.literal('')),
    })
    .optional(),
});

type Values = z.infer<typeof Schema>;

type AddressParts = {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: Country | '';
};

function getInitialBusinessAddress(
  org: Org | null,
  fallbackAddrString?: string
): AddressParts {
  const fromObject =
    (org as any)?.business_address || (org as any)?.businessAddress;

  // Prefer structured object if present
  if (fromObject && typeof fromObject === 'object') {
    const o = fromObject as Partial<AddressParts>;
    return {
      line1: o.line1 || '',
      line2: o.line2 || '',
      city: o.city || '',
      state: o.state || '',
      postalCode: o.postalCode || '',
      country: (o.country as Country | undefined) || '',
    };
  }

  // If legacy address is a JSON string, parse and map
  if (
    typeof fallbackAddrString === 'string' &&
    fallbackAddrString.trim().startsWith('{')
  ) {
    try {
      const parsed = JSON.parse(fallbackAddrString) as Partial<AddressParts>;
      return {
        line1: parsed.line1 || '',
        line2: parsed.line2 || '',
        city: parsed.city || '',
        state: parsed.state || '',
        postalCode: parsed.postalCode || '',
        country: (parsed.country as Country | undefined) || '',
      };
    } catch {
      // fall through to string parser
    }
  }

  // Fallback: parse old newline-separated string
  return parseAddressString(fallbackAddrString);
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
    countryRaw = '',
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

  // Coerce to valid Country (ISO alpha-2) or empty string
  const cc = countryRaw.toUpperCase();
  const country: Country | '' = COUNTRY_SET.has(cc as Country)
    ? (cc as Country)
    : '';

  return { line1, line2, city, state, postalCode, country };
}

function getDefaults(org: Org | null): Values {
  const safe = (v: unknown) => {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  };
  return {
    name: safe(org?.name),
    description: safe(org?.description),
    teamSize: safe(org?.teamSize),
    country: safe(org?.country),
    timezone: safe(org?.timezone),
    logoUrl: safe((org as any)?.logoUrl ?? org?.logoUrl),
    coverUrl: safe((org as any)?.coverUrl ?? org?.coverUrl),
    brand_color: safe(org?.brand_color),
    address: safe(org?.address),
    contactPhone: safe(org?.contactPhone),
  };
}

const EditOrgModal = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [state, setState] = useEditOrgModal();
  const { open, org } = state;

  const [values, setValues] = useState<Values>(getDefaults(org));
  const [businessAddr, setBusinessAddr] = useState<AddressParts>(
    getInitialBusinessAddress(org, values.address)
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

  // --- uploads (logo & cover) ---
  const [logoUploadId, setLogoUploadId] = useState<string | null>(null);
  const [coverUploadId, setCoverUploadId] = useState<string | null>(null);
  const logoUpload = useSelector((s: any) =>
    logoUploadId ? selectUpload(s, logoUploadId) : undefined
  );
  const coverUpload = useSelector((s: any) =>
    coverUploadId ? selectUpload(s, coverUploadId) : undefined
  );
  const [tempLogoPreview, setTempLogoPreview] = useState<string | null>(null);
  const [tempCoverPreview, setTempCoverPreview] = useState<string | null>(null);

  const handlePickLogo = async (file: File) => {
    if (
      !/^image\/(png|jpe?g|webp|svg\+xml)$/i.test(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      toast.error('Please pick a PNG/JPG/WebP/SVG up to 5MB');
      return;
    }
    const url = URL.createObjectURL(file);
    setTempLogoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });

    const id = nanoid();
    setLogoUploadId(id);
    const res = await dispatch(uploadImage({ file, kind: 'org-logo', id }));
    if (uploadImage.fulfilled.match(res)) {
      set('logoUrl', res.payload.key);
      toast.success('Logo uploaded');
    } else {
      toast.error((res as any).payload || res.error.message || 'Upload failed');
    }
  };

  const handlePickCover = async (file: File) => {
    if (
      !/^image\/(png|jpe?g|webp|svg\+xml)$/i.test(file.type) ||
      file.size > 10 * 1024 * 1024
    ) {
      toast.error('Please pick a PNG/JPG/WebP/SVG up to 10MB');
      return;
    }
    const url = URL.createObjectURL(file);
    setTempCoverPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });

    const id = nanoid();
    setCoverUploadId(id);
    const res = await dispatch(uploadImage({ file, kind: 'org-cover', id }));
    if (uploadImage.fulfilled.match(res)) {
      set('coverUrl', res.payload.key);
      toast.success('Cover uploaded');
    } else {
      toast.error((res as any).payload || res.error.message || 'Upload failed');
    }
  };

  useEffect(() => {
    const v = getDefaults(org);
    setValues(v);
    setBusinessAddr(getInitialBusinessAddress(org, v.address));
    setErrors({});
    setDirty(false);
  }, [org, open]);

  // Seed previews from the server once we have the org (presigned URLs).
  useEffect(() => {
    if (!open) return;

    setTempLogoPreview((prev) => {
      // keep existing blob/preview if present
      if (prev) return prev;
      return org?.logoUrl ?? null; // presigned or public URL
    });

    setTempCoverPreview((prev) => {
      if (prev) return prev;
      return org?.coverUrl ?? null; // presigned or public URL
    });
  }, [open, org?.logoUrl, org?.coverUrl]);

  const validateField = useCallback(
    <K extends keyof Values>(key: K, next: Values) => {
      const val = next[key];

      // S3 keys (logoUrl, coverUrl): validate only if non-empty (no URL validation)
      if (
        (key === 'logoUrl' || key === 'coverUrl') &&
        (!val || String(val).trim() === '')
      ) {
        setErrors((e) => ({ ...e, [key]: undefined }));
        return;
      }

      // Phone: validate only if non-empty
      if (key === 'contactPhone') {
        const v = (val || '').toString().trim();
        const ok = v === '' || isValidPhoneNumber(v);
        setErrors((e) => ({
          ...e,
          [key]: ok ? undefined : 'Phone number is invalid',
        }));
        return;
      }

      // Country / Timezone: allow empty string
      if (
        (key === 'country' || key === 'timezone') &&
        (!val || String(val).trim() === '')
      ) {
        setErrors((e) => ({ ...e, [key]: undefined }));
        return;
      }

      // Description, brand_color, address, teamSize: allow empty
      if (
        (key === 'description' ||
          key === 'brand_color' ||
          key === 'address' ||
          key === 'teamSize') &&
        (val == null || String(val) === '')
      ) {
        setErrors((e) => ({ ...e, [key]: undefined }));
        return;
      }

      // Fallback to schema (e.g., name)
      const fieldSchema = (Schema.shape as any)[key] as z.ZodTypeAny;
      const result = fieldSchema.safeParse(val);
      setErrors((e) => ({
        ...e,
        [key]: result.success ? undefined : result.error.issues[0]?.message,
      }));
    },
    []
  );

  async function onSave() {
    if (!org) return;
    const businessAddress = {
      line1: businessAddr.line1?.trim() || '',
      line2: businessAddr.line2?.trim() || '',
      city: businessAddr.city?.trim() || '',
      state: businessAddr.state?.trim() || '',
      postalCode: businessAddr.postalCode?.trim() || '',
      country: businessAddr.country?.trim() || '',
    };
    if (
      values.contactPhone &&
      values.contactPhone.trim() !== '' &&
      !isValidPhoneNumber(values.contactPhone)
    ) {
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
      logoUrl: (values as any).logoUrl?.trim() || undefined,
      coverUrl: (values as any).coverUrl?.trim() || undefined,
      brand_color: values.brand_color?.trim() || undefined,
      business_address: businessAddress,
      contactPhone: values?.contactPhone?.trim() || undefined,
      description: values?.description?.trim() || undefined,
      teamSize: values.teamSize?.trim() || undefined,
      name: values.name?.trim() || '',
    };
    console.log(cleaned);
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
      const payload: any = {
        id: org.id,
        name: cleaned.name,
        teamSize: cleaned.teamSize ?? null,
      };

      if (cleaned.description !== undefined)
        payload.description = cleaned.description || null;
      if (cleaned.country !== undefined)
        payload.country = cleaned.country || null;
      if (cleaned.timezone !== undefined)
        payload.timezone = cleaned.timezone || null;
      if ((cleaned as any).logoUrl !== undefined)
        payload.logoUrl = (cleaned as any).logoUrl || null;
      if ((cleaned as any).coverUrl !== undefined)
        payload.coverUrl = (cleaned as any).coverUrl || null;
      if (cleaned.brand_color !== undefined)
        payload.brand_color = cleaned.brand_color || null;
      if (cleaned.business_address !== undefined)
        payload.business_address = businessAddress;
      // Legacy: also provide JSON string under `address` for old readers
      payload.address = JSON.stringify(businessAddress);
      if (cleaned.contactPhone !== undefined)
        payload.contactPhone = cleaned.contactPhone || null;

      await dispatch(updateOrg(payload)).unwrap();
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

  useEffect(() => {
    if (org) {
      dispatch(fetchOrgById(org.id)).unwrap();
    }
  }, [open, org?.id, dispatch]);

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

  useEffect(() => {
    return () => {
      if (tempLogoPreview) URL.revokeObjectURL(tempLogoPreview);
      if (tempCoverPreview) URL.revokeObjectURL(tempCoverPreview);
    };
  }, [tempLogoPreview, tempCoverPreview]);

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
                coverUrl={tempCoverPreview || org?.coverUrl || undefined}
                logoUrl={tempLogoPreview || org?.logoUrl || undefined}
                brandColor={values.brand_color}
                onPickCover={handlePickCover}
                onPickLogo={handlePickLogo}
                onBrandColorChange={(hex) => set('brand_color', hex)}
                uploadingCover={
                  !!coverUpload &&
                  coverUpload.status !== 'succeeded' &&
                  coverUpload.status !== 'failed'
                }
                uploadingLogo={
                  !!logoUpload &&
                  logoUpload.status !== 'succeeded' &&
                  logoUpload.status !== 'failed'
                }
                coverProgress={coverUpload?.progress ?? 0}
                logoProgress={logoUpload?.progress ?? 0}
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
                        // 1) Update country as before
                        set('country', c);

                        // 2) If timezone not chosen yet, auto-suggest a sensible default
                        if (!values.timezone || values.timezone.trim() === '') {
                          const suggested = pickTimezoneForCountry(c);
                          if (suggested) set('timezone', suggested);
                        }
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
                  country={businessAddr.country || undefined}
                  onCountryChange={(cc) => {
                    if (cc && cc !== (businessAddr.country || '')) {
                      setBusinessAddr((a) => ({ ...a, country: cc }));
                      setDirty(true);
                    }
                    if (!values.timezone || values.timezone.trim() === '') {
                      const suggested = pickTimezoneForCountry(cc);
                      if (suggested) set('timezone', suggested);
                    }
                  }}
                  error={errors.contactPhone}
                />

                <div className="space-y-2">
                  <Label>Business address</Label>
                  <div className="grid grid-cols-1 gap-3">
                    <Input
                      placeholder="Address line 1"
                      value={businessAddr.line1}
                      onChange={(e) => {
                        setBusinessAddr((a) => ({
                          ...a,
                          line1: e.target.value,
                        }));
                        setDirty(true);
                      }}
                      className="h-11"
                    />
                    <Input
                      placeholder="Address line 2"
                      value={businessAddr.line2}
                      onChange={(e) => {
                        setBusinessAddr((a) => ({
                          ...a,
                          line2: e.target.value,
                        }));
                        setDirty(true);
                      }}
                      className="h-11"
                    />

                    {/* Country for BUSINESS ADDRESS */}
                    <CountrySelect
                      value={businessAddr.country}
                      onChange={(c) => {
                        setBusinessAddr((a) => ({
                          ...a,
                          country: c as Country,
                        }));
                        setDirty(true);
                        if (!values.timezone || values.timezone.trim() === '') {
                          const suggested = pickTimezoneForCountry(c);
                          if (suggested) set('timezone', suggested);
                        }
                      }}
                      portalContainer={popoverContainerRef.current}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input
                        placeholder="City"
                        value={businessAddr.city}
                        onChange={(e) => {
                          setBusinessAddr((a) => ({
                            ...a,
                            city: e.target.value,
                          }));
                          setDirty(true);
                        }}
                        className="h-11"
                      />
                      <Input
                        placeholder="State / Province"
                        value={businessAddr.state}
                        onChange={(e) => {
                          setBusinessAddr((a) => ({
                            ...a,
                            state: e.target.value,
                          }));
                          setDirty(true);
                        }}
                        className="h-11"
                      />
                      <Input
                        placeholder="Postal code"
                        inputMode="text"
                        value={businessAddr.postalCode}
                        onChange={(e) =>
                          setBusinessAddr((a) => ({
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
        <ModalFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} className="h-11">
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={
              loading ||
              (logoUpload &&
                logoUpload.status !== 'succeeded' &&
                logoUpload.status !== 'failed') ||
              (coverUpload &&
                coverUpload.status !== 'succeeded' &&
                coverUpload.status !== 'failed')
            }
            aria-busy={loading ? 'true' : undefined}
            className="h-11"
          >
            {loading ? 'Saving…' : 'Save changes'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditOrgModal;
