import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { load } from '@amap/amap-jsapi-loader';

export default function HotelMap({ api, lng, lat, onChange, defaultKeyword = '', defaultCity = '' }) {
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const [keyword, setKeyword] = useState(defaultKeyword);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setKeyword(defaultKeyword || '');
  }, [defaultKeyword]);

  const jsKey = useMemo(() => {
    return import.meta.env.VITE_AMAP_JS_KEY;
  }, []);

  const securityJsCode = useMemo(() => {
    return import.meta.env.VITE_AMAP_SECURITY_JS_CODE;
  }, []);

  useEffect(() => {
    let canceled = false;

    async function init() {
      if (!jsKey) {
        return;
      }
      if (!mapElRef.current) return;

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
      if (canceled) return;

      const center = Number.isFinite(Number(lng)) && Number.isFinite(Number(lat)) ? [Number(lng), Number(lat)] : [116.397428, 39.90923];

      const map = new AMap.Map(mapElRef.current, {
        zoom: 14,
        center,
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
        onChange?.({ lng: p.lng, lat: p.lat });
      });

      map.on('click', (ev) => {
        const p = ev?.lnglat;
        if (!p) return;
        marker.setPosition([p.lng, p.lat]);
        onChange?.({ lng: p.lng, lat: p.lat });
      });
    }

    init();

    return () => {
      canceled = true;
      try {
        if (mapRef.current) {
          mapRef.current.destroy();
        }
      } catch (e) {
        // ignore
      } finally {
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [jsKey]);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;

    const hasPoint = Number.isFinite(Number(lng)) && Number.isFinite(Number(lat));
    if (!hasPoint) return;

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
        onChange?.({ lng: Number(nextLng), lat: Number(nextLat) });
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
