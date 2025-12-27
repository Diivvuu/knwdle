import { atom, useAtom } from 'jotai';

const createAudienceAtom = atom(false);

const editAudienceAtom = atom<{ open: boolean; audienceId?: string | null }>({
  open: false,
  audienceId: null,
});

export const useCreateAudienceModal = () => {
  return useAtom(createAudienceAtom);
};

export const useEditAudienceModal = () => {
  return useAtom(editAudienceAtom);
};
