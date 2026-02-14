import { useMemo } from 'react';
import { createRequest } from '../utils/request.js';
import { store } from '../store/index.js';

export function useApi() {
  const api = useMemo(() => {
    // 每次请求时从最新的 Redux 状态中读取 token，避免闭包拿到旧值
    return createRequest(() => store.getState().user.token);
  }, []);

  return api;
}
