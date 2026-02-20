import React from 'react';
import { Box, Chip, Container, Typography } from '@mui/material';
import { useLocation as useRouterLocation } from 'react-router-dom';

export default function HotelListPlaceholder() {
  const { search } = useRouterLocation();
  const params = new URLSearchParams(search);

  const city = params.get('city');
  const keyword = params.get('keyword');
  const checkIn = params.get('checkIn');
  const checkOut = params.get('checkOut');
  const stars = params.get('stars');
  const priceMin = params.get('priceMin');
  const priceMax = params.get('priceMax');

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0f172a' }}>
      <Container maxWidth="sm" sx={{ py: 3, color: '#e5e7eb' }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
          酒店列表（占位页面）
        </Typography>

        <Typography variant="body2" sx={{ mb: 1 }}>
          这里将展示根据查询条件返回的酒店列表。当前查询条件：
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
          {city && <Chip size="small" label={`城市：${city}`} />}
          {keyword && <Chip size="small" label={`关键字：${keyword}`} />}
          {checkIn && checkOut && <Chip size="small" label={`日期：${checkIn} ~ ${checkOut}`} />}
          {stars && <Chip size="small" label={`星级：${stars}`} />}
          {priceMin && priceMax && <Chip size="small" label={`价格：¥${priceMin} - ¥${priceMax}`} />}
          {!city && !keyword && !checkIn && !stars && !priceMin && (
            <Typography variant="body2">暂未提供任何筛选条件。</Typography>
          )}
        </Box>

        <Typography variant="body2" sx={{ mt: 3, opacity: 0.8 }}>
          你可以在这里继续实现真实的酒店列表渲染逻辑（从后端拉取数据、支持分页、排序等）。
        </Typography>
      </Container>
    </Box>
  );
}

