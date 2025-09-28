'use client';
// app/(public)/auth/page.tsx
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { motion } from 'framer-motion';

// CSR-only AuthScreen; avoids hydration mismatches from extensions/Radix/RHF
const AuthScreen = dynamic(() => import('@/_components/auth-screen'), {
  ssr: false,
  loading: () => <div className="p-8 text-center">Loading…</div>,
});

export default function Page() {
  return (
    <div className="grid min-h-[calc(100dvh-80px)] h-full grid-cols-1 md:grid-cols-2">
      {/* Auth form first on mobile, left/right on desktop */}
      <section className="order-1 flex h-full items-center justify-center p-4 md:order-none">
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full max-w-md h-full"
        >
          <AuthScreen />
        </motion.div>
      </section>

      {/* Illustration: below form on mobile, side-by-side on desktop */}
      <aside className="relative order-2 block md:order-none md:block">
        <div className="absolute inset-0 m-auto w-[75%] max-w-[640px]">
          <Image
            src="/auth.svg"
            alt="Secure sign-in"
            fill
            priority
            className="object-contain"
          />
        </div>
      </aside>
    </div>
  );
}
