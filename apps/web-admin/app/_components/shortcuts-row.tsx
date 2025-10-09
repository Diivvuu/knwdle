'use client';
import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  FolderTree,
  ShieldCheck,
  Users2,
  Bell,
} from 'lucide-react';

export default function ShortcutsRow({ orgId }: { orgId: string }) {
  const Item = ({ title, desc, href, icon }: any) => (
    <Link
      href={href}
      className="group rounded-2xl border p-4 hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl border flex items-center justify-center">
          {icon}
        </div>
        <div className="flex-1">
          <div className="font-medium group-hover:underline">{title}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
        </div>
        <ArrowRight className="h-4 w-4 mt-1 opacity-70 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </Link>
  );
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Item
        title="Members Directory"
        desc="Browse and manage members"
        href={`/org/${orgId}/members`}
        icon={<Users2 className="h-5 w-5" />}
      />
      <Item
        title="Create Announcement"
        desc="Post an update"
        href={`/org/${orgId}/announcements/create`}
        icon={<Bell className="h-5 w-5" />}
      />
      <Item
        title="Manage Units"
        desc="Organise campuses, depts, classes"
        href={`/org/${orgId}/units`}
        icon={<FolderTree className="h-5 w-5" />}
      />
      <Item
        title="Roles & Permissions"
        desc="Assign fine-grained access"
        href={`/org/${orgId}/roles`}
        icon={<ShieldCheck className="h-5 w-5" />}
      />
    </div>
  );
}
