'use client';

import { useEffect, useMemo, useCallback } from 'react';
import type { AppDispatch, RootState } from '@/store/store';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Loader2,
  LogOut,
  Copy,
  ShieldCheck,
  Building2,
  BadgeCheck,
  ArrowRight,
} from 'lucide-react';

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
} from '@workspace/state'; // <- from your updated auth slice
import { useDispatch, useSelector } from 'react-redux';

const Halo = (props: any) => (
  <svg width="260" height="260" viewBox="0 0 260 260" {...props}>
    <defs>
      <radialGradient id="halo" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
      </radialGradient>
    </defs>
    <circle cx="130" cy="130" r="130" fill="url(#halo)" />
  </svg>
);

export default function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const search = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();

  const user = useSelector((s: RootState) => s.auth?.user ?? null);
  const invite = useSelector((s: RootState) => s.auth?.invite) ?? {
    preview: null,
    previewStatus: 'idle',
    previewError: undefined,
    acceptStatus: 'idle',
    acceptError: undefined,
    acceptResult: null,
  };

  const {
    preview,
    previewStatus,
    previewError,
    acceptStatus,
    acceptError,
    acceptResult,
  } = invite;

  // current URL for auth redirect
  const currentUrl = useMemo(() => {
    const qs = search?.toString();
    return `/join/${token}${qs ? `?${qs}` : ''}`;
  }, [token, search]);

  const goAuth = useCallback(() => {
    router.replace(`/auth?redirect=${encodeURIComponent(currentUrl)}`);
  }, [router, currentUrl]);

  const switchAccount = useCallback(() => {
    router.replace(
      `/auth?mode=login&redirect=${encodeURIComponent(currentUrl)}&forceLogout=1`
    );
  }, [router, currentUrl]);

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

  // fetch preview on mount, reset on unmount
  useEffect(() => {
    if (token) dispatch(fetchInvitePreview({ token: String(token) }));
    return () => {
      dispatch(resetInviteUi());
    };
  }, [token, dispatch]);

  // redirect after successful accept
  useEffect(() => {
    if (acceptStatus === 'succeeded' && acceptResult) {
      toast.success(acceptResult.message || 'Invite accepted');
      const to = '/dashboard';
      router.replace(to);
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

  // derive UI states
  const uiLoading = previewStatus === 'loading' || acceptStatus === 'loading';
  const uiError = (() => {
    // prefer accept error if present
    if (acceptStatus === 'failed')
      return acceptError || 'We couldn’t accept your invite.';
    if (previewStatus === 'failed')
      return previewError || 'Invite is invalid or expired.';
    return null;
  })();

  // status code isn’t in store; we still keep the switch-account flow by checking message substrings
  const looksLikeWrongAccount =
    typeof uiError === 'string' &&
    /different email|another email|for another email|Invite is for/.test(
      uiError
    );

  const headlineOrg = preview?.orgName || 'an organisation on Knwdle';
  const roleDisplay = preview?.roleName
    ? `${preview.roleName}${preview.parentRole ? ` · ${preview.parentRole}` : ''}`
    : preview?.parentRole
      ? `${preview.parentRole}`
      : undefined;

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-gradient-to-b from-background to-background/70">
      {/* Ambient halos */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-28 -left-28 text-primary/50"
        initial={{ scale: 0.85, rotate: -6, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 60, damping: 18, delay: 0.1 }}
      >
        <Halo className="h-[300px] w-[300px]" />
      </motion.div>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -right-24 text-primary/40"
        initial={{ scale: 0.85, rotate: 6, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 60, damping: 18, delay: 0.2 }}
      >
        <Halo className="h-[260px] w-[260px]" />
      </motion.div>

      <div className="relative z-10 mx-auto max-w-3xl px-6 pt-16 pb-12">
        {/* Heading */}
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 80,
            damping: 18,
            delay: 0.15,
          }}
          className="text-center"
        >
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            You’re invited to{' '}
            <span className="text-primary">{headlineOrg}</span>
          </h1>
          <p className="mt-3 text-sm md:text-base text-muted-foreground">
            Review the details below and confirm to join.
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 80,
            damping: 18,
            delay: 0.25,
          }}
          className="mt-8"
        >
          <Card className="backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="size-5 text-primary" /> Invitation
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-0">
              {uiLoading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="size-5 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    {previewStatus === 'loading'
                      ? 'Preparing your invite…'
                      : 'Accepting your invite…'}
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

                  <div className="flex flex-wrap gap-2">
                    {looksLikeWrongAccount && (
                      <>
                        <Button onClick={switchAccount}>
                          <LogOut className="mr-2 size-4" />
                          Switch account
                        </Button>
                        <Button variant="ghost" onClick={copyInviteLink}>
                          <Copy className="mr-2 size-4" />
                          Copy invite link
                        </Button>
                      </>
                    )}
                    {!user && (
                      <Button onClick={goAuth}>
                        Sign in to continue{' '}
                        <ArrowRight className="ml-2 size-4" />
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => router.push('/')}>
                      Go home
                    </Button>
                  </div>
                </div>
              ) : (
                // ready
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="size-4" /> Organisation
                      </div>
                      <div className="mt-1 text-base font-medium">
                        {preview?.orgName || 'Organisation'}
                      </div>
                      {preview?.unitName ? (
                        <div className="text-xs text-muted-foreground">
                          Unit: {preview.unitName}
                        </div>
                      ) : null}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <BadgeCheck className="size-4" /> Role
                      </div>
                      <div className="mt-1 text-base font-medium capitalize">
                        {roleDisplay || 'Member'}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="text-sm text-muted-foreground">
                    By joining, your account will be added to this organisation
                    with the role shown above. You can leave later or change
                    notifications anytime.
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {user ? (
                      <Button onClick={onAccept}>Accept & Join</Button>
                    ) : (
                      <Button onClick={goAuth}>Sign in to accept</Button>
                    )}
                    <Button variant="ghost" onClick={() => router.push('/')}>
                      No thanks
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
