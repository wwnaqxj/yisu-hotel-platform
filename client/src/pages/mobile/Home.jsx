import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  IconButton,
  Slider,
  Stack,
  TextField,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import BannerCarousel from '../../components/mobile/BannerCarousel.jsx';
import TagChips from '../../components/mobile/TagChips.jsx';
import DateRangeCalendar from '../../components/mobile/DateRangeCalendar.jsx';
import { useSearch } from '../../context/SearchContext.jsx';
import { useLocation } from '../../hooks/useLocation.js';

const MOCK_BANNERS = [
  {
    id: 1,
    hotelId: 101,
    title: '北京 CBD 高端商务酒店',
    subtitle: '紧邻地铁国贸站 · 商务出差首选',
    imageUrl: 'https://picsum.photos/seed/yisu-cbd/800/400',
  },
  {
    id: 2,
    hotelId: 102,
    title: '上海外滩江景豪华酒店',
    subtitle: '俯瞰黄浦江夜景 · 打卡网红攻略',
    imageUrl: 'https://picsum.photos/seed/yisu-bund/800/400',
  },
];

const SUGGESTIONS_BY_CITY = {
  北京: ['三里屯太古里', '国贸附近酒店', '朝阳公园亲子酒店'],
  上海: ['陆家嘴金融街', '迪士尼度假区', '五角场商圈'],
};

export default function MobileHome() {
  const navigate = useNavigate();
  const {
    state: { city, keyword, checkInDate, checkOutDate, stars, priceMin, priceMax },
    setCity,
    setKeyword,
    setStars,
    setPriceRange,
  } = useSearch();
  const { status: locStatus, error: locError } = useLocation();

  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const [keywordInput, setKeywordInputLocal] = React.useState(keyword || '');
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  const suggestions = React.useMemo(() => {
    const base = SUGGESTIONS_BY_CITY[city] || [];
    const input = keywordInput.trim();
    if (!input) return base;
    return base.filter((s) => s.toLowerCase().includes(input.toLowerCase()));
  }, [city, keywordInput]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (keywordInput.trim()) params.set('keyword', keywordInput.trim());
    if (checkInDate) params.set('checkIn', checkInDate.toISOString().slice(0, 10));
    if (checkOutDate) params.set('checkOut', checkOutDate.toISOString().slice(0, 10));
    if (stars.length) params.set('stars', stars.join(','));
    if (priceMin != null) params.set('priceMin', String(priceMin));
    if (priceMax != null) params.set('priceMax', String(priceMax));

    navigate(`/mobile/list?${params.toString()}`);
  };

  const handleKeywordChange = (val) => {
    setKeywordInputLocal(val);
    setKeyword(val);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (s) => {
    setKeywordInputLocal(s);
    setKeyword(s);
    setShowSuggestions(false);
  };

  const handleStarsChange = (event, next) => {
    setStars(next || []);
  };

  const handlePriceChange = (event, value) => {
    const [min, max] = value;
    setPriceRange(min, max);
  };

  const summaryDate =
    checkInDate && checkOutDate
      ? `${checkInDate.toLocaleDateString()} - ${checkOutDate.toLocaleDateString()}`
      : '请选择入住 / 离店日期';

  const locationHint =
    locStatus === 'loading'
      ? '正在获取定位…'
      : locStatus === 'error'
        ? locError || '定位失败，已使用热门城市'
        : `当前城市：${city}`;

  const priceMarks = [
    { value: 0, label: '¥0' },
    { value: 500, label: '¥500' },
    { value: 1000, label: '¥1000+' },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0f172a' }}>
      <Container maxWidth="sm" sx={{ py: 2 }}>
        <Typography variant="h6" sx={{ mb: 1.5, color: '#e5e7eb', fontWeight: 700 }}>
          易宿酒店预订
        </Typography>

        <BannerCarousel banners={MOCK_BANNERS} />

        <Card
          sx={{
            mt: 2,
            borderRadius: 3,
            boxShadow: '0 8px 30px rgba(15,23,42,0.45)',
            overflow: 'hidden',
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            {/* 地点选择 + 定位状态 */}
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <IconButton size="small" sx={{ bgcolor: 'primary.main', color: '#fff' }}>
                <LocationOnIcon fontSize="small" />
              </IconButton>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {locationHint}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                  {['北京', '上海', '广州'].map((c) => (
                    <Chip
                      key={c}
                      size="small"
                      label={c}
                      color={city === c ? 'primary' : 'default'}
                      onClick={() => setCity(c)}
                      variant={city === c ? 'filled' : 'outlined'}
                    />
                  ))}
                </Stack>
              </Box>
            </Stack>

            {/* 关键字搜索 + 联想 */}
            <Box sx={{ position: 'relative', mb: 2 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="搜索酒店名 / 商圈 / 地标"
                value={keywordInput}
                onChange={(ev) => handleKeywordChange(ev.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
              {showSuggestions && suggestions.length > 0 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    bgcolor: '#fff',
                    boxShadow: 3,
                    borderRadius: 2,
                    mt: 0.5,
                    zIndex: 10,
                    maxHeight: 200,
                    overflowY: 'auto',
                  }}
                >
                  {suggestions.map((s) => (
                    <Box
                      key={s}
                      onClick={() => handleSuggestionClick(s)}
                      sx={{
                        px: 1.5,
                        py: 1,
                        fontSize: 14,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: '#f3f4f6' },
                      }}
                    >
                      {s}
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

            {/* 日期选择 */}
            <Box
              sx={{
                mb: 2,
                p: 1.5,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                cursor: 'pointer',
              }}
              onClick={() => setCalendarOpen(true)}
            >
              <Typography variant="caption" color="text.secondary">
                入住 / 离店日期
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 500 }}>
                {summaryDate}
              </Typography>
            </Box>

            {/* 星级筛选 */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                酒店星级
              </Typography>
              <ToggleButtonGroup
                value={stars}
                onChange={handleStarsChange}
                size="small"
                sx={{ flexWrap: 'wrap' }}
              >
                {[1, 2, 3, 4, 5].map((s) => (
                  <ToggleButton key={s} value={s} sx={{ px: 1.5, py: 0.5 }}>
                    {s} 星
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            {/* 价格区间 */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                价格区间（每晚）
              </Typography>
              <Slider
                value={[priceMin, priceMax]}
                min={0}
                max={1000}
                step={50}
                marks={priceMarks}
                onChange={handlePriceChange}
                valueLabelDisplay="auto"
              />
            </Box>

            {/* 智能标签 */}
            <TagChips city={city} />

            <Button
              variant="contained"
              fullWidth
              size="large"
              sx={{ mt: 3, borderRadius: 999 }}
              onClick={handleSearch}
            >
              搜索酒店
            </Button>
          </CardContent>
        </Card>
      </Container>

      {/* 日历弹窗 */}
      <Dialog
        fullWidth
        maxWidth="xs"
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>选择入住和离店日期</DialogTitle>
        <DialogContent dividers>
          <DateRangeCalendar />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCalendarOpen(false)}>完成</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

