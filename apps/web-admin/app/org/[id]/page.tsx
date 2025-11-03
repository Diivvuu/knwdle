'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OrgIndex({ params }: { params: { id: string } }) {
  const router = useRouter();
  useEffect(() => {
    if (params?.id) {
      router.replace(`/org/${params.id}/dashboard`);
    }
  }, [params, router]);

  return null; // or a spinner
}
