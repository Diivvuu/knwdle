'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store/store';
import { fetchOrgs } from '@workspace/state';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

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
  DialogTrigger,
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
import { OrgCard } from '@workspace/ui/components/mega-dashboard/org-card';
import { ADMIN_BASE } from '@/lib/env';

// If you exported this from @workspace/ui/dashboard, feel free to swap:
// import { OrgCard } from '@workspace/ui/dashboard'

// ---------------------- Local helpers ----------------------
function Section({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        {actions}
      </div>
      <Separator />
      {children}
    </section>
  );
}

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
        <Button size="sm" onClick={onAccept}>
          <Check className="mr-1 h-4 w-4" />
          Accept
        </Button>
        <Button size="sm" variant="outline" onClick={onDecline}>
          <X className="mr-1 h-4 w-4" />
          Decline
        </Button>
      </div>
    </motion.div>
  );
}

function JoinOrgDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    if (!code.trim()) {
      toast.error('Enter a valid join code');
      return;
    }
    setLoading(true);
    try {
      // minimal default: send user to a dedicated join page with ?code=
      router.push(`/join-org?code=${encodeURIComponent(code.trim())}`);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to join');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join an Organisation</DialogTitle>
          <DialogDescription>
            Paste the invite code you received from your organisation.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <label className="text-sm">Join code</label>
          <Input
            placeholder="e.g. KNW-9X42-ABCD"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleJoin} disabled={loading}>
            {loading ? 'Joining…' : 'Join'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------- Screen ----------------------
export function DashboardScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, listStatus } = useSelector((s: RootState) => s.org);

  // you can wire invites to your API later; keeping empty for now
  const invites: Array<{ id: string; orgName: string; role: string }> = [];

  const [openCreate, setOpenCreate] = useState(false);
  const [openJoin, setOpenJoin] = useState(false);

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
      {/* Header actions */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Your Organisations</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={() => setOpenJoin(true)}>
            <UserPlus2 className="mr-2 h-4 w-4" />
            Join Organisation
          </Button>
          <Button variant="outline" onClick={() => setOpenCreate(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Organisation
          </Button>
        </div>
      </div>

      {/* Search (lightweight) */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search organisations…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Invites */}
      <Section
        title="Invites"
        actions={
          invites.length > 0 ? (
            <Badge variant="secondary">{invites.length}</Badge>
          ) : null
        }
      >
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
      </Section>

      {/* Organisations */}
      <Section
        title="Organisations"
        actions={
          listStatus === 'loading' ? (
            <span className="text-xs text-muted-foreground">Loading…</span>
          ) : null
        }
      >
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
                <Button onClick={() => setOpenJoin(true)}>
                  <UserPlus2 className="mr-2 h-4 w-4" />
                  Join Organisation
                </Button>
                <Button variant="outline" onClick={() => setOpenCreate(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Organisation
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((org: any) => (
              <Link
                key={org.id}
                href={`${ADMIN_BASE}/org/${org.id}`}
                className="block"
              >
                <motion.div
                  whileHover={{
                    y: -2,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  }}
                  transition={{ type: 'spring', stiffness: 250, damping: 22 }}
                >
                  <OrgCard org={org} />
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </Section>

      {/* JOIN DIALOG */}
      <JoinOrgDialog open={openJoin} onOpenChange={setOpenJoin} />

      {(() => {
        const CreateOrgModal =
          require('../_components/create-org-modal').default;
        return (
          <CreateOrgModal open={openCreate} onOpenChange={setOpenCreate} />
        );
      })()}
    </div>
  );
}
