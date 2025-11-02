'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'next/navigation';
import { AppDispatch } from '@/store/store';
import {
  fetchUnitDashboardConfig,
  selectUnitDashboardConfig,
  selectUnitDashboardLoading,
  selectUnitDashboardError,
} from '@workspace/state';

/**
 * Hook: loads and returns the Org Unit Dashboard Config
 */
export function useUnitDashboardConfig() {
  const {id :  orgId, unitId } = useParams() as { id: string; unitId: string };
  const dispatch = useDispatch<AppDispatch>();

  const config = useSelector(selectUnitDashboardConfig);
  const loading = useSelector(selectUnitDashboardLoading);
  const error = useSelector(selectUnitDashboardError);

    useEffect(() => {
      
    if (orgId && unitId) {
      dispatch(fetchUnitDashboardConfig({ orgId, unitId }));
    }
  }, [orgId, unitId,  dispatch]);
  return { config, loading, error };
}