// app/org/[id]/organisation/page.tsx
'use client';
import { useParams } from 'next/navigation';
import UnitsLayout from './_features/units-layout';

export default function OrganisationPage() {
  const { id } = useParams<{ id: string }>();
  return <UnitsLayout orgId={id!} />;
}
