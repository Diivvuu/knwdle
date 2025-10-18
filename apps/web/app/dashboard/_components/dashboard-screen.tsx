'use client';

import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store/store';
import { fetchOrgs } from '@workspace/state';
import { motion } from 'framer-motion';

import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Separator } from '@workspace/ui/components/separator';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@workspace/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@workspace/ui/components/dialog';
import { Badge } from '@workspace/ui/components/badge';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { toast } from 'sonner';

import {
  Building2,
  UserPlus2,
  PlusCircle,
  Inbox,
  Mail,
  Check,
  X,
  Search,
} from 'lucide-react';
import OrgRow from './org-row';
import {
  useCreateOrgModal,
  useJoinOrgModal,
} from '@/features/org/use-org-atom';

/* ---------------------- small helpers (unchanged) ---------------------- */
function EmptyInvites() {
  return (
    <Card className="shadow-sm">
      <CardContent className="py-6 flex items-center gap-3 text-muted-foreground">
        <Inbox className="h-5 w-5" />
        <div className="space-y-1">
          <div className="text-sm font-medium">No invites yet</div>
          <div className="text-xs">
            Ask your organisation admin to invite you via email or share a join
            code.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InviteRow({
  orgName,
  role,
  onAccept,
  onDecline,
}: {
  orgName: string;
  role: string;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 250, damping: 22 }}
      className="flex items-center justify-between rounded-lg border bg-muted/40 p-3"
    >
      <div className="flex items-center gap-3">
        <Mail className="h-4 w-4 text-muted-foreground" />
        <div>
          <div className="text-sm font-medium">{orgName}</div>
          <div className="text-xs text-muted-foreground">
            Invited as <span className="capitalize">{role}</span>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={onAccept} className="gap-1">
          <Check className="h-4 w-4" />
          Accept
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onDecline}
          className="gap-1"
        >
          <X className="h-4 w-4" />
          Decline
        </Button>
      </div>
    </motion.div>
  );
}

export function DashboardScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, listStatus } = useSelector((s: RootState) => s.org);

  // keep your future invites wiring; just not in the main feed anymore
  const invites: Array<{ id: string; orgName: string; role: string }> = [];

  const [openCreate, setOpenCreate] = useCreateOrgModal();
  const [openJoin, setOpenJoin] = useJoinOrgModal();
  const [openInvites, setOpenInvites] = useState(false);

  const [query, setQuery] = useState('');

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((o: any) =>
      [o.name, o.type, o.profile?.meta?.focusArea]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [items, query]);

  useEffect(() => {
    if (listStatus === 'idle') dispatch(fetchOrgs());
  }, [dispatch, listStatus]);

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header toolbar: title + search + actions */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">
            Your Organisations
          </h1>
          <p className="text-sm text-muted-foreground">
            Focused view — invites moved into a quick panel.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          {/* search lives in the header now */}
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search organisations…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {/* primary actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setOpenInvites(true)}
              className="gap-2"
            >
              Invites
              {invites.length > 0 && (
                <Badge variant="secondary">{invites.length}</Badge>
              )}
            </Button>
            <Button onClick={() => setOpenJoin(true)} className="gap-2">
              <UserPlus2 className="h-4 w-4" />
              Join
            </Button>
            <Button
              variant="outline"
              onClick={() => setOpenCreate(true)}
              className="gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Create
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Organisations only (clean main area) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            Organisations
          </h2>
          {listStatus === 'loading' && (
            <span className="text-xs text-muted-foreground">Loading…</span>
          )}
        </div>
        <Separator />

        {listStatus === 'loading' ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-24 w-full" />
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-2/3" />
                  <div className="mt-2 flex gap-2">
                    <Skeleton className="h-5 w-12 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <Card className="text-center py-16 border-dashed">
            <CardContent className="flex flex-col items-center gap-4">
              <Building2 className="h-10 w-10 text-muted-foreground" />
              <div className="space-y-1">
                <div className="text-base font-medium">
                  You’re not part of any organisations yet
                </div>
                <div className="text-sm text-muted-foreground">
                  Join an existing organisation or create a new one.
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setOpenJoin(true)} className="gap-2">
                  <UserPlus2 className="h-4 w-4" />
                  Join Organisation
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setOpenCreate(true)}
                  className="gap-2"
                >
                  <PlusCircle className="h-4 w-4" />
                  Create Organisation
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((org: any, idx: number) => (
              <motion.div
                key={org.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.03, 0.2) }}
                className="group"
              >
                <div className="transition-transform duration-200 group-hover:-translate-y-0.5">
                  <OrgRow
                    org={org}
                    onQuickEdit={(o) => {
                      console.log('quick edit', o.id);
                    }}
                    onDelete={(o) => {
                      console.log('delete', o.id);
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* INVITES DIALOG (moved out of main flow) */}
      <Dialog open={openInvites} onOpenChange={setOpenInvites}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Invites</DialogTitle>
            <DialogDescription>
              Review pending invitations to join organisations.
            </DialogDescription>
          </DialogHeader>

          {invites.length === 0 ? (
            <EmptyInvites />
          ) : (
            <div className="space-y-3">
              {invites.map((i) => (
                <InviteRow
                  key={i.id}
                  orgName={i.orgName}
                  role={i.role}
                  onAccept={() => toast.success('Accepted (wire API)')}
                  onDecline={() => toast('Declined (wire API)')}
                />
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenInvites(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* JOIN DIALOG (unchanged logic) */}
    </div>
  );
}
