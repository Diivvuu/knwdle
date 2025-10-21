'use client';

import { atom, useAtom } from 'jotai';
import { ReactNode, useCallback } from 'react';
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalBody,
} from '@workspace/ui/components/modal';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { Label } from '@workspace/ui/components/label';
import { Loader2 } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { useState } from 'react';

type TypeToConfirmState = {
  open: boolean;
  title?: string;
  description?: ReactNode;
  label?: string;
  expectedText?: string; // what the user must type (org name)
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm?: () => void | Promise<void>;
};

const stateAtom = atom<TypeToConfirmState>({
  open: false,
  title: 'Are you absolutely sure?',
  description: '',
  label: undefined,
  expectedText: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  destructive: true,
});

export function useTypeToConfirm() {
  const [state, setState] = useAtom(stateAtom);

  const openConfirm = useCallback(
    (opts: Omit<TypeToConfirmState, 'open'>) => {
      setState({ ...opts, open: true });
    },
    [setState]
  );

  const close = useCallback(() => {
    setState((s) => ({ ...s, open: false }));
  }, [setState]);

  return { state, openConfirm, close };
}

export function TypeToConfirmDialog() {
  const [state, setState] = useAtom(stateAtom);
  const [typed, setTyped] = useState('');
  const [loading, setLoading] = useState(false);

  if (!state.open) return null;

  const matches =
    (state.expectedText || '').trim().toLowerCase() ===
    typed.trim().toLowerCase();

  const onConfirm = async () => {
    if (!state.onConfirm) return;
    try {
      setLoading(true);
      await state.onConfirm();
    } finally {
      setLoading(false);
      setState((s) => ({ ...s, open: false }));
      setTyped('');
    }
  };

  return (
    <Modal
      open={state.open}
      onOpenChange={(o) => !o && setState((s) => ({ ...s, open: false }))}
    >
      <ModalContent size="md" blur separators className="sm:max-w-lg">
        <ModalHeader>
          <ModalTitle>{state.title}</ModalTitle>
          {state.description ? (
            <ModalDescription className="text-muted-foreground">
              {state.description}
            </ModalDescription>
          ) : null}
        </ModalHeader>

        <ModalBody>
          <div className="space-y-2 mt-2">
            {state.expectedText ? (
              <>
                <Label htmlFor="confirm-input">
                  {state.label ?? `Please type "${state.expectedText}" to confirm`}
                </Label>
                <Input
                  id="confirm-input"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder={state.expectedText}
                  className={cn(
                    'h-11',
                    typed.length > 0 && !matches && 'ring-2 ring-destructive/20 border-destructive'
                  )}
                  autoFocus
                />
                {!matches && typed.length > 0 && (
                  <p className="text-xs text-muted-foreground">Name does not match.</p>
                )}
              </>
            ) : null}
          </div>
        </ModalBody>

        <ModalFooter className="mt-2">
          <Button
            variant="outline"
            onClick={() => setState((s) => ({ ...s, open: false }))}
            disabled={loading}
          >
            {state.cancelText || 'Cancel'}
          </Button>
          <Button onClick={onConfirm} disabled={!matches || loading} variant={state.destructive ? 'destructive' : 'default'}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Processing...
              </>
            ) : (
              state.confirmText || 'Confirm'
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
