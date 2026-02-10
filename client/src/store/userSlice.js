import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  token: localStorage.getItem('token') || '',
  user: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setToken(state, action) {
      state.token = action.payload || '';
      if (state.token) localStorage.setItem('token', state.token);
      else localStorage.removeItem('token');
    },
    setUser(state, action) {
      state.user = action.payload || null;
    },
    logout(state) {
      state.token = '';
      state.user = null;
      localStorage.removeItem('token');
    },
  },
});

export const { setToken, setUser, logout } = userSlice.actions;
export default userSlice.reducer;
