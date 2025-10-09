import { RoleRow } from '@/app/org/[id]/roles/page';
import { atom, useAtom } from 'jotai';

const createRoleAtom = atom(false);

const editRoleAtom = atom<{ open: boolean; role?: RoleRow | null }>({
  open: false,
  role: null,
});

export const useCreateRoleModal = () => {
  return useAtom(createRoleAtom);
};
export const useEditRoleModal = () => {
  return useAtom(editRoleAtom);
};

