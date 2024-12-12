import { configureStore } from '@reduxjs/toolkit';
import lobbyReducer from './lobbySlice';

export const store = configureStore({
  reducer: {
    lobby: lobbyReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
