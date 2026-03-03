// WARNING: DO NOT DELETE ANY BOILERPLATE COMMENTS IN THIS FILE (start with //-- )
// IF YOU DO, GENERATED REDUCERS WILL NOT BE WIRED UP AUTOMATICALLY.

import {
  type Action,
  configureStore,
  type ThunkAction,
} from '@reduxjs/toolkit';
//-- importRef
import { useDispatch } from 'react-redux';

import ChatSlice from './chat/slice';

export const store = configureStore({
  reducer: {
    chat: ChatSlice,
    //-- reducerRef
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
