import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice.js';
import searchReducer from './searchSlice.js';

export const store = configureStore({
  reducer: {
    user: userReducer,
    search: searchReducer,
  },
});
