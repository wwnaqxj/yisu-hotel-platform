import axios from 'axios';

export function createRequest(getToken) {
  const baseURL = import.meta.env.VITE_API_BASE_URL || '';
  const instance = axios.create({
    baseURL,
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
