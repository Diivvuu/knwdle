// components/admin/AdminShell.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@workspace/ui/lib/utils';

import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@workspace/ui/components/resizable';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Separator } from '@workspace/ui/components/separator';
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from '@workspace/ui/components/tooltip';

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

const NAV = [
  { label: 'Dashboard', href: 'dashboard', icon: LayoutDashboard },
  { label: 'Organisations', href: 'orgs', icon: Building2 },
  { label: 'Members', href: 'members', icon: Users2 },
  { label: 'Roles', href: 'roles', icon: ShieldCheck },
  { label: 'Invites', href: 'invites', icon: Mail },
  { label: 'Settings', href: 'settings', icon: Settings },
];

const STORAGE_KEY = 'knw_admin_sidebar_v1';

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);
  const [size, setSize] = useState<number>(22); // percentage
  const [q, setQ] = useState('');
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // restore persisted state
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const { collapsed: c, size: s } = JSON.parse(raw);
      if (typeof c === 'boolean') setCollapsed(c);
      if (typeof s === 'number') setSize(s);
    } catch {}
  }, []);

  // persist
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ collapsed, size }));
  }, [collapsed, size]);

  const isActive = useMemo(
    () => (href: string) => (pathname?.startsWith(href) ? 'active' : ''),
    [pathname]
  );

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    router.push(`/admin/search?q=${encodeURIComponent(term)}`);
  }
  if (!mounted) {
    // avoid SSR markup that won’t match client IDs
    return <div className="h-screen w-screen overflow-hidden" />;
  }
  return (
    <TooltipProvider delayDuration={150}>
      <div className="h-screen w-screen overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Sidebar */}
          <ResizablePanel
            defaultSize={size}
            onResize={(n) => setSize(n)}
            minSize={collapsed ? 6 : 16}
            maxSize={32}
            className={cn('border-r bg-card', collapsed && 'min-w-[64px]')}
          >
            <div className="h-full flex flex-col">
              {/* Brand / collapse */}
              <div className="h-14 shrink-0 flex items-center justify-between px-3 border-b">
                <Link href="/admin/home" className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-primary/15 grid place-items-center">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  {!collapsed && (
                    <span className="font-semibold">Knwdle Admin</span>
                  )}
                </Link>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setCollapsed((c) => !c)}
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
                    const active = isActive(item.href) === 'active';
                    const inner = (
                      <div
                        className={cn(
                          'flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition',
                          active
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted'
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!collapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </div>
                    );
                    return (
                      <li key={item.href}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link href={item.href} className="block">
                              {inner}
                            </Link>
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

              {/* Footer */}
              <div className="p-3 text-xs text-muted-foreground">
                {!collapsed ? (
                  <div className="space-y-1">
                    <div className="font-medium text-foreground">Signed in</div>
                    <div className="opacity-80">Admin Console</div>
                    <div className="opacity-60">v0.1.0</div>
                  </div>
                ) : (
                  <div className="text-center opacity-70">v0.1.0</div>
                )}
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Main */}
          <ResizablePanel
            defaultSize={100 - size}
            minSize={collapsed ? 68 : 56}
          >
            <div className="h-full flex flex-col">
              {/* Top bar (breadcrumb/actions slot) */}
              <div className="h-14 shrink-0 border-b px-4 flex items-center justify-between bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
                <div className="text-sm text-muted-foreground" />
                <div className="flex items-center gap-2" />
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto">
                <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
                  {children}
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </TooltipProvider>
  );
}
