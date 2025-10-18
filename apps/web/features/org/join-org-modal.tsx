'use client';

import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '@workspace/ui/components/modal';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { useJoinOrgModal } from './use-org-atom';
import { Label } from '@workspace/ui/components/label';

export default function JoinOrgModal() {
  const router = useRouter();
  const [open, setOpen] = useJoinOrgModal();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    if (!code.trim()) {
      toast.error('Enter a valid join code');
      return;
    }
    setLoading(true);
    try {
      router.push(`/join-org?code=${encodeURIComponent(code.trim())}`);
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to join');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalContent size="lg" blur separators stickyFooter>
        <ModalHeader>
          <ModalTitle>Join an Organisation</ModalTitle>
          <ModalDescription>
            Paste the invite code you received from your organisation.
          </ModalDescription>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-2">
            <Label className="mb-1">Join code</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="e.g. KNW-9X42-ABCD"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoFocus
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleJoin} disabled={loading}>
            {loading ? 'Joining…' : 'Join'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
