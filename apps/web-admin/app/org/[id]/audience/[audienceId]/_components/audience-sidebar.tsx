'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@workspace/ui/lib/utils';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useMemo } from 'react';
import { AppDispatch, RootState } from '@/store/store';
import { fetchAudience } from '@workspace/state';
import { Button } from '@workspace/ui/components/button';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@workspace/ui/components/sidebar';
import { Separator } from '@workspace/ui/components/separator';
import {
  LayoutDashboard,
  Users2,
  ClipboardCheck,
  CalendarRange,
  BookOpen,
  BookText,
  NotebookPen,
  Megaphone,
  FileCheck,
  Wallet2,
  BarChart3,
  Settings,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import Image from 'next/image';
import { Label } from '@workspace/ui/components/label';

type NavItem = { label: string; href: string; icon: any };

export function AudienceSidebar() {
  const pathname = usePathname();
  const params = useParams<{ id: string; audienceId: string }>() ?? {};
  const orgId = params.id ?? '';
  const audienceId = params.audienceId ?? '';
  const dispatch = useDispatch<AppDispatch>();

  const audience = useSelector((s: RootState) => s.audience.selected);

  // ensure we have audience context for type/name
  useEffect(() => {
    if (!orgId || !audienceId) return;
    if (!audience || audience.id !== audienceId) {
      dispatch(fetchAudience({ orgId, audienceId }));
    }
  }, [dispatch, orgId, audienceId, audience?.id]);

  const base =
    orgId && audienceId ? `/org/${orgId}/audience/${audienceId}` : '';

  const type = audience?.type ?? 'ACADEMIC';

  const sections: { title: string; items: NavItem[] }[] = useMemo(() => {
    const common: { title: string; items: NavItem[] }[] = [
      {
        title: 'Audience',
        items: [
          { label: 'Overview', href: base || '#', icon: LayoutDashboard },
          { label: 'Members', href: base ? `${base}/members` : '#', icon: Users2 },
        ],
      },
      {
        title: 'Attendance',
        items: [
          { label: 'Attendance', href: base ? `${base}/attendance` : '#', icon: ClipboardCheck },
          { label: 'Timetable', href: base ? `${base}/timetable` : '#', icon: CalendarRange },
        ],
      },
      {
        title: 'Content',
        items: [
          { label: 'Notes', href: '#', icon: BookOpen },
          { label: 'Assignments', href: '#', icon: BookText },
          { label: 'Announcements', href: '#', icon: Megaphone },
        ],
      },
      {
        title: 'Finance',
        items: [{ label: 'Fees', href: '#', icon: Wallet2 }],
      },
      {
        title: 'Insights',
        items: [{ label: 'Analytics / Reports', href: '#', icon: BarChart3 }],
      },
      {
        title: 'Settings',
        items: [{ label: 'Settings', href: '#', icon: Settings }],
      },
    ];

    if (type === 'ACADEMIC') {
      // Insert exams/results section for academic audiences
      common.splice(3, 0, {
        title: 'Exams & Results',
        items: [
          { label: 'Tests', href: '#', icon: NotebookPen },
          { label: 'Results', href: '#', icon: FileCheck },
        ],
      });
    }

    return common;
  }, [base, orgId, type]);

  const isActive = (href: string, isOverview: boolean) => {
    if (!href.startsWith('/')) return false;
    if (isOverview) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center gap-2 px-4 py-4 border-b border-[var(--sidebar-border)]/70">
            <Link href={orgId ? `/org/${orgId}/audience` : '#'}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="relative h-8 w-8 rounded-sm bg-[var(--primary)]/20 grid place-items-center shadow-sm">
              <Sparkles className="h-4 w-4 text-[var(--primary)]" />
            </div>
              <div className="flex flex-col">
                <span className="font-semibold text-base tracking-tight text-foreground">
                  {audience?.name || 'Audience'}
                </span>
                <span className="text-xs text-muted-foreground capitalize">
                  {type === 'ACADEMIC' ? 'Academic audience' : 'Activity audience'}
                </span>
              </div>
            </div>
          </SidebarGroup>

        {sections.map((section, sectionIdx) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel className="px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
              {section.title}
            </SidebarGroupLabel>
            <SidebarMenu>
              {section.items.map((item, i) => {
                const Icon = item.icon;
                const active = isActive(item.href, item.label === 'Overview');
                return (
                  <SidebarMenuItem key={item.label}>
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: sectionIdx * 0.05 + i * 0.03 }}
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
                        <Link href={item.href}>
                          <Icon
                            className={cn(
                              'h-4 w-4 shrink-0 transition-transform duration-200',
                              active && 'scale-110'
                            )}
                          />
                          <Label>{item.label}</Label>
                          {active && (
                            <motion.div
                              layoutId="audience-active-nav-indicator"
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
        ))}

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
