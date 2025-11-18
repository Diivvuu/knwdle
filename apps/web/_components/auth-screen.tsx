'use client';

import { AppDispatch, RootState } from '@/store/store';
import {
  clearAuthError,
  clearOtpError,
  login,
  logout,
  requestOtp,
  signup,
  verifyOtp,
} from '@workspace/state';
import { redirect, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AuthShell from './auth-shell';
import {
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import Image from 'next/image';
import ErrorBanner from './error-banner';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@workspace/ui/components/tabs';
import EmailField from './email-field';
import PasswordField from './password-field';
import { Label } from '@workspace/ui/components/label';
import { Button } from '@workspace/ui/components/button';
import OrDivider from './or-divider';
import { Input } from '@workspace/ui/components/input';
import { toast } from 'sonner';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

const weakList = ['password', 'password1', '123456', 'qwerty', 'letmein'];
const SignUpSchema = z.object({
  name: z.string().min(2).max(64).optional(),
  email: z.string().email(),
  password: z
    .string()
    .min(8, 'Use at least 8 characters')
    .refine((v) => !weakList.includes(v.toLowerCase()), 'Too common')
    .refine((v) => /[a-z]/.test(v), 'Add a lowercase letter')
    .refine((v) => /[A-Z]/.test(v), 'Add an uppercase letter')
    .refine((v) => /\d/.test(v), 'Add a number')
    .refine((v) => /[^A-Za-z0-9]/.test(v), 'Add a symbol'),
});

type LoginValues = z.infer<typeof LoginSchema>;
type SignupValues = z.infer<typeof SignUpSchema>;

export default function AuthScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get('redirect') || '/dashboard';
  const forceLogout = params.get('forceLogout') === '1';

  const dispatch = useDispatch<AppDispatch>();
  const authState = useSelector((state: RootState) => state.auth) || {};

  const { user, status, error, accessToken, otp } = authState;
  const safeOtp = otp ?? { status: 'idle', error: undefined };

  // Track previous states for toast transitions
  const prevStatus = useRef(status);
  const prevOtpStatus = useRef(safeOtp.status);

  // Handle force logout
  useEffect(() => {
    if (forceLogout) dispatch(logout());
  }, [forceLogout, dispatch]);

  const initialMode = (params.get('mode') as 'login' | 'signup') || 'login';
  const [tab, setTab] = useState<'login' | 'signup'>(initialMode);

  const [cooldown, setCooldown] = useState(0);

  // Toast handling with state transitions
 useEffect(() => {
    // Handle signup success - when status goes from loading to idle without user
    if (
      prevStatus.current === "loading" &&
      status === "idle" &&
      !user &&
      !accessToken
    ) {
      toast.success("Account Created", {
        description: "Check your email for verification",
        icon: null
      });
    }

    // Handle auth failure
    if (prevStatus.current === "loading" && status === "failed") {
      toast.error("Authentication Failed", {
        description: error || "Something went wrong",
        icon: null
      });
    }

    // Handle OTP verification success
    if (
      prevOtpStatus.current === "verifying" &&
      safeOtp.status === "idle" &&
      user &&
      accessToken
    ) {
      toast.success("Verified Successfully", {
        description: "You're now logged in",
      });
    }

    // Handle OTP failure
    if (prevOtpStatus.current === "verifying" && safeOtp.status === "failed") {
      toast.error("Verification Failed", {
        description: safeOtp.error || "OTP verification failed",
      });
    }

    // Handle OTP sending success
    if (prevOtpStatus.current === "sending" && safeOtp.status === "sent") {
      toast.success("Code Sent", {
        description: "Check your email for the verification code",
      });
    }

    // Handle OTP sending failure
    if (prevOtpStatus.current === "sending" && safeOtp.status === "failed") {
      toast.error("Failed to Send", {
        description: safeOtp.error || "Failed to send OTP",
      });
    }

    prevStatus.current = status;
    prevOtpStatus.current = safeOtp.status;
  }, [status, safeOtp.status, error, safeOtp.error, user, accessToken]);

  // Clear errors when tab changes
  useEffect(() => {
    dispatch(clearAuthError());
    dispatch(clearOtpError());
  }, [tab, dispatch]);

  // OTP cooldown handling
  useEffect(() => {
    if (safeOtp.status === 'sent') setCooldown(30);
  }, [safeOtp.status]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => {
      setCooldown((c) => c - 1);
    }, 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const isLoadingPw = status === 'loading';
  const visibleError = useMemo(() => error ?? undefined, [error]);

  /* Login form */
  const {
    register: regLogin,
    handleSubmit: submitLogin,
    formState: { errors: errorsLogin },
  } = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
  });

  /* Signup form */
  const {
    register: regSignup,
    handleSubmit: submitSignup,
    formState: { errors: errorsSignup },
  } = useForm<SignupValues>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: { name: '', email: '', password: '' },
    mode: 'onBlur',
  });

  const onLogin = useCallback(
    (values: LoginValues) => {
      dispatch(clearAuthError());
      dispatch(
        login({
          email: values.email.trim().toLowerCase(),
          password: values.password,
        })
      );
    },
    [dispatch]
  );

  const onSignup = useCallback(
    (values: SignupValues) => {
      dispatch(clearAuthError());
      dispatch(
        signup({
          name: values.name?.trim() || undefined,
          email: values.email.trim().toLowerCase(),
          password: values.password,
        })
      );
    },
    [dispatch]
  );

  /* OTP Local state */
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const otpCodeRef = useRef<HTMLInputElement | null>(null);

  const sendOtp = useCallback(async () => {
    if (!otpEmail) return;
    dispatch(clearOtpError());
    if (otpEmail) {
      await dispatch(requestOtp({ email: otpEmail.trim().toLowerCase() }));
    }
  }, [dispatch, otpEmail]);

  const confirmOtp = useCallback(async () => {
    if (!otpEmail || !otpCode) return;
    dispatch(clearOtpError());
    if (otpEmail && otpCode) {
      await dispatch(
        verifyOtp({ email: otpEmail.trim().toLowerCase(), code: otpCode })
      );
    }
  }, [dispatch, otpEmail, otpCode]);

  // Focus OTP input when sent
  useEffect(() => {
    if (safeOtp.status === 'sent') {
      setTimeout(() => otpCodeRef.current?.focus?.(), 0);
    }
  }, [safeOtp.status]);

  // Handle Enter key for OTP verification
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        safeOtp.status === 'sent' &&
        e.key === 'Enter' &&
        otpCode.length >= 4
      ) {
        e.preventDefault();
        confirmOtp();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [safeOtp.status, otpCode, confirmOtp]);

  // Redirect when authenticated
  useEffect(() => {
    if (user && accessToken) router.replace(redirectTo);
  }, [user, accessToken, router, redirectTo]);

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

  // Handle Cmd+Enter for form submission
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

  const otpSending = safeOtp.status === 'sending';
  const otpSent = safeOtp.status === 'sent';
  const otpVerifying = safeOtp.status === 'verifying';
  const otpFailed = safeOtp.status === 'failed';
  const otpError = safeOtp.error;

  return (
    <AuthShell>
      <CardHeader className="pb-4">
        <div className="mx-auto w-full grid align-items-center gap-y-2">
          <CardTitle className="text-lg text-muted-foreground mx-auto w-full text-center">
            Welcome to
          </CardTitle>
          <Image
            src="/knwdle-light.svg"
            width={100}
            height={100}
            alt="logo"
            className="opacity-90 mx-auto dark:hidden"
          />
          <Image
            src="/knwdle-dark.svg"
            width={100}
            height={100}
            alt="logo"
            className="opacity-90 mx-auto hidden dark:block"
          />
        </div>
      </CardHeader>

      <CardContent className="pt-0 rounded-xl bg-gradient-t-b from-background to-muted/30">
        {visibleError && (
          <div className='mb-4'>
            <ErrorBanner message={visibleError} />
          </div>
        )}

        <Tabs value={tab} onValueChange={onTabChange}>
          <TabsList className="mb-4 grid w-full grid-cols-2 rounded-lg">
            <TabsTrigger value="login">Log in</TabsTrigger>
            <TabsTrigger value="signup">Sign up</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="space-y-5">
            <form
              className="grid gap-4"
              onSubmit={submitLogin(onLogin)}
              noValidate
            >
              <EmailField
                label="Email"
                register={regLogin("email")}
                error={errorsLogin.email?.message}
              />
              <PasswordField
                label="Password"
                autoComplete="current-password"
                register={regLogin("password")}
                error={errorsLogin.password?.message}
                withStrength={false}
              />
              <div className="flex items-center justify-between">
                <Label>
                  Press <kbd className="rounded border px-1 py-0.5">⌘</kbd>+{" "}
                  <kbd className="rounded-border px-1 py-0.5">Enter</kbd> to
                  submit
                </Label>
                <Button
                  data-primary-submit="1"
                  type="submit"
                  disabled={isLoadingPw}
                >
                  {isLoadingPw ? "Logging in..." : "Log in"}
                </Button>
              </div>
            </form>
            <OrDivider />
            <div className="grid gap-3 rounded-lg border bg-background/60 p-4">
              <div className="grid gap-2">
                <Label htmlFor="otp-email">Email</Label>
                <Input
                  id="otp-email"
                  type="email"
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                  placeholder="you@exmaple.com"
                  value={otpEmail}
                  onChange={(e) => setOtpEmail(e.target.value)}
                  disabled={otpSending || otpVerifying || otpSent}
                />
              </div>

              {otpSent ? (
                <>
                  {otpError && (
                    <p
                      className="text-sm text-destructive"
                      aria-live="assertive"
                    >
                      {otpError}
                    </p>
                  )}
                  <div className="grid gap-2">
                    <Label htmlFor="otp-code">OTP Code</Label>
                    <input
                      id="otp-code"
                      ref={otpCodeRef}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      className="h-9 rounded-md border bg-background px-3 text-sm tracking-widest"
                      placeholder="• • • • • •"
                      value={otpCode}
                      onChange={(e) =>
                        setOtpCode(e.target.value.replace(/\D/g, ""))
                      }
                      disabled={otpVerifying}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      onClick={confirmOtp}
                      disabled={otpVerifying || otpCode.length < 4}
                    >
                      {otpVerifying ? "Verifying..." : "Verify & Log in"}
                    </Button>
                    <Button
                      variant={"ghost"}
                      onClick={() => {
                        setOtpCode("");
                        setOtpEmail("");
                      }}
                      disabled={otpVerifying}
                    >
                      Use a different email
                    </Button>
                    <Button
                      variant={"outline"}
                      onClick={sendOtp}
                      disabled={cooldown > 0 || otpVerifying}
                    >
                      {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {otpFailed && otpError && (
                    <p className="text-sm text-destructive">{otpError}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={sendOtp}
                      disabled={otpSending || !otpEmail}
                    >
                      {otpSending ? "Sending..." : "Send OTP"}
                    </Button>
                    <Label className="text-xs text-muted-foreground">
                      We'll email a code
                    </Label>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
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
                  {...regSignup("name")}
                />
                {errorsSignup.name && (
                  <p className="text-sm text-destructive">
                    {errorsSignup.name.message}
                  </p>
                )}
              </div>
              <EmailField
                label="Email"
                register={regSignup("email")}
                error={errorsSignup.email?.message}
              />
              <PasswordField
                label="Password"
                autoComplete="new-password"
                register={regSignup("password")}
                error={errorsSignup.password?.message}
                withStrength
              />
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  Use 8+ chars mix of letters, number & symbols
                </Label>
                <Button
                  data-primary-submit="1"
                  type="submit"
                  disabled={isLoadingPw}
                >
                  {isLoadingPw ? "Creating..." : "Create Account"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          By continuing you agree to our Terms & Privacy Policy.
        </p>
      </CardContent>
    </AuthShell>
  );
}