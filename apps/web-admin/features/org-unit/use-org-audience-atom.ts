'use client';

import { atom, useAtom } from 'jotai';

export type OrgAudienceRow = {
  id: string;
  name: string;
  code?: string | null;
  type?: string;
  parentId?: string | null;
  meta?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
};

export type OpenCreateAudiencePayload = {
  orgId: string;
  parentId?: string | null;
  presetType?: string;
};

const createAudienceAtom = atom<boolean | false>(false);

const editAudienceAtom = atom<{
  open: boolean;
  audience?: OrgAudienceRow | null;
}>({
  open: false,
  audience: null,
});

export const useCreateAudienceModal = () => useAtom(createAudienceAtom);
export const useEditAudienceModal = () => useAtom(editAudienceAtom);
