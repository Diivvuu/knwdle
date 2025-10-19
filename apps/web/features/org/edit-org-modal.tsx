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
import { uploadImage, selectUpload, fetchOrgBasic } from '@workspace/state';
import { Textarea } from '@workspace/ui/components/textarea';
import { z } from 'zod';
import { nanoid } from '@reduxjs/toolkit';
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
  logoUrl: z.string().optional().or(z.literal('')),
  coverUrl: z.string().optional().or(z.literal('')),
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
  const safe = (v: unknown) => (v == null ? '' : String(v));
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

function BrandingHeader({
  coverUrl,
  logoUrl,
  brandColor,
  onPickCover,
  onPickLogo,
  onBrandColorChange,
  uploadingCover,
  uploadingLogo,
  coverProgress = 0,
  logoProgress = 0,
}: {
  coverUrl?: string;
  logoUrl?: string;
  brandColor?: string;
  onPickCover: (file: File) => void;
  onPickLogo: (file: File) => void;
  onBrandColorChange: (hex: string) => void;
  uploadingCover?: boolean;
  uploadingLogo?: boolean;
  coverProgress?: number;
  logoProgress?: number;
}) {
  const [dragOver, setDragOver] = useState(false);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const onCoverDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dt = e.dataTransfer;
    const f = dt.files?.item(0) ?? dt.files?.[0] ?? null;
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      toast.error('Please drop an image');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error('Max size 5MB');
      return;
    }
    const demoUrl = URL.createObjectURL(f);
    // For drag-drop, call onPickCover
    onPickCover(f);
    // toast will be shown by handler
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
              disabled={uploadingCover}
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
              disabled={uploadingCover}
            >
              {uploadingCover
                ? `Uploading… ${Math.max(0, Math.min(100, Math.round(coverProgress)))}%`
                : 'Change cover'}
            </Button>
          </div>
        </div>

        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPickCover(f);
            e.currentTarget.value = '';
          }}
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
            onClick={() => !uploadingLogo && logoInputRef.current?.click()}
            className="absolute inset-0 bg-black/0 hover:bg-black/25 transition-colors disabled:opacity-60"
            aria-label="Change logo"
            title="Change logo"
            disabled={uploadingLogo}
          />

          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPickLogo(f);
              e.currentTarget.value = '';
            }}
          />
        </div>
        {uploadingLogo && (
          <div className="absolute -bottom-10 left-5 text-xs rounded-md bg-background/80 px-2 py-0.5 border">
            Uploading logo…{' '}
            {Math.max(0, Math.min(100, Math.round(logoProgress)))}%
          </div>
        )}
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
  const [signedLogoUrl, setSignedLogoUrl] = useState<string | null>(null);
  const [signedCoverUrl, setSignedCoverUrl] = useState<string | null>(null);

  async function fetchSignedUrl(key: string) {
    const res = await fetch('/api/uploads/presign-get', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    });
    if (!res.ok) throw new Error('Failed to sign image URL');
    const j = await res.json();
    return j.url as string;
  }
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
    let cancelled = false;
    (async () => {
      try {
        if (tempLogoPreview) {
          setSignedLogoUrl(null);
          return;
        }
        const val = (values as any).logoUrl?.trim();
        if (!val) {
          setSignedLogoUrl(null);
          return;
        }
        // If it's already an http(s) URL, use as-is; otherwise presign the S3 key
        if (/^https?:\/\//i.test(val)) {
          if (!cancelled) setSignedLogoUrl(val);
        } else {
          const u = await fetchSignedUrl(val);
          if (!cancelled) setSignedLogoUrl(u);
        }
      } catch {
        if (!cancelled) setSignedLogoUrl(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, (values as any).logoUrl, tempLogoPreview]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (tempCoverPreview) {
          setSignedCoverUrl(null);
          return;
        }
        const val = (values as any).coverUrl?.trim();
        if (!val) {
          setSignedCoverUrl(null);
          return;
        }
        // If it's already an http(s) URL, use as-is; otherwise presign the S3 key
        if (/^https?:\/\//i.test(val)) {
          if (!cancelled) setSignedCoverUrl(val);
        } else {
          const u = await fetchSignedUrl(val);
          if (!cancelled) setSignedCoverUrl(u);
        }
      } catch {
        if (!cancelled) setSignedCoverUrl(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, (values as any).coverUrl, tempCoverPreview]);

  useEffect(() => {
    const v = getDefaults(org);
    setValues(v);
    setAddr(parseAddressString(v.address));
    setErrors({});
    setDirty(false);
  }, [org, open]);

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
    const address = makeAddressString({
      ...addr,
      country: values.country || addr.country,
    });
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
      address: address?.trim() || undefined,
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
      if (cleaned.address !== undefined)
        payload.address = cleaned.address || null;
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
      dispatch(fetchOrgBasic(org.id));
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
                coverUrl={tempCoverPreview || signedCoverUrl || undefined}
                logoUrl={tempLogoPreview || signedLogoUrl || undefined}
                brandColor={values.brand_color}
                onPickCover={handlePickCover}
                onPickLogo={handlePickLogo}
                onBrandColorChange={(hex) => {
                  set('brand_color', hex);
                }}
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
