'use client';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import type { ReactNode } from 'react';
import type { Store } from '@reduxjs/toolkit';
import type { Persistor } from 'redux-persist';

interface ReduxProviderProps {
  store: Store;
  persistor?: Persistor; // optional → only used if redux-persist is enabled
  children: ReactNode;
}

/**
 * Global Redux Provider with optional PersistGate
 * Reusable in all apps
 */
export function ReduxProvider({
  store,
  persistor,
  children,
}: ReduxProviderProps) {
  return (
    <Provider store={store}>
      {persistor ? (
        <PersistGate loading={null} persistor={persistor}>
          {children}
        </PersistGate>
      ) : (
        children
      )}
    </Provider>
  );
}
