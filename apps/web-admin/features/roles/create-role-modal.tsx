'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';

import type { AppDispatch, RootState } from '@/store/store';

import {
  createRole,
  listPermissions,
  resetCreateStatus,
} from '@workspace/state';

import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '@workspace/ui/components/modal';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { Label } from '@workspace/ui/components/label';
import { Separator } from '@workspace/ui/components/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { cn } from '@workspace/ui/lib/utils';
import { Loader2 } from 'lucide-react';
import { useCreateRoleModal } from '@/features/roles/use-role-atom';

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export default function CreateRoleModal() {
  const dispatch = useDispatch<AppDispatch>();
  const [open, setOpen] = useCreateRoleModal(); // Jotai source of truth
  const { id: orgId } = useParams<{ id: string }>();

  const {
    items: permissions,
    status: permsStatus,
    error: permsError,
  } = useSelector((s: RootState) => s.roles.permissions);
  const createStatus = useSelector((s: RootState) => s.roles.createStatus);

  const [keyTouched, setKeyTouched] = useState(false);

  const [form, setForm] = useState({
    name: '',
    key: '',
    scope: 'org',
    parentRole: 'staff',
    selected: [] as string[],
  });

  const perms = useMemo(() => permissions ?? [], [permissions]);

  // Fetch permissions when opened and missing/failed
  useEffect(() => {
    if (!open || !orgId) return;
    if (permsStatus === 'idle' || permsStatus === 'failed') {
      dispatch(listPermissions({ orgId }));
    }
  }, [open, orgId, permsStatus, dispatch]);

  // Close + reset after create
  useEffect(() => {
    if (createStatus === 'succeeded') {
      toast.success('Role created successfully');
      setOpen(false);
      dispatch(resetCreateStatus());
      setForm({
        name: '',
        key: '',
        scope: 'org',
        parentRole: 'staff',
        selected: [],
      });
    }
  }, [createStatus, dispatch, setOpen]);

  const togglePerm = useCallback(
    (code: string) =>
      setForm((f) => ({
        ...f,
        selected: f.selected.includes(code)
          ? f.selected.filter((x) => x !== code)
          : [...f.selected, code],
      })),
    []
  );

  const handleClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) handleClose();
    },
    [handleClose]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return toast.error('Invalid organisation ID');

    dispatch(
      createRole({
        orgId,
        name: form.name.trim(),
        key: form.key.trim(),
        scope: form.scope,
        permissionCodes: form.selected, // string[]
      })
    );
  };

  const slug = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');

  const disabled =
    createStatus === 'loading' || !form.name.trim() || !form.key.trim();

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      <ModalContent
        size="3xl"
        scroll="body"
        blur
        separators
        stickyFooter
        gradientHeader
      >
        {/* Header */}
        <ModalHeader>
          <ModalTitle>Create Role</ModalTitle>
          <ModalDescription>
            Define access levels and permissions for this role.
          </ModalDescription>
        </ModalHeader>

        <Separator />

        {/* Body */}
        <ModalBody>
          <motion.form
            id="create-role-form"
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
          >
            {/* Left: basics */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Name</Label>
                <Input
                  placeholder="e.g. Content Manager"
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setForm((f) => ({
                      ...f,
                      name,
                      key: keyTouched ? f.key : slug(name),
                    }));
                  }}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Key</Label>
                <Input
                  placeholder="content_manager"
                  value={form.key}
                  onChange={(e) => {
                    setKeyTouched(true);
                    setForm((f) => ({ ...f, key: e.target.value }));
                  }}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Scope</Label>
                <Select
                  value={form.scope}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, scope: v as 'org' | 'audience' }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="org">Organisation wide</SelectItem>
                    <SelectItem value="audience">
                      Audience-scoped (e.g., class/department)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">
                  {form.scope === 'org'
                    ? 'This role can be assigned across the entire organisation'
                    : 'This role can be assigned within a specific audience (e.g., class, department) during member asisgnment.'}
                </p>
              </div>
            </div>

            {/* Right: permissions */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Permissions</Label>

              {permsStatus === 'loading' && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading permissions…
                </div>
              )}

              {permsStatus === 'failed' && (
                <div className="text-sm text-destructive">
                  Failed to load permissions: {permsError}
                </div>
              )}

              {permsStatus === 'succeeded' && perms.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  No permissions available. You might need additional access.
                </div>
              )}

              {permsStatus === 'succeeded' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-2">
                  <AnimatePresence initial={false}>
                    {perms.map((p) => {
                      const checked = form.selected.includes(p.code);
                      return (
                        <motion.div
                          key={p.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className={cn(
                            'flex items-start gap-3 rounded-md border p-2 transition-colors',
                            checked
                              ? 'bg-primary/10 border-primary/40'
                              : 'hover:bg-muted'
                          )}
                          // onClick={(e) => {
                          //   // don’t let this bubble to the overlay/portal
                          //   e.stopPropagation();
                          //   togglePerm(p.code);
                          // }}
                        >
                          <Checkbox
                            className="cursor-pointer"
                            checked={checked}
                            onCheckedChange={() => togglePerm(p.code)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium leading-tight break-words">
                              {p.name}
                            </div>
                            <div className="text-xs text-muted-foreground break-words">
                              {p.code}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.form>
        </ModalBody>
        {/* Footer */}

        <ModalFooter>
          <Button variant="outline" onClick={() => handleClose()}>
            Cancel
          </Button>
          <Button type="submit" form="create-role-form" disabled={disabled}>
            {createStatus === 'loading' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating…
              </>
            ) : (
              'Create Role'
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
