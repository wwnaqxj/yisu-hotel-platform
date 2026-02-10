import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { createRequest } from '../utils/request.js';

export function useApi() {
  const token = useSelector((s) => s.user.token);

  const api = useMemo(() => {
    return createRequest(() => token);
  }, [token]);

  return api;
}
