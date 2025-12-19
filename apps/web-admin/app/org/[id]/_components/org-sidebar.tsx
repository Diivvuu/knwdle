'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@workspace/ui/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@workspace/ui/components/sidebar';
import { Separator } from '@workspace/ui/components/separator';
import {
  Building2,
  LayoutDashboard,
  Users2,
  ShieldCheck,
  Mail,
  Settings,
  Sparkles,
} from 'lucide-react';
import Image from 'next/image';
import { Label } from '@workspace/ui/components/label';

const NAV = [
  { label: 'Dashboard', href: 'dashboard', icon: LayoutDashboard },
  { label: 'Organisations', href: 'organisation', icon: Building2 },
  { label: 'Members', href: 'members', icon: Users2 },
  { label: 'Roles', href: 'roles', icon: ShieldCheck },
  { label: 'Invites', href: 'invites', icon: Mail },
  { label: 'Settings', href: 'settings', icon: Settings },
];

export function OrgSidebar() {
  const pathname = usePathname();

  // Extract orgId if present (e.g. /org/:id/xyz)
  const parts = pathname.split('/');
  const orgIndex = parts.indexOf('org');
  const orgPrefix =
    orgIndex !== -1 && parts.length > orgIndex + 1
      ? `/org/${parts[orgIndex + 1]}`
      : '';

  const buildHref = (href: string) =>
    orgPrefix ? `${orgPrefix}/${href}` : `/${href}`;

  return (
    <Sidebar
      className={
        cn()
        // use global sidebar color tokens directly
      }
    >
      <SidebarContent>
        {/* ─── Brand Header ─────────────────────────── */}
        <SidebarGroup>
          <div className="flex items-center gap-2 px-4 py-4 border-b border-[var(--sidebar-border)]/70">
            <div className="relative h-8 w-8 rounded-sm bg-[var(--primary)]/20 grid place-items-center shadow-sm">
              <Sparkles className="h-4 w-4 text-[var(--primary)]" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base tracking-tight text-foreground">
                Knwdle Admin
              </span>
              <span className="text-xs text-muted-foreground">
                Control Center
              </span>
            </div>
          </div>
        </SidebarGroup>

        {/* ─── Navigation Menu ───────────────────────── */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
            Navigation
          </SidebarGroupLabel>
          <SidebarMenu>
            {NAV.map((item, i) => {
              const Icon = item.icon;
              const href = buildHref(item.href);
              const active =
                pathname === href ||
                pathname.startsWith(`${href}/`) ||
                pathname.endsWith(item.href);

              return (
                <SidebarMenuItem key={item.href}>
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <SidebarMenuButton
                      asChild
                      className={cn(
                        'relative flex items-center gap-3 px-4 py-2.5 rounded-sm text-sm font-medium transition-all duration-200 group hover-lift',
                        active
                          ? 'bg-[var(--primary)]/15 text-[var(--primary)] shadow-[inset_0_0_0_1px_var(--primary)]'
                          : 'hover:bg-[var(--sidebar-accent)]/70 text-[var(--muted-foreground)]'
                      )}
                    >
                      <Link href={href}>
                        <Icon
                          className={cn(
                            'h-4 w-4 shrink-0 transition-transform duration-200',
                            active && 'scale-110'
                          )}
                        />
                        <Label>{item.label}</Label>
                        {active && (
                          <motion.div
                            layoutId="active-nav-indicator"
                            className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-[var(--primary)]"
                          />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </motion.div>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>

        {/* ─── Footer ─────────────────────────────── */}
        <Separator className="my-3" />
        <div className="px-4 pb-4 text-xs text-[var(--muted-foreground)] flex items-center justify-between">
          <span>© 2025 Knwdle</span>
          <Image
            src="/knwdle-light.svg"
            alt="Knwdle Logo"
            width={70}
            height={24}
            className="dark:hidden opacity-90"
          />
          <Image
            src="/knwdle-dark.svg"
            alt="Knwdle Logo"
            width={70}
            height={24}
            className="hidden dark:block opacity-80"
          />
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
