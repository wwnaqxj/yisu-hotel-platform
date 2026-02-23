import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { load } from '@amap/amap-jsapi-loader';

export default function HotelMap({ api, lng, lat, onChange, defaultKeyword = '', defaultCity = '' }) {
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);

  const [keyword, setKeyword] = useState(defaultKeyword);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    setKeyword(defaultKeyword || '');
  }, [defaultKeyword]);

  const jsKey = import.meta.env.VITE_AMAP_JS_KEY;
  const securityJsCode = import.meta.env.VITE_AMAP_SECURITY_JS_CODE;
  const BEIJING_CENTER = [116.397428, 39.90923];

  function isValidLngLat(lngVal, latVal) {
    const a = Number(lngVal);
    const b = Number(latVal);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
    // (0,0) 是海洋，视为无效，避免地图显示在“尼莫点”附近
    if (a === 0 && b === 0) return false;
    return true;
  }

  useEffect(() => {
    if (!jsKey) return;
    let canceled = false;

    /** 等容器有宽高再创建地图，避免 flex 首帧未算完导致 0 尺寸灰屏 */
    function waitForSize(el, maxMs = 3000) {
      return new Promise((resolve) => {
        if (!el) {
          resolve(false);
          return;
        }
        const check = () => {
          if (canceled) {
            resolve(false);
            return true;
          }
          const w = el.offsetWidth;
          const h = el.offsetHeight;
          if (w > 0 && h > 0) {
            resolve(true);
            return true;
          }
          return false;
        };
        if (check()) return;
        const start = Date.now();
        const id = setInterval(() => {
          if (check()) {
            clearInterval(id);
            return;
          }
          if (Date.now() - start >= maxMs) {
            clearInterval(id);
            resolve(true);
          }
        }, 50);
      });
    }

    async function init() {
      const el = mapElRef.current;
      if (!el) return;

      if (securityJsCode) {
        window._AMapSecurityConfig = {
          securityJsCode,
        };
      }

      const AMap = await load({
        key: jsKey,
        version: '2.0',
        plugins: ['AMap.ToolBar'],
      });
      if (canceled || !mapElRef.current) return;

      await waitForSize(mapElRef.current);
      if (canceled || !mapElRef.current) return;

      const center = isValidLngLat(lng, lat) ? [Number(lng), Number(lat)] : BEIJING_CENTER;

      const map = new AMap.Map(mapElRef.current, {
        zoom: 14,
        center,
        viewMode: '2D',
      });
      map.addControl(new AMap.ToolBar());
      mapRef.current = map;

      const marker = new AMap.Marker({
        position: center,
        draggable: true,
      });
      marker.setMap(map);
      markerRef.current = marker;

      marker.on('dragend', (ev) => {
        const p = ev?.lnglat;
        if (!p) return;
        onChangeRef.current?.({ lng: p.lng, lat: p.lat });
      });

      map.on('click', (ev) => {
        const p = ev?.lnglat;
        if (!p) return;
        marker.setPosition([p.lng, p.lat]);
        onChangeRef.current?.({ lng: p.lng, lat: p.lat });
      });

      const handleResize = () => {
        if (!mapRef.current) return;
        try {
          mapRef.current.resize();
        } catch {
          // ignore
        }
      };

      map.on('complete', handleResize);
      window.addEventListener('resize', handleResize);
      setTimeout(handleResize, 0);
      setTimeout(handleResize, 150);
      setTimeout(handleResize, 500);

      return () => {
        map.off('complete', handleResize);
        window.removeEventListener('resize', handleResize);
      };
    }

    let cleanup;
    init().then((fn) => {
      cleanup = fn;
    });

    return () => {
      canceled = true;
      if (cleanup) cleanup();
      try {
        if (mapRef.current) {
          mapRef.current.destroy();
        }
      } catch {
        // ignore
      } finally {
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [jsKey, securityJsCode]);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;

    if (!isValidLngLat(lng, lat)) return;

    const p = [Number(lng), Number(lat)];
    marker.setPosition(p);
    map.setCenter(p);
  }, [lng, lat]);

  async function doGeocode() {
    if (!api) return;
    const kw = String(keyword || '').trim();
    if (!kw) return;

    setBusy(true);
    try {
      const res = await api.post('/api/geo/geocode', {
        keyword: kw,
        city: defaultCity || undefined,
      });
      const nextLng = res?.data?.lng;
      const nextLat = res?.data?.lat;
      if (Number.isFinite(Number(nextLng)) && Number.isFinite(Number(nextLat))) {
        onChangeRef.current?.({ lng: Number(nextLng), lat: Number(nextLat) });
      }
    } finally {
      setBusy(false);
    }
  }

  if (!jsKey) {
    return (
      <Box>
        <Typography variant="body2" color="error">
          缺少高德 JSAPI Key：请在 client/.env 中配置 VITE_AMAP_JS_KEY
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 1.5 }} alignItems={{ xs: 'stretch', sm: 'center' }}>
        <TextField label="搜索酒店/地址" value={keyword} onChange={(ev) => setKeyword(ev.target.value)} size="small" fullWidth />
        <Button variant="outlined" onClick={doGeocode} disabled={busy || !keyword.trim()} sx={{ whiteSpace: 'nowrap' }}>
          解析经纬度
        </Button>
      </Stack>

      <Box
        ref={mapElRef}
        sx={{
          width: '100%',
          height: 360,
          borderRadius: 2,
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}
      />

      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        支持地图点击选点、Marker 拖拽；或用上方搜索调用后端地理编码。
      </Typography>
    </Box>
  );
}
