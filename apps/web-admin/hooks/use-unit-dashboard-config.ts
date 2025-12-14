'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'next/navigation';
import { AppDispatch } from '@/store/store';
// import {
//   fetchAudienceDashboardConfig,
//   selectAudienceDashboardConfig,
//   selectAudienceDashboardLoading,
//   selectAudienceDashboardError,
// } from '@workspace/state';

/**
 * Hook: loads and returns the Org Audience Dashboard Config
 */
export function useAudienceDashboardConfig() {
  const { id: orgId, audienceId } = useParams() as {
    id: string;
    audienceId: string;
  };
  const dispatch = useDispatch<AppDispatch>();

  // const config = useSelector(selectAudienceDashboardConfig);
  // const loading = useSelector(selectAudienceDashboardLoading);
  // const error = useSelector(selectAudienceDashboardError);

  useEffect(() => {
    if (orgId && audienceId) {
      // dispatch(fetchAudienceDashboardConfig({ orgId, audienceId }));
    }
  }, [orgId, audienceId, dispatch]);
  return { config: {}, loading: false, error: {} };
}
