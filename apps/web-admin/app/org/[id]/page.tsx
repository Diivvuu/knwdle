'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OrgIndex() {
  const {id} =  useParams()
  const router = useRouter();
  useEffect(() => {
    if (id) {
      router.replace(`/org/${id}/dashboard`);
    }
  }, [ router]);

  return null; // or a spinner
}
