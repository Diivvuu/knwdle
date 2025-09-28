'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/redux/store';
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
import { login, signup } from '@/redux/slices/auth';
import AuthShell from './auth-shell';
import ErrorBanner from './error-banner';
import EmailField from './email-field';
import PasswordField from './password-field';
import OrDivider from './or-divider';
import SSOButtons from './sso-buttons';
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
  const redirectTo = params.get('redirect') || '/';
  const dispatch = useDispatch<AppDispatch>();
  const { user, status, error, accessToken } = useSelector(
    (s: RootState) => s.auth
  );

  const [tab, setTab] = useState<'login' | 'signup'>(
    (params.get('mode') as 'login' | 'signup') || 'login'
  );

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

  const onLogin = useCallback(
    (values: LoginValues) => void dispatch(login(values)),
    [dispatch]
  );
  const onSignup = useCallback(
    (values: SignupValues) => void dispatch(signup(values)),
    [dispatch]
  );

  // redirect after successful auth
  useEffect(() => {
    if (user && accessToken) router.replace(redirectTo);
  }, [user, accessToken, router, redirectTo]);

  const visibleError = useMemo(() => error ?? null, [error]);

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
      <CardHeader className="pb-3">
        {/* <CardTitle className="text-center text-2xl">Welcome</CardTitle> */}
        <Image
          src={'/knwdle.svg'}
          width={100}
          height={100}
          alt="logo"
          className="mx-auto"
        />
      </CardHeader>

      <CardContent className="pt-0">
        {visibleError && <ErrorBanner message={visibleError} />}

        <Tabs value={tab} onValueChange={(v: string) => setTab(v as any)}>
          <TabsList className="grid grid-cols-2 w-full mb-4">
            <TabsTrigger value="login">Log in</TabsTrigger>
            <TabsTrigger value="signup">Sign up</TabsTrigger>
          </TabsList>

          {/* LOGIN */}
          <TabsContent value="login" className="space-y-4">
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

            {/* <OrDivider /> */}
            {/* <SSOButtons /> */}
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
