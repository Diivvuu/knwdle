// app/org/[id]/page.tsx
'use client'
import { redirect } from 'next/navigation'

// ✅ Make function async and await params (Next.js 15 requires this)
export default async function OrgIndex({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/org/${id}/dashboard`)
}