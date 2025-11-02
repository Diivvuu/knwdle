'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { Lock, LayoutDashboard } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { UNIT_FEATURE_MAP } from '@workspace/ui/constants/unit-sidebar';

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
import { useUnitDashboardConfig } from '@/hooks/use-unit-dashboard-config';
import { useSelector } from 'react-redux';
import { selectUnitDashboardStatus } from '@workspace/state';
import { useEffect } from 'react';

export function UnitSidebar() {
  const { id : orgId, unitId } = useParams() as { id: string; unitId: string };
  const pathname = usePathname();
  const { config, loading, error } = useUnitDashboardConfig();
  const features = config?.features || [];
  const tables = config?.tables || [];

  const MAP = UNIT_FEATURE_MAP as Record<
    string,
    (typeof UNIT_FEATURE_MAP)[keyof typeof UNIT_FEATURE_MAP]
  >;

  const featureKeys = features
    .map((f: string) => f.replace('.enabled', ''))
    .filter((key: string) => MAP[key]);

  const NAV_ITEMS = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: 'dashboard',
      locked: false,
    },
    ...featureKeys.map((key) => ({
      ...MAP[key],
      locked: !tables.includes(key),
    })),
  ];

  const isActive = (path: string) =>
    pathname?.endsWith(path) || pathname?.includes(`/${path}`);

const status = useSelector(selectUnitDashboardStatus);
  useEffect(() => {
  console.log('org unit hook', config, status)

}, [config, status])
if (status === 'loading' || !config)
  return (
    <Sidebar className="border-r bg-card/80 backdrop-blur-sm">
      <SidebarContent>
        <div className="p-4 text-sm text-muted-foreground">Loading...</div>
      </SidebarContent>
    </Sidebar>
  );

if (status === 'failed' || error)
  return (
    <Sidebar className="border-r bg-card/80 backdrop-blur-sm">
      <SidebarContent>
        <div className="p-4 text-sm text-destructive">
          Failed to load config
        </div>
      </SidebarContent>
    </Sidebar>
  );

  return (
    <Sidebar className="border-r bg-card/80 backdrop-blur-sm">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {config.unitType || 'Unit'}{' '}
            <span className="text-xs text-muted-foreground ml-1">
              ({config.role})
            </span>
          </SidebarGroupLabel>

          <SidebarMenu>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              const href = `/org/${orgId}/units/${unitId}/${item.path}`;

              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      'flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-all',
                      active
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-muted text-muted-foreground',
                      item.locked && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <Link
                      href={item.locked ? '#' : href}
                      onClick={(e) => {
                        if (item.locked) {
                          e.preventDefault();
                          toast.info('You don’t have access to this feature.');
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      {item.locked && (
                        <Lock className="h-3.5 w-3.5 text-muted-foreground/60" />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>

        <Separator className="my-3" />

        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link
                href={`/org/${orgId}`}
                className="text-sm text-muted-foreground hover:underline"
              >
                ← Back to Organisation
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}