import { Org } from '@workspace/state';
import { atom, useAtom } from 'jotai';

type ModalState = { open: boolean; org: Org | null };

const createOrgAtom = atom(false);
const joinOrgAtom = atom(false);
const editOrgAtom = atom<ModalState>({ open: false, org: null });
const deleteOrgAtom = atom<ModalState>({ open: false, org: null });

export const useCreateOrgModal = () => {
  return useAtom(createOrgAtom);
};

export const useJoinOrgModal = () => {
  return useAtom(joinOrgAtom);
};

export const useEditOrgModal = () => {
  return useAtom(editOrgAtom);
};

export const useDeleteOrgModal = () => {
  return useAtom(deleteOrgAtom);
};
