// apps/*/src/components/orgs/DeleteOrgModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/store/store';
import { toast } from 'sonner';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '@workspace/ui/components/modal';
import { useDeleteOrgModal } from './use-org-atom';
import { deleteOrg } from '@workspace/state';

export default function DeleteOrgModal() {
  const dispatch = useDispatch<AppDispatch>();
  const [state, setState] = useDeleteOrgModal();
  const { open, org } = state;

  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => setText(''), [open, org]);

  function onClose() {
    setState({ open: false, org: null });
  }

  const canDelete = org && text.trim() === org.name.trim();

  async function onConfirm() {
    if (!org) return;
    setLoading(true);
    try {
      await dispatch(deleteOrg(org.id)).unwrap();
      toast.success('Organisation deleted');
      onClose();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={(v) => (v ? setState({ ...state, open: v }) : onClose())}
    >
      <ModalContent size="md" blur separators stickyFooter>
        <ModalHeader>
          <ModalTitle className="text-destructive">
            Delete organisation
          </ModalTitle>
          <ModalDescription>
            This action is permanent. Type the organisation name to confirm.
          </ModalDescription>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-2">
            <Label>Organisation name</Label>
            <Input
              placeholder={org?.name || 'Organisation name'}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={!canDelete || loading}
          >
            {loading ? 'Deleting…' : 'Delete'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
