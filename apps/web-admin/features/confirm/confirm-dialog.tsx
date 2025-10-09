'use client';

import { useState } from 'react';
import { useConfirmDialog } from './use-confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { motion } from 'framer-motion';
import { Button } from '@workspace/ui/components/button';
import { Loader2 } from 'lucide-react';

export default function ConfirmDialog() {
  const { state, close, handleConfirm } = useConfirmDialog();
  const [loading, setLoading] = useState(false);

  if (!state.open) return null;
  const onConfirm = async () => {
    setLoading(true);
    await handleConfirm();
    setLoading(false);
  };

  return (
    <Dialog open={state.open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md backdrop-blur-xl border border-border/40 shadow-2xl bg-background/80">
        <DialogHeader>
          <DialogTitle>{state.title || 'Are you sure?'}</DialogTitle>
          {state.description && (
            <DialogDescription className="text-muted-foreground">
              {state.description}
            </DialogDescription>
          )}
        </DialogHeader>
        <motion.div
          className="mt-4 flex justify-end gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button variant={'outline'} onClick={close}>
            {state.cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            variant={'destructive'}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Processing...
              </>
            ) : (
              state.confirmText || 'Confirm'
            )}
          </Button>
        </motion.div>
        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}
