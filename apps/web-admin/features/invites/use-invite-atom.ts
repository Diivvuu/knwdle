'use client';

import { ParentRole } from '@workspace/state';
import { atom, useAtom } from 'jotai';

export type InviteModalData = {
  id: string;
  orgId: string;
  email: string;
  role: ParentRole;
  unitId: string | null;
  joinCode: string | null;
  expiresAt: string;
  acceptedBy: string | null;
  createdAt: string;
};

const addInviteAtom = atom(false);
const editInviteAtom = atom<{ open: boolean; invite: InviteModalData | null }>({
  open: false,
  invite: null,
});

export const useAddInviteModal = () => useAtom(addInviteAtom);
export const useEditInviteModal = () => useAtom(editInviteAtom);
