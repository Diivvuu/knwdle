import { atom, useAtom } from 'jotai';

const addAudienceMemberAtom = atom(false);

export const useAddAudienceMemberModal = () => {
  return useAtom(addAudienceMemberAtom);
};
