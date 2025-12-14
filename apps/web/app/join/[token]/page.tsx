'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useMemo, useCallback, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Loader2,
  LogOut,
  Copy,
  ShieldCheck,
  Building2,
  BadgeCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store/store';

import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Alert, AlertDescription } from '@workspace/ui/components/alert';
import { Separator } from '@workspace/ui/components/separator';
import {
  fetchInvitePreview,
  acceptInviteByToken,
  resetInviteUi,
  logout,
  hardResetAuthClient,
} from '@workspace/state';

// --------------------------------------------------

const Halo = ({ className }: { className?: string }) => (
  <svg width="260" height="260" viewBox="0 0 260 260" className={className}>
    <defs>
      <radialGradient id="halo" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
      </radialGradient>
    </defs>
    <circle cx="130" cy="130" r="130" fill="url(#halo)" />
  </svg>
);

// --------------------------------------------------

export default function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const [showLoader, setShowLoader] = useState(true);
  const router = useRouter();
  const search = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();

  const user = useSelector((s: RootState) => s.auth?.user ?? null);
  const invite = useSelector((s: RootState) => s.auth?.invite) ?? {};
  const {
    preview,
    previewStatus,
    previewError,
    acceptStatus,
    acceptError,
    acceptResult,
  } = invite;

  const currentUrl = useMemo(() => {
    const qs = search?.toString();
    return `/join/${token}${qs ? `?${qs}` : ''}`;
  }, [token, search]);

  const goAuth = useCallback(() => {
    router.replace(`/auth?redirect=${encodeURIComponent(currentUrl)}`);
  }, [router, currentUrl]);

  const switchAccount = useCallback(async () => {
    try {
      await dispatch(logout()).unwrap();
      toast.info('You have been logged out.');
    } catch {
      hardResetAuthClient?.();
    } finally {
      router.replace(
        `/auth?mode=login&redirect=${encodeURIComponent(currentUrl)}`
      );
    }
  }, [dispatch, router, currentUrl]);

  const copyInviteLink = useCallback(async () => {
    const href =
      typeof window !== 'undefined' ? window.location.href : currentUrl;
    try {
      await navigator.clipboard.writeText(href);
      toast.success('Invite link copied');
    } catch {
      toast.error('Could not copy link');
    }
  }, [currentUrl]);

  useEffect(() => {
    if (token) dispatch(fetchInvitePreview({ token: String(token) }));
    return () => {
      dispatch(resetInviteUi());
    };
  }, [token, dispatch]);

  useEffect(() => {
    if (acceptStatus === 'succeeded' && acceptResult) {
      toast.success(acceptResult.message || 'Invite accepted');
      router.replace('/dashboard');
    }
  }, [acceptStatus, acceptResult, router]);

  const onAccept = useCallback(async () => {
    if (!user) {
      goAuth();
      return;
    }
    if (!token) return;
    await dispatch(acceptInviteByToken({ token: String(token) }));
  }, [user, token, dispatch, goAuth]);

  const uiLoading = previewStatus === 'loading' || acceptStatus === 'loading';
  const uiError =
    acceptStatus === 'failed'
      ? acceptError || 'We couldn’t accept your invite.'
      : previewStatus === 'failed'
        ? previewError || 'Invite is invalid or expired.'
        : null;

  const looksLikeWrongAccount =
    typeof uiError === 'string' &&
    /different email|another email|for another email|Invite is for/.test(
      uiError
    );

  const headlineOrg = preview?.orgName || 'an organisation on Knwdle';
  const roleDisplay = preview?.roleName
    ? `${preview.roleName}${preview.parentRole ? ` · ${preview.parentRole}` : ''}`
    : preview?.parentRole || undefined;

  // --------------------------------------------------
  // ✨ UI
  // --------------------------------------------------

  useEffect(() => {
    // Hide loader once preview has successfully loaded or failed
    if (previewStatus === 'succeeded' || previewStatus === 'failed') {
      setShowLoader(false);
    }
  }, [previewStatus]);

  if (showLoader) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-background">
        <Loader2 className="size-6 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">
          Loading invite details...
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-amber-50 dark:from-[#09090B] dark:via-[#0E0E11] dark:to-[#1A1A1F]">
      {/* Glow halos */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-24 text-primary/40"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
      >
        <Halo className="h-[320px] w-[320px]" />
      </motion.div>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 text-amber-400/30"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', delay: 0.3 }}
      >
        <Halo className="h-[260px] w-[260px]" />
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', delay: 0.25 }}
        className="relative z-10 w-full max-w-lg px-6"
      >
        <Card className="border-0 shadow-xl backdrop-blur-md bg-background/70 dark:bg-background/50">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center">
              <ShieldCheck className="size-10 text-primary drop-shadow-md" />
            </div>
            <CardTitle className="text-2xl md:text-3xl font-semibold">
              You’re invited to{' '}
              <span className="text-primary">{headlineOrg}</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Review the invitation details and confirm to join.
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {uiLoading ? (
              <div className="flex items-center justify-center gap-3 py-6">
                <Loader2 className="size-5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  {previewStatus === 'loading'
                    ? 'Fetching your invitation...'
                    : 'Accepting your invite...'}
                </span>
              </div>
            ) : uiError ? (
              <div className="space-y-5">
                <Alert
                  variant={looksLikeWrongAccount ? undefined : 'destructive'}
                >
                  <AlertDescription>
                    {looksLikeWrongAccount && user ? (
                      <>
                        This invite is for a different email than{' '}
                        <span className="font-medium">{user.email}</span>.
                        Switch to the invited account to continue.
                      </>
                    ) : (
                      uiError
                    )}
                  </AlertDescription>
                </Alert>

                <div className="flex flex-wrap justify-center gap-2">
                  {looksLikeWrongAccount && (
                    <>
                      <Button onClick={switchAccount}>
                        <LogOut className="mr-2 size-4" /> Switch account
                      </Button>
                      <Button variant="ghost" onClick={copyInviteLink}>
                        <Copy className="mr-2 size-4" /> Copy invite link
                      </Button>
                    </>
                  )}
                  {!user && (
                    <Button onClick={goAuth}>
                      Sign in to continue
                      <ArrowRight className="ml-2 size-4" />
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => router.push('/')}>
                    Go home
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* info grid */}
                <div className="rounded-lg bg-muted/30 p-4 transition hover:bg-muted/40">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="size-4" />
                        Organisation
                      </div>
                      <div className="font-medium">
                        {preview?.orgName || 'Organisation'}
                      </div>
                      {preview?.audienceName && (
                        <div className="text-xs text-muted-foreground">
                          Audience: {preview.audienceName}
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <BadgeCheck className="size-4" />
                        Role
                      </div>
                      <div className="font-medium capitalize">
                        {roleDisplay || 'Member'}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <p className="text-sm text-center text-muted-foreground leading-relaxed">
                  By joining, your account will be linked to this organisation
                  with the role shown above. You can leave or manage your
                  notifications anytime.
                </p>

                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {user ? (
                    <Button
                      size="lg"
                      onClick={onAccept}
                      className="group relative overflow-hidden"
                    >
                      <motion.span
                        className="absolute inset-0 bg-gradient-to-r from-primary/40 via-amber-400/30 to-primary/40 opacity-0 group-hover:opacity-100 blur-lg transition"
                        layoutId="accept-glow"
                      />
                      <Sparkles className="mr-2 size-4 group-hover:rotate-12 transition-transform" />
                      Accept & Join
                    </Button>
                  ) : (
                    <Button size="lg" onClick={goAuth}>
                      Sign in to accept
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => router.push('/')}>
                    No thanks
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
