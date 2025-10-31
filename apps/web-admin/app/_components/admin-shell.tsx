'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import { cn } from '@workspace/ui/lib/utils';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@workspace/ui/components/resizable';
import type { ImperativePanelHandle } from 'react-resizable-panels';
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from '@workspace/ui/components/tooltip';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Separator } from '@workspace/ui/components/separator';
import {
  LayoutDashboard,
  Building2,
  Users2,
  ShieldCheck,
  Mail,
  Settings,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@workspace/ui/components/avatar';
import { Label } from '@workspace/ui/components/label';
import Image from 'next/image';

const NAV = [
  { label: 'Dashboard', href: 'dashboard', icon: LayoutDashboard },
  { label: 'Organisations', href: 'organisation', icon: Building2 },
  { label: 'Members', href: 'members', icon: Users2 },
  { label: 'Roles', href: 'roles', icon: ShieldCheck },
  { label: 'Invites', href: 'invites', icon: Mail },
  { label: 'Settings', href: 'settings', icon: Settings },
];

const STORAGE_KEY = 'knw_admin_sidebar_v1';
const MIN_COLLAPSED = 6;
const MIN_EXPANDED = 16;
const MAX_EXPANDED = 32;

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const user = useSelector((s: RootState) => s.auth.user);
  const [collapsed, setCollapsed] = useState(false);
  const [size, setSize] = useState<number>(22);
  const [lastExpanded, setLastExpanded] = useState<number>(22);
  const [q, setQ] = useState('');
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const sidebarRef = useRef<ImperativePanelHandle | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const { collapsed: c, size: s, lastExpanded: le } = JSON.parse(raw);
      if (typeof c === 'boolean') setCollapsed(c);
      if (typeof s === 'number') setSize(s);
      if (typeof le === 'number') setLastExpanded(le);
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ collapsed, size, lastExpanded })
    );
  }, [collapsed, size, lastExpanded]);

  const { orgId } = useMemo(() => {
    const parts = pathname?.split('/') || [];
    const orgIndex = parts.indexOf('org');
    return { orgId: orgIndex !== -1 ? parts[orgIndex + 1] : '' };
  }, [pathname]);

  const isActive = (href: string) => {
    const full = `/org/${orgId}/${href}`;
    return pathname === full || pathname.startsWith(`${full}/`);
  };

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    router.push(`/admin/search?q=${encodeURIComponent(term)}`);
  }

  const toggleSidebar = () => {
    if (!sidebarRef.current) {
      setCollapsed((c) => !c);
      return;
    }

    if (collapsed) {
      const target = Math.min(
        Math.max(lastExpanded || 22, MIN_EXPANDED),
        MAX_EXPANDED
      );
      setCollapsed(false);
      requestAnimationFrame(() => {
        sidebarRef.current?.resize(target);
        setSize(target);
      });
    } else {
      setLastExpanded(Math.max(size, MIN_EXPANDED));
      setCollapsed(true);
      requestAnimationFrame(() => {
        sidebarRef.current?.resize(MIN_COLLAPSED);
        setSize(MIN_COLLAPSED);
      });
    }
  };

  if (!mounted) return <div className="h-screen w-screen overflow-hidden" />;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="h-screen w-screen overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Sidebar */}
          <ResizablePanel
            ref={sidebarRef}
            defaultSize={size}
            minSize={MIN_COLLAPSED}
            maxSize={MAX_EXPANDED}
            onResize={(n) => {
              if (!collapsed && n < MIN_EXPANDED) {
                requestAnimationFrame(() =>
                  sidebarRef.current?.resize(MIN_EXPANDED)
                );
                setSize(MIN_EXPANDED);
                return;
              }
              setSize(n);
              if (!collapsed && n >= MIN_EXPANDED) setLastExpanded(n);
            }}
            className={cn(
              'border-r bg-card transition-[flex-basis] duration-300 ease-out',
              collapsed && 'min-w-[64px]'
            )}
          >
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="h-14 flex items-center justify-between px-3 border-b">
                <Link href="dashboard" className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-primary/15 grid place-items-center">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  {!collapsed && (
                    <span className="relative block h-16 w-16 md:h-20 md:w-20">
                      {/* Light mode logo */}
                      <Image
                        src="/knwdle-light.svg"
                        alt="Knwdle"
                        fill
                        priority
                        className="object-contain dark:hidden"
                      />
                      {/* Dark mode logo */}
                      <Image
                        src="/knwdle-dark.svg"
                        alt="Knwdle"
                        fill
                        className="object-contain hidden dark:block"
                      />
                    </span>
                  )}
                </Link>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={toggleSidebar}
                  aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {collapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Search */}
              <div className={cn('p-3', collapsed && 'px-2')}>
                {!collapsed && (
                  <form onSubmit={onSearch}>
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search anything…"
                        className="pl-8"
                      />
                    </div>
                  </form>
                )}
              </div>

              <Separator />

              {/* Nav */}
              <nav className="flex-1 overflow-auto py-2">
                <ul className="space-y-1 px-2">
                  {NAV.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    const content = (
                      <div
                        className={cn(
                          'flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-all',
                          active
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'hover:bg-muted text-muted-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                      </div>
                    );
                    return (
                      <li key={item.href}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Label>
                              <Link href={item.href} className="w-full">
                                {content}
                              </Link>
                            </Label>
                          </TooltipTrigger>
                          {collapsed && (
                            <TooltipContent side="right">
                              {item.label}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <Separator />

              {/* Footer with Profile */}
              <div className="p-3">
                {!collapsed ? (
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/60 transition">
                    <Avatar className="h-8 w-8">
                      {/* {user?.avatarUrl ? (
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                      ) : ( */}
                      <AvatarFallback>
                        {user?.name
                          ?.split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase() || '?'}
                      </AvatarFallback>
                      {/* )} */}
                    </Avatar>
                    <div className="flex flex-col truncate">
                      <span className="text-sm font-medium truncate">
                        {user?.name || 'Unknown'}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {user?.email || '—'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex justify-center">
                        <Avatar className="h-8 w-8">
                          {/* {user?.avatarUrl ? (
                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                          ) : ( */}
                          <AvatarFallback>
                            {user?.name
                              ?.split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase() || '?'}
                          </AvatarFallback>
                          {/* )} */}
                        </Avatar>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {user?.name || 'Unknown'}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Main */}
          <ResizablePanel
            defaultSize={100 - size}
            minSize={collapsed ? 68 : 56}
            className="transition-[flex-basis] duration-300 ease-out"
          >
            <div className="h-full flex flex-col">
              <div className="h-14 shrink-0 border-b px-4 flex items-center justify-between bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40" />
              <div className="flex-1 overflow-auto">
                <div className="mx-auto container w-full p-4">{children}</div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </TooltipProvider>
  );
}
