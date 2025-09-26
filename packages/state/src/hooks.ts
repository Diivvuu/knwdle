import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { Dispatch, UnknownAction } from '@reduxjs/toolkit';
import type { AppDispatch, RootState } from './types';

/**
 * Reusable typed hooks for Redux
 * Each app must declare its own RootState + AppDispatch types
 */
export const createHooks = <
  RS extends RootState = RootState,
  AD extends Dispatch<UnknownAction> = AppDispatch,
>() => {
  const useAppDispatch = () => useDispatch<AD>();
  const useAppSelector: TypedUseSelectorHook<RS> = useSelector;
  return { useAppDispatch, useAppSelector };
};
