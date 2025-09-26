import AuthScreen from '@/_components/auth-screen';
import React, { Suspense } from 'react';

const page = () => {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
      <AuthScreen />
    </Suspense>
  );
};

export default page;
