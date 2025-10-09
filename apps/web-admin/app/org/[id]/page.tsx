// app/org/[id]/page.tsx
import { redirect } from 'next/navigation';
export default function OrgIndex({ params }: { params: { id: string } }) {
  redirect(`/org/${params.id}/dashboard`);
}
