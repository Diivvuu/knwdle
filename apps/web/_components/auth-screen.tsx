'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store/store';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@workspace/ui/components/tabs';
import { Button } from '@workspace/ui/components/button';
import { Label } from '@workspace/ui/components/label';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { login, signup, requestOtp, verifyOtp } from '@workspace/state';
import AuthShell from './auth-shell';
import ErrorBanner from './error-banner';
import EmailField from './email-field';
import PasswordField from './password-field';
import OrDivider from './or-divider';
// import SSOButtons from './sso-buttons';
import Image from 'next/image';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
const SignupSchema = z.object({
  name: z.string().min(2).max(64).optional(),
  email: z.string().email(),
  password: z.string().min(6),
});
type LoginValues = z.infer<typeof LoginSchema>;
type SignupValues = z.infer<typeof SignupSchema>;

export default function AuthScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get('redirect') || '/dashboard';

  const dispatch = useDispatch<AppDispatch>();
  const { user, status, error, accessToken } = useSelector(
    (s: RootState) => s.auth
  );

  const initialMode = (params.get('mode') as 'login' | 'signup') || 'login';
  const [tab, setTab] = useState<'login' | 'signup'>(initialMode);

  const isLoading = status === 'loading';

  // login form
  const {
    register: regLogin,
    handleSubmit: submitLogin,
    formState: { errors: errorsLogin },
  } = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
  });

  // signup form
  const {
    register: regSignup,
    handleSubmit: submitSignup,
    formState: { errors: errorsSignup },
  } = useForm<SignupValues>({
    resolver: zodResolver(SignupSchema),
    defaultValues: { name: '', email: '', password: '' },
    mode: 'onBlur',
  });

  // OTP local state
  const [otpStage, setOtpStage] = useState<'idle' | 'sent'>('idle');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const onLogin = useCallback(
    (values: LoginValues) => void dispatch(login(values)),
    [dispatch]
  );
  const onSignup = useCallback(
    (values: SignupValues) => void dispatch(signup(values)),
    [dispatch]
  );

  // OTP handlers
  const sendOtp = useCallback(async () => {
    if (!otpEmail) return;
    await dispatch(requestOtp({ email: otpEmail }));
    setOtpStage('sent');
  }, [dispatch, otpEmail]);

  const confirmOtp = useCallback(async () => {
    if (!otpEmail || !otpCode) return;
    await dispatch(verifyOtp({ email: otpEmail, code: otpCode }));
    // success redirect handled by effect below
  }, [dispatch, otpEmail, otpCode]);

  // redirect after successful auth
  useEffect(() => {
    if (user && accessToken) router.replace(redirectTo);
  }, [user, accessToken, router, redirectTo]);

  const visibleError = useMemo(() => error ?? null, [error]);

  // keep ?mode in sync when switching tabs
  const onTabChange = useCallback(
    (v: string) => {
      const mode = (v === 'signup' ? 'signup' : 'login') as 'login' | 'signup';
      setTab(mode);
      const search = new URLSearchParams(params.toString());
      search.set('mode', mode);
      router.replace(`?${search.toString()}`, { scroll: false });
    },
    [params, router]
  );

  // ⌘/Ctrl + Enter submits active tab
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const btn = document.querySelector<HTMLButtonElement>(
          'button[data-primary-submit="1"]'
        );
        btn?.click();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <AuthShell>
      <CardHeader className="pb-4">
        <div className="mx-auto grid place-items-center gap-2">
          <Image
            src="/knwdle.svg"
            width={96}
            height={96}
            alt="logo"
            className="opacity-95"
          />
          <CardTitle className="text-lg text-muted-foreground">
            Welcome to knwdle
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="pt-0 rounded-xl bg-gradient-to-b from-background to-muted/30">
        {visibleError && <ErrorBanner message={visibleError} />}

        <Tabs value={tab} onValueChange={onTabChange}>
          <TabsList className="mb-4 grid w-full grid-cols-2 rounded-lg">
            <TabsTrigger value="login">Log in</TabsTrigger>
            <TabsTrigger value="signup">Sign up</TabsTrigger>
          </TabsList>

          {/* LOGIN */}
          <TabsContent value="login" className="space-y-5">
            {/* Password login */}
            <form
              className="grid gap-4"
              onSubmit={submitLogin(onLogin)}
              noValidate
            >
              <EmailField
                label="Email"
                register={regLogin('email')}
                error={errorsLogin.email?.message}
              />

              {/* Your PasswordField should render eye/eye-off toggle internally */}
              <PasswordField
                label="Password"
                autoComplete="current-password"
                register={regLogin('password')}
                error={errorsLogin.password?.message}
                withStrength={false}
              />

              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  Press <kbd className="rounded border px-1 py-0.5">⌘</kbd>+
                  <kbd className="rounded border px-1 py-0.5">Enter</kbd> to
                  submit
                </Label>
                <Button
                  data-primary-submit="1"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? 'Logging in…' : 'Log in'}
                </Button>
              </div>
            </form>

            <OrDivider />

            {/* OTP login */}
            <div className="grid gap-3 rounded-lg border bg-background/60 p-4">
              <div className="grid gap-2">
                <Label htmlFor="otp-email">Email</Label>
                <input
                  id="otp-email"
                  type="email"
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                  placeholder="you@example.com"
                  value={otpEmail}
                  onChange={(e) => setOtpEmail(e.target.value)}
                />
              </div>

              {otpStage === 'sent' ? (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="otp-code">OTP code</Label>
                    <input
                      id="otp-code"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      className="h-9 rounded-md border bg-background px-3 text-sm tracking-widest"
                      placeholder="• • • • • •"
                      value={otpCode}
                      onChange={(e) =>
                        setOtpCode(e.target.value.replace(/\D/g, ''))
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={confirmOtp}
                      disabled={isLoading || otpCode.length < 4}
                    >
                      {isLoading ? 'Verifying…' : 'Verify & Log in'}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setOtpStage('idle');
                        setOtpCode('');
                      }}
                    >
                      Change email
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Button onClick={sendOtp} disabled={isLoading || !otpEmail}>
                    {isLoading ? 'Sending…' : 'Send OTP'}
                  </Button>
                  <Label className="text-xs text-muted-foreground">
                    We’ll email a 6-digit code
                  </Label>
                </div>
              )}
            </div>
          </TabsContent>

          {/* SIGNUP */}
          <TabsContent value="signup" className="space-y-4">
            <form
              className="grid gap-4"
              onSubmit={submitSignup(onSignup)}
              noValidate
            >
              <div className="grid gap-2">
                <Label htmlFor="signup-name">Name (optional)</Label>
                <input
                  id="signup-name"
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                  placeholder="Jane Doe"
                  autoComplete="name"
                  {...regSignup('name')}
                />
                {errorsSignup.name && (
                  <p className="text-sm text-destructive">
                    {errorsSignup.name.message}
                  </p>
                )}
              </div>

              <EmailField
                label="Email"
                register={regSignup('email')}
                error={errorsSignup.email?.message}
              />

              <PasswordField
                label="Password"
                autoComplete="new-password"
                register={regSignup('password')}
                error={errorsSignup.password?.message}
                withStrength
              />

              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  Use 8+ chars with mix of letters, numbers & symbols
                </Label>
                <Button
                  data-primary-submit="1"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating…' : 'Create account'}
                </Button>
              </div>
            </form>
            {/* <OrDivider />
            <SSOButtons /> */}
          </TabsContent>
        </Tabs>

        {/* tiny legal */}
        <p className="mt-4 text-center text-xs text-muted-foreground">
          By continuing you agree to our Terms & Privacy Policy.
        </p>
      </CardContent>
    </AuthShell>
  );
}
