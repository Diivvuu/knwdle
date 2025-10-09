import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  authReducer,
  invitesReducer,
  orgDashboardReducer,
  orgReducer,
  orgTypeReducer,
  rolesReducer,
} from '@workspace/state';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

const rootReducer = combineReducers({
  auth: authReducer,
  orgType: orgTypeReducer,
  org: orgDashboardReducer,
  orgAdmin: orgReducer,
  roles: rolesReducer,
  invites: invitesReducer,
});

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefault) =>
    getDefault({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
