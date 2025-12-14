'use client';

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalBody,
} from '@workspace/ui/components/modal';
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from '@workspace/ui/components/alert';
import { useCreateAudienceModal } from './use-org-audience-atom';

export default function CreateOrgAudienceModal() {
  const [open, setOpen] = useCreateAudienceModal();

  return (
    <Modal open={open} onOpenChange={() => setOpen(false)}>
      <ModalContent size="lg">
        <ModalHeader>
          <ModalTitle>Organisation audiences removed</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <Alert>
            <AlertTitle>Not available</AlertTitle>
            <AlertDescription>
              Organisation audiences have been replaced by the new audiences
              model. Audience creation is disabled.
            </AlertDescription>
          </Alert>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
