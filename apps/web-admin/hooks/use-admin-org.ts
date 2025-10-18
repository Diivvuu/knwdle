import { AppDispatch, RootState } from '@/store/store';
import {
  assignCustomRole,
  clearMembersPage,
  createOrgUnit,
  deleteOrgUnit,
  fetchOrgBasic,
  fetchOrgSummary,
  fetchOrgUnits,
  fetchOrgUnitsTree,
  listMembers,
  ParentRole,
  updateMemberBaseRole,
  updateMemberUnit,
  updateOrgUnit,
} from '@workspace/state';
import { useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export function useAdminOrg(orgId: string) {
  const dispatch = useDispatch<AppDispatch>();
  const basic = useSelector((state: RootState) =>
    orgId ? state.orgAdmin.basicById[orgId] : undefined
  );
  const summary = useSelector((state: RootState) =>
    orgId ? state.orgAdmin.summaryById[orgId] : undefined
  );
  const units = useSelector((state: RootState) =>
    orgId ? state.orgUnit.unitsByOrg[orgId] : undefined
  );
  const unitsTree = useSelector((state: RootState) =>
    orgId ? state.orgUnit.unitsTreeByOrg[orgId] : undefined
  );

  useEffect(() => {
    if (!orgId) return;
    if (!basic?.data && basic?.status !== 'loading') {
      dispatch(fetchOrgBasic(orgId));
    }
    if (!summary?.data && summary?.status !== 'loading') {
      dispatch(fetchOrgSummary(orgId));
    }
    if (!units?.items?.length && units?.status !== 'loading') {
      dispatch(fetchOrgUnits(orgId));
    }
  }, [orgId, basic?.status, summary?.status, units?.status, dispatch]);

  const refresh = {
    basic: () => orgId && dispatch(fetchOrgBasic(orgId)),
    summary: () => orgId && dispatch(fetchOrgSummary(orgId)),
    units: () => orgId && dispatch(fetchOrgUnits(orgId)),
    unitsTree: () => orgId && dispatch(fetchOrgUnitsTree(orgId)),
  };

  const unitActions = {
    create: (p: { name: string; code?: string; parentId?: string | null }) =>
      orgId && dispatch(createOrgUnit({ orgId, ...p })),
    update: (p: {
      unitId: string;
      name?: string;
      code?: string;
      parentId?: string | null;
    }) => orgId && dispatch(updateOrgUnit({ orgId, ...p })),
    remove: (p: { unitId: string; force?: boolean }) =>
      orgId && dispatch(deleteOrgUnit({ orgId, ...p })),
  };

  return {
    basic,
    summary,
    units,
    unitsTree,
    refresh,
    unitActions,
  };
}

//use org members
export function useOrgMembers(params: {
  orgId: string;
  unitId?: string;
  role?: ParentRole;
  q?: string;
  limit?: number;
}) {
  const { orgId, unitId, role, q, limit = 20 } = params;
  const dispatch = useDispatch<AppDispatch>();

  const key = useMemo(
    () => `${orgId}|${unitId ?? ''}|${role ?? ''}|${q ?? ''}`,
    [orgId, unitId, role, q]
  );

  const page = useSelector(
    (state: RootState) => state.orgAdmin.membersByKey[key]
  );
  const nextCursorRef = useRef<string | null>(null);
  nextCursorRef.current = page?.nextCursor ?? null;

  useEffect(() => {
    if (!page || page.status === 'idle') {
      dispatch(
        listMembers({
          orgId,
          unitId,
          role,
          q,
          limit,
          cursor: null,
          append: false,
        })
      );
    }

    return () => {
      dispatch(clearMembersPage({ orgId, unitId, role, q }));
    };
  }, [key, orgId, unitId, role, q, limit, dispatch]);

  const reload = () =>
    dispatch(
      listMembers({
        orgId,
        unitId,
        role,
        q,
        limit,
        cursor: null,
        append: false,
      })
    );

  const loadMore = () => {
    const cursor = nextCursorRef.current;
    if (!cursor) return;
    return dispatch(
      listMembers({ orgId, unitId, role, q, limit, cursor, append: true })
    );
  };

  const memberActions = {
    setBaseRole: (userId: string, newRole: ParentRole) =>
      dispatch(
        updateMemberBaseRole({
          orgId,
          userId,
          role: newRole,
        })
      ),
    setUnit: (userId: string, newUnitId: string | null) =>
      dispatch(
        updateMemberUnit({
          orgId,
          userId,
          unitId: newUnitId,
        })
      ),
    setCustomRole: (userId: string, roleId: string | null) =>
      dispatch(
        assignCustomRole({
          orgId,
          userId,
          roleId,
        })
      ),
  };

  return {
    page: page ?? { status: 'idle', items: [], nextCursor: null },
    reload,
    loadMore,
    memberActions,
    hasMore: Boolean(page?.nextCursor),
    isLoading: page?.status === 'loading',
  };
}
