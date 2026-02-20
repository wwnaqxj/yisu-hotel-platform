import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useNavigate } from 'react-router-dom';

export default function BannerCarousel({ banners = [] }) {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);

  const total = banners.length;
  const current = useMemo(
    () => (total > 0 ? banners[index % total] : null),
    [banners, index, total],
  );

  const handleClick = () => {
    if (!current?.hotelId) return;
    navigate(`/mobile/hotel/${current.hotelId}`);
  };

  const goNext = () => {
    setIndex((prev) => (prev + 1) % total);
  };

  const goPrev = () => {
    setIndex((prev) => (prev - 1 + total) % total);
  };

  if (!total) return null;

  return (
    <Box sx={{ px: 2, mb: 1 }}>
      <Card
        sx={{
          position: 'relative',
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(15,23,42,0.25)',
          bgcolor: '#0f172a',
          color: '#e5e7eb',
        }}
      >
        <CardActionArea onClick={handleClick}>
          <Box
            sx={{
              height: 160,
              backgroundImage: `url(${current.imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              {current.title}
            </Typography>
            {current.subtitle ? (
              <Typography variant="body2" sx={{ mt: 0.5 }} noWrap>
                {current.subtitle}
              </Typography>
            ) : null}
          </CardContent>
        </CardActionArea>

        {/* 左右切换按钮 */}
        <IconButton
          size="small"
          onClick={goPrev}
          sx={{
            position: 'absolute',
            top: '50%',
            left: 8,
            transform: 'translateY(-50%)',
            bgcolor: 'rgba(15,23,42,0.65)',
            color: '#fff',
            '&:hover': { bgcolor: 'rgba(15,23,42,0.9)' },
          }}
        >
          <ChevronLeftIcon />
        </IconButton>
        <IconButton
          size="small"
          onClick={goNext}
          sx={{
            position: 'absolute',
            top: '50%',
            right: 8,
            transform: 'translateY(-50%)',
            bgcolor: 'rgba(15,23,42,0.65)',
            color: '#fff',
            '&:hover': { bgcolor: 'rgba(15,23,42,0.9)' },
          }}
        >
          <ChevronRightIcon />
        </IconButton>

        {/* 底部指示点 */}
        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            position: 'absolute',
            bottom: 8,
            left: 0,
            right: 0,
            justifyContent: 'center',
          }}
        >
          {banners.map((b, i) => (
            <Box
              // eslint-disable-next-line react/no-array-index-key
              key={i}
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: i === index ? 'primary.main' : 'rgba(148,163,184,0.8)',
              }}
            />
          ))}
        </Stack>
      </Card>
    </Box>
  );
}