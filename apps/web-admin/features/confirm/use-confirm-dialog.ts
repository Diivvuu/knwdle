import { atom, useAtom } from 'jotai';
import { ReactNode } from 'react';

type ConfirmState = {
  open: boolean;
  title?: string;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
};

const confirmAtom = atom<ConfirmState>({
  open: false,
  title: '',
  description: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  onConfirm: undefined,
});

export const useConfirmDialog = () => {
  const [state, setState] = useAtom(confirmAtom);

  const confirm = (opts: Omit<ConfirmState, 'open'>) => {
    setState({ ...opts, open: true });
  };

  const close = () => setState((s) => ({ ...s, open: false }));

  const handleConfirm = async () => {
    try {
      if (state.onConfirm) await state.onConfirm();
    } finally {
      close();
    }
  };

  return {
    confirm,
    close,
    state,
    handleConfirm,
  };
};
