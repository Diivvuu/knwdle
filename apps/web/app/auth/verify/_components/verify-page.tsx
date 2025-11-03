'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { verifyAccount } from '@workspace/state';
import { AppDispatch } from '@/store/store';
import { CheckCircle2 } from 'lucide-react';
import { Card } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Spinner } from '@workspace/ui/components/spinner';
import { cn } from '@workspace/ui/lib/utils';
import Image from 'next/image';

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const [status, setStatus] = useState<
    'idle' | 'loading' | 'succeeded' | 'failed'
  >('idle');
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!token) {
      setError('No token provided');
      setStatus('failed');
      return;
    }
    setStatus('loading');
    setError(null);
    try {
      await dispatch(verifyAccount({ token })).unwrap();
      setStatus('succeeded');
    } catch (err: any) {
      setError(err?.message || 'Verification failed');
      setStatus('failed');
    }
  };

  return (
    <div className="h-screen bg-bacground flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 shadow-2xl animate-fadeIn bg-card text-foreground border border-border rounded-lg">
        <div className="flex flex-col items-center space-y-6">
          <div className="mb-4">
            <Image
              src="/knwdle-light.svg"
              alt="Knwdle"
              width={100}
              height={100}
              priority
              className="w-24 sm:w-32 md:w-44 lg:w-52 h-auto object-contain object-left dark:hidden"
            />
            {/* Dark mode logo */}
            <Image
              src="/knwdle-dark.svg"
              alt="Knwdle"
              width={100}
              height={100}
              priority
              className="w-24 sm:w-32 md:w-44 lg:w-52 h-auto. object-contain object-left hidden dark:block"
            />
          </div>
          <h1 className="text-2xl font-semibold select-none">
            Account Verification
          </h1>

          {status === 'idle' && (
            <Button
              onClick={handleVerify}
              disabled={!token}
              className="w-full transition-transform hover-lift hover-glow"
            >
              Verify Account
            </Button>
          )}

          {status === 'loading' && (
            <div className="flex flex-col items-center space-y-3">
              <Spinner />
              <p className="text-muted-foreground text-lg font-medium select-none">
                Verifying...
              </p>
            </div>
          )}

          {status === 'succeeded' && (
            <div className="flex flex-col items-center space-y-4 animate-fadeIn">
              <CheckCircle2 className="text-success w-16 h-16" />
              <p className="text-success font-semibold text-lg select-none">
                Verification successful!
              </p>
              <Button
                onClick={() => router.push('/dashboard')}
                className="w-full transition-transform hover-lift hover-glow"
              >
                Go to Dashboard
              </Button>
            </div>
          )}

          {status === 'failed' && (
            <div
              className={cn(
                'w-full p-4 border border-destructive bg-destructive/20 text-destructive rounded-md select-none',
                'animate-shake'
              )}
            >
              <p className="mb-3 font-medium">{`Verification failed: ${error}`}</p>
              <Button
                onClick={handleVerify}
                disabled={!token}
                variant="destructive"
                className="w-full transition-transform hover-lift hover-glow"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
