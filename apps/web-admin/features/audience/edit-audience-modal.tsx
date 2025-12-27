'use client';

import { AppDispatch, RootState } from '@/store/store';
import { useParams } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useEditAudienceModal } from './use-audience.atom';
import {
  clearSelectedAudience,
  fetchAudience,
  updateAudience,
} from '@workspace/state';
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
import { Loader2 } from 'lucide-react';
import { Label } from '@workspace/ui/components/label';
import { Input } from '@workspace/ui/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Button } from '@workspace/ui/components/button';

const AUDIENCE_TYPES = [
  { label: 'Academic', value: 'ACADEMIC' },
  { label: 'Activity', value: 'ACTIVITY' },
] as const;

const EditAudienceModal = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { id: orgId = '' } = useParams<{ id: string }>() ?? {};

  const [state, setState] = useEditAudienceModal();
  const open = state.open;
  const audienceId = state.audienceId ?? null;

  const isEdit = Boolean(audienceId);

  const audience = useSelector((state: RootState) => state.audience.selected);

  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !orgId || !audienceId) return;

    dispatch(fetchAudience({ orgId, audienceId })).catch(() => {
      toast.error('Failed to load audience');
    });
  }, [open, orgId, audienceId, dispatch]);

  useEffect(() => {
    if (!open || !audience) return;

    setName(audience.name);
  }, [open, audience]);

  const close = useCallback(() => {
    setState({ open: false, audienceId: null });
    dispatch(clearSelectedAudience());
    setName('');
    setIsExclusive(false);
  }, [setState, dispatch]);

  const handleOpenChange = (v: boolean) => {
    if (!v) close();
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!orgId || !audience?.id) {
      toast.error('Missing audience context');
      return;
    }

    if (!name.trim()) {
      toast.error('Audience name is required');
      return;
    }

    const body: Record<string, any> = {};

    if (name.trim() !== audience.name) body.name = name.trim();

    if (Object.keys(body).length === 0) {
      toast.message('No changes to save');
      return;
    }

    try {
      setSaving(true);

      await dispatch(
        updateAudience({
          orgId,
          audienceId: audience.id,
          body,
        })
      ).unwrap();

      toast.success('Audience updated');
      close();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update audience');
    } finally {
      setSaving(false);
    }
  }

  const loading = open && (!audience || audience.id !== audienceId);

  if (loading) return;

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      <ModalContent size="md" blur separators stickyFooter>
        <ModalHeader>
          <ModalTitle>Edit audience</ModalTitle>
          <ModalDescription>
            Update audience details/ Type and hierarchy cannot by changed.
          </ModalDescription>
        </ModalHeader>

        <ModalBody>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading audience...
            </div>
          ) : (
            <form
              id="edit-audience-form"
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div>
                <Label className="text-sm font-medium">Audience Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div>
                <Label className="text-sm font-medium">Audience Type</Label>
                <Input
                  value={
                    audience?.type === 'ACADEMIC' ? 'Academic' : 'Activity'
                  }
                  readOnly
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Audience type cannot be changed after creation.
                </p>
              </div>

              {audience?.parentId && (
                <div>
                  <Label className="text-sm font-medium">Parent Audience</Label>
                  <Input value={'Inherited from hierarchy'} readOnly />
                  <p className="mt-1 text-xs text-muted-foreground">
                    This audience is part of a hierarchy and cannot be moved.
                  </p>
                </div>
              )}

              {audience?.type === 'ACADEMIC' && (
                <div>
                  <Label className="text-sm font-medium">
                    Student Exclusivity
                  </Label>
                  <Input
                    value={audience.isExclusive ? 'Yes (locked)' : 'No'}
                    readOnly
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Exclusivity is set at creation time and cannot be changed.
                  </p>
                </div>
              )}
            </form>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={close} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-audience-form"
            disabled={saving || loading}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditAudienceModal;
