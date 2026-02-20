import { useEffect, useState } from 'react';
import { useSearch } from '../context/SearchContext.jsx';

// 用户端定位 Hook：尝试浏览器定位，失败则使用热门城市兜底
export function useLocation() {
  const {
    state: { city },
    setCity,
  } = useSearch();

  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState(null);

  useEffect(() => {
    let canceled = false;

    async function locate() {
      setStatus('loading');
      setError(null);

      if (!navigator.geolocation) {
        if (!canceled && !city) {
          setCity('上海');
        }
        if (!canceled) {
          setStatus('error');
          setError('当前浏览器不支持定位，已为你切换到热门城市');
        }
        return;
      }

      navigator.geolocation.getCurrentPosition(
        () => {
          if (canceled) return;
          // 这里不做真实逆地理编码，直接模拟为“北京”
          setCity('北京');
          setStatus('success');
        },
        (err) => {
          if (canceled) return;
          if (!city) {
            setCity('上海');
          }
          setStatus('error');
          setError(err?.message || '定位失败，已为你切换到热门城市');
        }
      );
    }

    locate();

    return () => {
      canceled = true;
    };
  }, [city, setCity]);

  return { city, status, error, setCity };
}

