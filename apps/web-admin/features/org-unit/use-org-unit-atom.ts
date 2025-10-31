'use client';

import { atom, useAtom } from 'jotai';

export type OrgUnitRow = {
  id: string;
  name: string;
  code?: string | null;
  type?: string;
  parentId?: string | null;
  meta?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
};

export type OpenCreateUnitPayload = {
  orgId: string;
  parentId?: string | null;
  presetType?: string;
};

const createUnitAtom = atom<boolean | false>(false);

const editUnitAtom = atom<{ open: boolean; unit?: OrgUnitRow | null }>({
  open: false,
  unit: null,
});

export const useCreateUnitModal = () => useAtom(createUnitAtom);
export const useEditUnitModal = () => useAtom(editUnitAtom);
