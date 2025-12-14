'use client';

import { AppDispatch, RootState } from '@/store/store';
import { useDispatch, useSelector } from 'react-redux';
import { useEditRoleModal } from './use-role-atom';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  listPermissions,
  resetUpdateStatus,
  updateRole,
} from '@workspace/state';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '@workspace/ui/components/modal';
import { Separator } from '@workspace/ui/components/separator';
import { Label } from '@workspace/ui/components/label';
import { Input } from '@workspace/ui/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Loader2 } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { Button } from '@workspace/ui/components/button';

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export default function EditRoleModal() {
  const dispatch = useDispatch<AppDispatch>();
  const [editState, setEditState] = useEditRoleModal();
  const { open, role } = editState;
  const { id: orgId } = useParams<{ id: string }>();

  const {
    items: permissions,
    status: permsStatus,
    error: permsError,
  } = useSelector((state: RootState) => state.roles.permissions);

  const updatingStatus = useSelector((state: RootState) =>
    role ? (state.roles.updateStatusById[role.id] ?? 'idle') : 'idle'
  );
  const updatingError = useSelector((state: RootState) =>
    role ? state.roles.updateErrorById[role.id] : undefined
  );

  const [form, setForm] = useState({
    name: '',
    key: '',
    scope: 'org' as 'org' | 'audience',
    selected: [] as string[],
  });

  useEffect(() => {
    if (!open || !role) return;
    setForm({
      name: role.name,
      key: role.key,
      scope: (role.scope as 'org' | 'audience') ?? 'org',
      selected: (role.permissions ?? []).map((rp) => rp.permission.code),
    });
  }, [open, role]);

  const perms = useMemo(() => permissions ?? [], [permissions]);

  useEffect(() => {
    if (!open || !orgId) return;
    if (permsStatus === 'idle' || permsStatus === 'failed') {
      dispatch(listPermissions({ orgId }));
    }
  }, [open, orgId, permsStatus, dispatch]);

  useEffect(() => {
    if (updatingStatus === 'succeeded' && role) {
      toast.success('Role updated successfully');
      setEditState({ open: false, role: null });
      dispatch(resetUpdateStatus({ roleId: role.id }));
    }
  }, [updatingStatus, role, dispatch, setEditState]);

  useEffect(() => {
    if (updatingStatus === 'failed' && updatingError) {
      toast.error(updatingError || 'Failed to update role');
    }
  }, [updatingStatus, updatingError]);

  const handleClose = useCallback(() => {
    setEditState({ open: false, role: null });
  }, [setEditState]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) handleClose();
    },
    [handleClose]
  );

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !role) return;

    dispatch(
      updateRole({
        orgId,
        roleId: role.id,
        name: form.name.trim(),
        scope: form.scope,
        permissionCodes: form.selected,
      })
    );
  };
  if (!open || !role) return null;

  const disabled =
    updatingStatus === 'loading' || !form.name.trim() || !form.scope;
  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      <ModalContent
        size="4xl"
        scroll="body"
        blur
        separators
        stickyFooter
        gradientHeader
      >
        <ModalHeader>
          <ModalTitle className="text-2xl font-semibold">Edit Role</ModalTitle>
          <ModalDescription>
            Update role name, scope, and permissions
          </ModalDescription>
        </ModalHeader>

        <Separator />

        <ModalBody>
          <motion.form
            id="edit-role-form"
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
          >
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Name</Label>
                <Input
                  placeholder="e.g. Content Manager"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      name: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Key</Label>
                <Input value={form.key} disabled className="bg-muted/50" />
                <p className="mt-1 text-xs text-muted-foreground">
                  Role keys are immutable. Create a new role if you need a
                  different key
                </p>
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
                      Audience-scope (e.g., class/department)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">
                  {form.scope === 'org'
                    ? 'Assignable across the entire organisation'
                    : 'Assignable within a specific audience (e.g., class, department).'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-medium">Permissions</Label>

              {permsStatus === 'loading' && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="animate-spin size-4" />
                  Loading permissions...
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

              {permsStatus === 'succeeded' && perms.length > 0 && (
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
                        >
                          <Checkbox
                            className="cursor-pointer"
                            checked={checked}
                            onCheckedChange={() =>
                              setForm((f) => ({
                                ...f,
                                selected: checked
                                  ? f.selected.filter((x) => x !== p.code)
                                  : [...f.selected, p.code],
                              }))
                            }
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
        <ModalFooter>
          <Button variant={'outline'} onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" form="edit-role-form" disabled={disabled}>
            {updatingStatus === 'loading' ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Updating
              </>
            ) : (
              'Update Role'
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
