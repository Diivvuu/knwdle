import { cn } from '@workspace/ui/lib/utils';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../button';
import { ImageIcon, Upload } from 'lucide-react';
import { Input } from '../input';

export default function BrandingHeader({
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

  console.log('branding header', coverUrl);

  // --- Brand color helpers ---
  function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const m = hex.trim().replace('#', '').toLowerCase();
    const full =
      m.length === 3
        ? m
            .split('')
            .map((c) => c + c)
            .join('')
        : m;
    if (!/^[0-9a-f]{6}$/.test(full)) return null;
    const int = parseInt(full, 16);
    return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
  }
  function hexToRgba(hex: string, alpha: number): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return `rgba(0,0,0,${alpha})`;
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  }

  const brandTint = brandColor
    ? hexToRgba(brandColor, 0.28)
    : 'rgba(0,0,0,0.18)';

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
          'relative h-48 sm:h-56 md:h-64 w-full bg-muted/60 group ring-offset-background',
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
        {/* Brand tint + vignette */}
        {coverUrl && (
          <>
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: `linear-gradient(to top, ${brandTint}, transparent 60%)`,
              }}
            />
            <div className="pointer-events-none absolute inset-0 shadow-[inset_0_-80px_120px_-60px_rgba(0,0,0,0.35)]" />
          </>
        )}
        {!coverUrl && (
          <div
            className="absolute inset-0 grid place-items-center text-sm text-muted-foreground cursor-pointer overflow-hidden"
            role="button"
            tabIndex={0}
            aria-label="Add a cover image"
            aria-disabled={uploadingCover ? 'true' : undefined}
            onClick={() => {
              if (!uploadingCover) coverInputRef.current?.click();
            }}
            onKeyDown={(e) => {
              if (uploadingCover) return;
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                coverInputRef.current?.click();
              }
            }}
          >
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-border/70 bg-background/70 px-4 py-3 hover:bg-background/90 shadow-sm transition-colors">
              <Upload className="h-5 w-5" />
              <span>Click or drag image to add a cover</span>
            </div>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/25 to-transparent">
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => coverInputRef.current?.click()}
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
        <div
          className="relative absolute -bottom-8 left-5 h-20 w-20 sm:h-24 sm:w-24 rounded-xl border border-border/60 overflow-hidden bg-background shadow-lg grid place-items-center"
          style={
            brandColor
              ? { boxShadow: `0 0 0 3px ${hexToRgba(brandColor, 0.15)}` }
              : undefined
          }
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="object-cover" />
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
      <div className="pt-10 px-4 sm:px-6 pb-4 flex items-center justify-between gap-3 bg-card/60 border-t border-border/60 backdrop-blur">
        <div className="text-sm text-muted-foreground">Branding</div>
        <div className="flex items-center gap-3">
          <Input
            type="color"
            value={brandColor || '#78489d'}
            onChange={(e) => onBrandColorChange(e.target.value)}
            className="h-9 w-10 p-1 cursor-pointer rounded-md border border-border/60"
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
