import axios from 'axios';

export function createRequest(getToken) {
  const instance = axios.create({
    baseURL: 'http://localhost:3001',
    timeout: 15000,
  });

  instance.interceptors.request.use((config) => {
    const token = getToken?.();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (res) => res,
    (err) => {
      const message = err?.response?.data?.message || err.message || 'Request error';
      return Promise.reject(new Error(message));
    }
  );

  return instance;
}
