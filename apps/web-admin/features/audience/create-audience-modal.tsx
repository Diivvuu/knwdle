'use client';

import { AppDispatch } from '@/store/store';
import { useParams } from 'next/navigation';
import React, { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useCreateAudienceModal } from './use-audience.atom';
import { toast } from 'sonner';
import { createAudience } from '@workspace/state';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '@workspace/ui/components/modal';
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
import { Loader2 } from 'lucide-react';

const AUDIENCE_TYPES = [
  { label: 'Academic', value: 'ACADEMIC' },
  { label: 'Activity', value: 'ACTIVITY' },
];

const CreateAudienceModal = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { id: orgId = '' } = useParams<{ id: string }>() ?? {};

  //global state
  const [open, setOpen] = useCreateAudienceModal();
  console.log(open);
  //local state
  const [name, setName] = useState('');
  const [type, setType] = useState<'ACADEMIC' | 'ACTIVITY'>('ACADEMIC');
  const [saving, setSaving] = useState(false);

  //handlers
  const close = useCallback(() => {
    setOpen(false);
    setName('');
    setType('ACADEMIC');
  }, [setOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!orgId) {
      toast.error('Missing organisation context.');
      return;
    }

    if (!name.trim()) {
      toast.error('Audience name is required');
      return;
    }

    try {
      setSaving(true);

      await dispatch(
        createAudience({
          orgId,
          body: {
            name: name.trim(),
            type,
          },
        })
      ).unwrap();

      toast.success('Audience created');
      close();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create audience');
    } finally {
      setSaving(false);
    }
  }

  //render
  return (
    <Modal open={open} onOpenChange={(v) => !v && close()}>
      <ModalContent size="md" blur separators stickyFooter>
        <ModalHeader>
          <ModalTitle>Create Audience</ModalTitle>
          <ModalDescription>
            Create a new audience within this organisation.
          </ModalDescription>
        </ModalHeader>
        <ModalBody>
          <form
            id="create-audience-form"
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div>
              <Label className="text-sm font-medium">Audience Name</Label>
              <Input
                placeholder="e.g. Class 8A"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Audience Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                Academic audiences are exclusive for students.
              </p>
            </div>
          </form>
        </ModalBody>

        <ModalFooter>
          <Button variant={'outline'} onClick={close} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="create-audience-form" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Audience'
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateAudienceModal;
