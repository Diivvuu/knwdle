import { RoleRow } from '@/app/org/[id]/roles/page';
import { atom, useAtom } from 'jotai';

const createMemberAtom = atom(false);

const editMemberAtom = atom<{ open: boolean; memberId?: string | null }>({
  open: false,
  memberId: null,
});

export const useCreateMemberModal = () => {
  return useAtom(createMemberAtom);
};
export const useEditMemberModal = () => {
  return useAtom(editMemberAtom);
};

