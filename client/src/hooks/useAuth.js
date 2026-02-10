import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUser, logout } from '../store/userSlice.js';
import { useApi } from './useApi.js';

export function useAuth() {
  const dispatch = useDispatch();
  const token = useSelector((s) => s.user.token);
  const user = useSelector((s) => s.user.user);
  const api = useApi();

  useEffect(() => {
    let mounted = true;
    async function run() {
      if (!token) {
        dispatch(setUser(null));
        return;
      }
      try {
        const res = await api.get('/api/auth/me');
        if (!mounted) return;
        dispatch(setUser(res.data.user));
      } catch (e) {
        if (!mounted) return;
        dispatch(logout());
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, [api, dispatch, token]);

  return { token, user };
}
