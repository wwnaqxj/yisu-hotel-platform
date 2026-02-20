import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  AppBar,
  Avatar,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  List,
  Menu,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useTheme,
  alpha
} from '@mui/material';
import {
  AddPhotoAlternate as AddPhotoIcon,
  Delete as DeleteIcon,
  Hotel as HotelIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Star as StarIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  VideoCameraBack as VideoIcon,
  RoomService as RoomIcon, // 房型图标
  Store as StoreIcon,
  AttachMoney as MoneyIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';

import { useApi } from '../../../hooks/useApi';
import { useAuth } from '../../../hooks/useAuth.js';
import { logout as logoutAction } from '../../../store/userSlice.js';

import pcaa from 'china-area-data';

import HotelMap from './HotelMap.jsx';

// --- 工具函数：处理日期 ---
function toDateInputValue(v) {
  if (!v) return '';

  const d = dayjs(v);
  return d.isValid() ? d.format('YYYY-MM-DD') : '';
}

// --- 1. 新增：配置你的后端地址 ---
const API_BASE_URL = 'http://192.168.88.1:3001';

// --- 2. 新增：图片地址转换函数 ---
// 如果是本地选的图(blob)直接显示，如果是MinIO的图走后端代理
const getMediaUrl = (url) => {
  if (!url) return '';

  const raw = String(url).trim();
  if (!raw) return '';
  if (raw.startsWith('blob:')) return raw;
  if (raw.includes('/api/media/')) return raw;

  // Expect: http(s)://host/<bucket>/<objectName>
  const m = raw.match(/^https?:\/\/[^/]+\/([^/]+)\/(.+)$/);
  if (!m) return raw;

  const bucket = m[1];
  const objectName = m[2];
  return `${API_BASE_URL}/api/media/${encodeURIComponent(bucket)}/${objectName}`;
};

// --- 子组件：美化的上传区域 ---
const UploadZone = ({ label, accept, onChange, icon: Icon, loading }) => (
  <Button
    variant="outlined"
    component="label"
    disabled={loading}
    sx={{
      width: '100%',
      height: 120,
      borderStyle: 'dashed',
      borderWidth: 2,
      borderColor: 'divider',
      borderRadius: 2,
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
      textTransform: 'none',
      color: 'text.secondary',
      bgcolor: 'background.paper',
      transition: 'all 0.2s',
      '&:hover': {
        borderColor: 'primary.main',
        bgcolor: 'action.hover',
        color: 'primary.main'
      },
    }}
  >
    {loading ? <CircularProgress size={24} /> : <Icon fontSize="large" />}
    <Typography variant="body2" fontWeight={500}>{label}</Typography>
    <input hidden type="file" accept={accept} multiple onChange={onChange} />
  </Button>
);

// --- 主组件 ---
export default function HotelEdit() {
  const api = useApi();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();

  const municipalityNames = useMemo(() => new Set(['北京市', '天津市', '上海市', '重庆市']), []);

  const provinceOptions = useMemo(() => {
    const provinces = pcaa?.['86'] || {};
    return Object.entries(provinces).map(([code, name]) => ({ code, name }));
  }, []);

  const cityIndex = useMemo(() => {
    const provinces = pcaa?.['86'] || {};
    const idx = new Map();
    Object.keys(provinces).forEach((provCode) => {
      const cities = pcaa?.[provCode] || {};
      Object.entries(cities).forEach(([cityCode, cityName]) => {
        const key = String(cityName);
        if (!idx.has(key)) idx.set(key, []);
        idx.get(key).push({ provinceCode: provCode, cityCode, cityName });
      });
    });
    return idx;
  }, []);

  // --- 状态管理 ---
  const [loading, setLoading] = useState(false); // 全局/提交加载
  const [uploadLoading, setUploadLoading] = useState(false); // 上传加载
  const [listLoading, setListLoading] = useState(false); // 列表加载
  const [myHotels, setMyHotels] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [addressEditMode, setAddressEditMode] = useState(true);
  const [geoLoading, setGeoLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(dayjs().format('YYYY-MM-DD HH:mm'));

  // 消息提示 Snackbar
  const [snack, setSnack] = useState({ open: false, severity: 'info', message: '' });

  // 表单数据
  const [values, setValues] = useState({
    nameZh: '',
    nameEn: '',
    city: '',
    address: '',
    provinceCode: '',
    cityCode: '',
    districtCode: '',
    streetAddress: '',
    lng: '',
    lat: '',
    star: 5,
    openTime: toDateInputValue('2020-01-01'),
    description: '',
    facilitiesText: '', // 文本域输入的设施，逗号分隔
    facilities: [],
    images: [],
    videos: [],
    roomTypes: [{ name: '标准间', price: 299 }],
  });

  const provinceName = useMemo(() => {
    const provinces = pcaa?.['86'] || {};
    return values.provinceCode ? provinces[values.provinceCode] || '' : '';
  }, [values.provinceCode]);

  const isMunicipality = useMemo(() => municipalityNames.has(provinceName), [municipalityNames, provinceName]);

  const cityOptions = useMemo(() => {
    if (!values.provinceCode) return [];
    const cities = pcaa?.[values.provinceCode] || {};
    return Object.entries(cities).map(([code, name]) => ({ code, name }));
  }, [values.provinceCode]);

  const cityName = useMemo(() => {
    if (!values.provinceCode || !values.cityCode) return '';
    const cities = pcaa?.[values.provinceCode] || {};
    return cities[values.cityCode] || '';
  }, [values.provinceCode, values.cityCode]);

  const districtOptions = useMemo(() => {
    if (!values.cityCode) return [];
    const dists = pcaa?.[values.cityCode] || {};
    return Object.entries(dists).map(([code, name]) => ({ code, name }));
  }, [values.cityCode]);

  const districtName = useMemo(() => {
    if (!values.cityCode || !values.districtCode) return '';
    const dists = pcaa?.[values.cityCode] || {};
    return dists[values.districtCode] || '';
  }, [values.cityCode, values.districtCode]);

  useEffect(() => {
    if (!values.provinceCode) return;
    if (!isMunicipality) return;
    const cities = pcaa?.[values.provinceCode] || {};
    const firstCityCode = Object.keys(cities)[0] || '';
    if (!firstCityCode) return;
    if (!values.cityCode) setValues((v) => ({ ...v, cityCode: firstCityCode }));
  }, [isMunicipality, values.provinceCode, values.cityCode]);

  // 用户菜单锚点
  const [menuAnchor, setMenuAnchor] = useState(null);

  // 计算当前选中的酒店对象（用于显示状态等）
  const selectedHotel = useMemo(() => {
    return myHotels.find((h) => h.id === selectedId) || null;
  }, [myHotels, selectedId]);

  // --- 初始化与定时器 ---
  useEffect(() => {
    refreshList();
    const timer = setInterval(() => {
      setCurrentTime(dayjs().format('YYYY-MM-DD HH:mm'));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // --- 辅助逻辑函数 ---
  function notify(severity, message) {
    setSnack({ open: true, severity, message });
  }

  function closeSnack() {
    setSnack((s) => ({ ...s, open: false }));
  }

  // --- 业务逻辑：获取列表 ---
  async function refreshList() {
    setListLoading(true);
    try {
      const res = await api.get('/api/merchant/hotel/list');
      setMyHotels(res.data.items || []);
    } catch (e) {
      notify('error', '加载酒店列表失败');
    } finally {
      setListLoading(false);
    }
  }

  // --- 业务逻辑：重置表单（新建模式） ---
  function handleReset() {
    setSelectedId(null);
    setAddressEditMode(true);
    setValues({
      nameZh: '',
      nameEn: '',
      city: '',
      address: '',
      provinceCode: '',
      cityCode: '',
      districtCode: '',
      streetAddress: '',
      lng: '',
      lat: '',
      star: 5,
      openTime: toDateInputValue('2020-01-01'),
      description: '',
      facilitiesText: '',
      facilities: [],
      images: [],
      videos: [],
      roomTypes: [{ name: '标准间', price: 299 }],
    });
  }

  // --- 业务逻辑：选中并回显酒店 ---
  async function handleSelectHotel(id) {
    setLoading(true); // 使用 loading 遮罩右侧
    try {
      const res = await api.get(`/api/merchant/hotel/${id}`);
      const h = res.data.hotel;
      const rooms = res.data.rooms || [];

      setSelectedId(h.id);
      setAddressEditMode(false);

      // 数据处理：设施数组转字符串
      let facilitiesStr = '';
      if (Array.isArray(h.facilities)) {
        facilitiesStr = h.facilities.join('，');
      } else if (h.facilities) {
        facilitiesStr = String(h.facilities);
      }

      const facilitiesArr = Array.isArray(h.facilities) ? h.facilities.filter(Boolean).map((x) => String(x).trim()).filter(Boolean) : normalizeFacilities(facilitiesStr);

      // 数据处理：媒体可能为 null 或单字符串或数组
      const ensureArray = (item) => {
        if (!item) return [];
        if (Array.isArray(item)) return item;
        return [item]; // 如果是字符串，包一层
      };

      let provinceCode = '';
      let cityCode = '';
      if (h.city) {
        const matches = cityIndex.get(String(h.city)) || [];
        if (matches.length === 1) {
          provinceCode = matches[0].provinceCode;
          cityCode = matches[0].cityCode;
        }
      }

      setValues({
        nameZh: h.nameZh || '',
        nameEn: h.nameEn || '',
        city: h.city || '',
        address: h.address || '',
        provinceCode,
        cityCode,
        districtCode: '',
        streetAddress: h.address || '',
        lng: h.lng != null ? String(h.lng) : '',
        lat: h.lat != null ? String(h.lat) : '',
        star: Number(h.star || 5),
        openTime: toDateInputValue(h.openTime),
        description: h.description || '',
        facilitiesText: facilitiesStr,
        facilities: facilitiesArr,
        images: ensureArray(h.images),
        videos: ensureArray(h.videos),
        roomTypes:
          rooms.length > 0
            ? rooms.map((r) => ({ name: r.name || '', price: Number(r.price || 0) }))
            : [{ name: '标准间', price: 299 }],
      });
    } catch (e) {
      notify('error', e.message || '加载详情失败');
    } finally {
      setLoading(false);
    }
  }

  // --- 表单字段更新 ---
  function setField(key, value) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function setRoomField(index, key, value) {
    setValues((v) => {
      const next = v.roomTypes.slice();
      const row = { ...(next[index] || { name: '', price: 0 }) };
      row[key] = value;
      next[index] = row;
      return { ...v, roomTypes: next };
    });
  }

  function addRoom() {
    setValues((v) => ({ ...v, roomTypes: [...v.roomTypes, { name: '', price: 0 }] }));
  }

  function removeRoom(index) {
    setValues((v) => {
      const next = v.roomTypes.slice();
      next.splice(index, 1);
      return { ...v, roomTypes: next.length ? next : [{ name: '', price: 0 }] };
    });
  }

  async function uploadOne(file, type) {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post(`/api/upload/single?type=${encodeURIComponent(type)}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const url = res.data?.url;
    if (!url) throw new Error('未返回 URL');
    return url;
  }

  async function onPickImages(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;

    const localUrls = files.map((f) => URL.createObjectURL(f));
    setValues((v) => ({ ...v, images: [...(v.images || []), ...localUrls] }));

    setUploadLoading(true);
    try {
      const remoteUrls = [];
      for (const f of files) {
        const url = await uploadOne(f, 'image');
        if (url) remoteUrls.push(url);
      }

      setValues((v) => {
        const next = Array.isArray(v.images) ? v.images.slice() : [];
        let ri = 0;
        for (let i = 0; i < next.length; i += 1) {
          if (ri >= remoteUrls.length) break;
          if (localUrls.includes(next[i])) {
            try {
              URL.revokeObjectURL(next[i]);
            } catch (e2) {
              // ignore
            }
            next[i] = remoteUrls[ri];
            ri += 1;
          }
        }
        if (ri < remoteUrls.length) next.push(...remoteUrls.slice(ri));
        return { ...v, images: next };
      });

      notify('success', `成功上传 ${remoteUrls.length} 张图片`);
    } catch (err) {
      setValues((v) => {
        const next = Array.isArray(v.images) ? v.images.filter((u) => !localUrls.includes(u)) : [];
        return { ...v, images: next };
      });
      notify('error', '图片上传失败: ' + err.message);
    } finally {
      setUploadLoading(false);
    }
  }

  async function onPickVideos(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;

    const localUrls = files.map((f) => URL.createObjectURL(f));
    setValues((v) => ({ ...v, videos: [...(v.videos || []), ...localUrls] }));

    setUploadLoading(true);
    try {
      const remoteUrls = [];
      for (const f of files) {
        const url = await uploadOne(f, 'video');
        if (url) remoteUrls.push(url);
      }

      setValues((v) => {
        const next = Array.isArray(v.videos) ? v.videos.slice() : [];
        let ri = 0;
        for (let i = 0; i < next.length; i += 1) {
          if (ri >= remoteUrls.length) break;
          if (localUrls.includes(next[i])) {
            try {
              URL.revokeObjectURL(next[i]);
            } catch (e2) {
              // ignore
            }
            next[i] = remoteUrls[ri];
            ri += 1;
          }
        }
        if (ri < remoteUrls.length) next.push(...remoteUrls.slice(ri));
        return { ...v, videos: next };
      });

      notify('success', `成功上传 ${remoteUrls.length} 个视频`);
    } catch (err) {
      setValues((v) => {
        const next = Array.isArray(v.videos) ? v.videos.filter((u) => !localUrls.includes(u)) : [];
        return { ...v, videos: next };
      });
      notify('error', '视频上传失败: ' + err.message);
    } finally {
      setUploadLoading(false);
    }
  }

  function removeMedia(kind, index) {
    setValues((v) => {
      const arr = Array.isArray(v[kind]) ? v[kind].slice() : [];
      const removed = arr.splice(index, 1);
      const u = removed && removed[0];
      if (typeof u === 'string' && u.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(u);
        } catch (e2) {
          // ignore
        }
      }
      return { ...v, [kind]: arr };
    });
  }

  function validate() {
    if (!values.nameZh?.trim()) return '请输入酒店中文名称';
    if (!values.nameEn?.trim()) return '请输入酒店英文名称';
    if (addressEditMode) {
      if (!values.provinceCode) return '请选择省份';
      if (!values.cityCode) return '请选择城市/直辖市';
      if (!values.districtCode) return '请选择区/县';
      if (!values.streetAddress?.trim()) return '请输入街道地址';
    }
    const star = Number(values.star);
    if (!Number.isFinite(star) || star < 1 || star > 5) return '星级需为 1~5';
    if (!values.openTime) return '请选择开业时间';
    if (!Array.isArray(values.roomTypes) || values.roomTypes.length < 1) return '至少需要添加一个房型';

    for (let i = 0; i < values.roomTypes.length; i += 1) {
      const r = values.roomTypes[i];
      if (!r?.name?.trim()) return `第 ${i + 1} 个房型名称不能为空`;
      const price = Number(r.price);
      if (!Number.isFinite(price) || price < 0) return `第 ${i + 1} 个房型价格无效`;
    }
    return '';
  }

  function normalizeFacilities(text) {
    const raw = String(text || '').trim();
    if (!raw) return [];
    return raw.split(/[\n\r,，、;；]+/).map((s) => s.trim()).filter(Boolean);
  }

  function normalizeFacilitiesList(list) {
    if (!Array.isArray(list)) return [];
    return list
      .map((x) => String(x || '').trim())
      .filter(Boolean);
  }

  const cityForMap = addressEditMode ? (isMunicipality ? provinceName : cityName) : (values.city || '');
  const addressForGeo = addressEditMode
    ? `${provinceName || ''}${isMunicipality ? '' : (cityName || '')}${districtName || ''}${values.streetAddress || ''}`
    : (values.address || '');

  async function autoGeocodeFromAddress() {
    const keyword = String(addressForGeo || '').trim();
    if (!keyword) return notify('warning', '请先填写地址');

    setGeoLoading(true);
    try {
      const res = await api.post('/api/geo/geocode', {
        keyword,
        city: cityForMap || undefined,
      });
      const lng = res?.data?.lng;
      const lat = res?.data?.lat;
      if (!Number.isFinite(Number(lng)) || !Number.isFinite(Number(lat))) {
        return notify('warning', '未解析到经纬度');
      }
      setValues((v) => ({ ...v, lng: String(lng), lat: String(lat) }));
      notify('success', '已自动定位并回填经纬度');
    } catch (e) {
      notify('error', e?.message || '自动定位失败');
    } finally {
      setGeoLoading(false);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    const msg = validate();
    if (msg) return notify('warning', msg);

    const finalAddress = addressForGeo;

    setLoading(true);
    try {
      const payload = {
        nameZh: values.nameZh,
        nameEn: values.nameEn,
        city: cityForMap,
        address: finalAddress,
        lng: values.lng,
        lat: values.lat,
        star: Number(values.star),

        openTime: values.openTime,
        description: values.description,
        facilities: Array.isArray(values.facilities) && values.facilities.length ? normalizeFacilitiesList(values.facilities) : normalizeFacilities(values.facilitiesText),
        images: values.images,

        videos: values.videos,
        roomTypes: values.roomTypes.map((r) => ({ name: r.name, price: Number(r.price) })),
      };

      if (selectedId) {
        await api.put(`/api/merchant/hotel/${selectedId}`, payload);
        notify('success', '更新成功');
      } else {
        await api.post('/api/merchant/hotel', payload);
        notify('success', '创建成功');
      }

      await refreshList();
      if (!selectedId) handleReset();
    } catch (e2) {
      notify('error', e2.message || '保存失败');
    } finally {
      setLoading(false);
    }
  }

  const getStatusChip = (status) => {
    const s = String(status || 'pending').toLowerCase();
    let color = 'default';
    let label = '审核中';
    if (s === 'pass' || s === 'approved') {
      color = 'success';
      label = '已发布';
    } else if (s === 'reject' || s === 'rejected') {
      color = 'error';
      label = '已驳回';
    } else if (s === 'offline') {
      color = 'warning';
      label = '已下线';
    }
    return <Chip label={label} color={color} size="small" variant="outlined" sx={{ height: 20, fontSize: 11, fontWeight: 'bold' }} />;
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'radial-gradient(1200px 500px at 10% -10%, rgba(59,130,246,0.18) 0%, rgba(59,130,246,0) 60%), radial-gradient(900px 450px at 90% -10%, rgba(99,102,241,0.16) 0%, rgba(99,102,241,0) 55%), linear-gradient(180deg, #f8fafc 0%, #f1f5f9 60%, #f8fafc 100%)',
      }}
    >
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: '#0f172a',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          zIndex: 1201
        }}
      >
        <Toolbar
          sx={{
            minHeight: 68,
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            columnGap: 2,
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
            <Avatar
              variant="rounded"
              sx={{
                background: 'linear-gradient(135deg, rgba(59,130,246,0.95) 0%, rgba(99,102,241,0.95) 55%, rgba(14,165,233,0.95) 100%)',
                border: '1px solid rgba(255,255,255,0.16)',
                width: 36,
                height: 36,
                boxShadow: '0 10px 20px rgba(2, 6, 23, 0.25)',
              }}
            >
              <StoreIcon fontSize="small" sx={{ color: '#fff' }} />
            </Avatar>
            <Chip
              icon={<AccessTimeIcon sx={{ color: 'rgba(255,255,255,0.75) !important' }} />}
              label={currentTime}
              size="small"
              sx={{
                bgcolor: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.85)',
                border: '1px solid rgba(255,255,255,0.10)',
                fontWeight: 600,
                '& .MuiChip-label': { px: 0.75 },
              }}
            />
          </Stack>

          <Box sx={{ textAlign: 'center', px: 2 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 900,
                letterSpacing: 1,
                color: '#fff',
                lineHeight: 1.1,
              }}
            >
              易宿商户中心
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ justifySelf: 'end' }}>
            <Chip
              avatar={<Avatar sx={{ bgcolor: theme.palette.primary.dark, color: '#fff' }}>{(user?.username || 'A')[0]}</Avatar>}
              label={user?.username || 'Merchant'}
              onClick={(ev) => setMenuAnchor(ev.currentTarget)}
              sx={{
                bgcolor: 'rgba(255,255,255,0.08)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.1)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' }
              }}
            />
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
              PaperProps={{ sx: { mt: 1, minWidth: 150, borderRadius: 2 } }}
            >
              <MenuItem
                onClick={() => {
                  setMenuAnchor(null);
                  navigate('/admin/profile');
                }}
              >
                <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> 个人中心
              </MenuItem>
              <Divider />
              <MenuItem
                onClick={() => {
                  setMenuAnchor(null);
                  dispatch(logoutAction());
                  navigate('/admin/login');
                }}
              >
                <LogoutIcon fontSize="small" sx={{ mr: 1, color: 'error.main' }} />
                <Typography color="error">退出登录</Typography>
              </MenuItem>
            </Menu>
          </Stack>
        </Toolbar>
      </AppBar>

      <Toolbar />

      <Container maxWidth={false} sx={{ py: 3.5, px: { xs: 1.5, sm: 3 } }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
          <Box
            sx={{
              width: { xs: '100%', md: 280 },
              flexShrink: 0,
              position: { md: 'sticky' },
              top: 88,
              height: { md: 'calc(100vh - 120px)' },
              zIndex: 1,
            }}
          >
            <Card
              variant="outlined"
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3.5,
                border: '1px solid rgba(15, 23, 42, 0.06)',
                bgcolor: 'rgba(255,255,255,0.78)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 10px 28px rgba(15,23,42,0.08)',
              }}
            >
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(15, 23, 42, 0.08)', bgcolor: 'rgba(255,255,255,0.6)' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Avatar
                    variant="rounded"
                    sx={{
                      width: 30,
                      height: 30,
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                      color: 'primary.main',
                      border: '1px solid rgba(59, 130, 246, 0.18)',
                    }}
                  >
                    <HotelIcon fontSize="small" />
                  </Avatar>
                  <Typography variant="subtitle1" fontWeight={800}>我的酒店</Typography>
                </Stack>
                <Tooltip title="刷新列表">
                  <IconButton onClick={refreshList} disabled={listLoading} size="small">
                    {listLoading ? <CircularProgress size={20} /> : <RefreshIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              </Box>

              <Box sx={{ flex: 1, overflowY: 'auto', bgcolor: 'rgba(241,245,249,0.55)', p: 1.5 }}>
                {myHotels.length === 0 && !listLoading ? (
                  <Stack alignItems="center" justifyContent="center" sx={{ height: '100%', opacity: 0.5 }}>
                    <HotelIcon sx={{ fontSize: 48, mb: 1, color: 'text.disabled' }} />
                    <Typography variant="body2">暂无数据</Typography>
                  </Stack>
                ) : (
                  <Stack spacing={1.5}>
                    {myHotels.map((item) => {
                      const active = selectedId === item.id;
                      return (
                        <Card
                          key={item.id}
                          elevation={active ? 3 : 0}
                          onClick={() => handleSelectHotel(item.id)}
                          sx={{
                            p: 2,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            border: '1px solid',
                            borderColor: active ? 'primary.main' : 'transparent',
                            bgcolor: active ? '#fff' : 'rgba(255,255,255,0.78)',
                            borderRadius: 2.5,
                            boxShadow: active ? '0 10px 22px rgba(15,23,42,0.10)' : '0 1px 0 rgba(15,23,42,0.05)',
                            '&:hover': { transform: 'translateY(-2px)', bgcolor: '#fff', boxShadow: '0 10px 22px rgba(15,23,42,0.10)' }
                          }}
                        >
                          <Stack direction="row" spacing={2}>
                            <Avatar
                              variant="rounded"
                              sx={{
                                width: 44,
                                height: 44,
                                fontWeight: 900,
                                letterSpacing: 1,
                                color: '#fff',
                                background: active
                                  ? 'linear-gradient(135deg, #2563eb 0%, #4f46e5 55%, #0ea5e9 100%)'
                                  : 'linear-gradient(135deg, rgba(148,163,184,0.95) 0%, rgba(100,116,139,0.95) 100%)',
                                boxShadow: active ? '0 14px 26px rgba(37, 99, 235, 0.25)' : '0 10px 18px rgba(15,23,42,0.10)',
                              }}
                            >
                              {String(item.nameZh || 'H').slice(0, 1)}
                            </Avatar>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography variant="subtitle2" noWrap fontWeight={600} color={active ? 'primary.main' : 'text.primary'}>
                                {item.nameZh}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" noWrap display="block">
                                {item.city}
                              </Typography>
                              <Box sx={{ mt: 1 }}>{getStatusChip(item.status)}</Box>
                            </Box>
                          </Stack>
                        </Card>
                      );
                    })}
                  </Stack>
                )}
              </Box>
            </Card>
          </Box>

          <Box sx={{ flexGrow: 1, minWidth: 0, width: '100%' }}>
            <Box component="form" onSubmit={onSubmit}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 3 }} spacing={2}>
                <Box>
                  <Typography variant="h5" fontWeight={800} color="text.primary">
                    {selectedId ? '编辑酒店信息' : '录入新酒店'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedId ? '修改信息需重新审核' : '填写完整信息以便快速通过审核'}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  {selectedId ? (
                    <Button variant="outlined" color="inherit" onClick={handleReset} startIcon={<AddIcon />}>
                      录入新酒店
                    </Button>
                  ) : null}
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    disabled={loading}
                    sx={{ px: 4, borderRadius: 2, boxShadow: 4 }}
                  >
                    {selectedId ? '保存修改' : '立即创建'}
                  </Button>
                </Stack>
              </Stack>

              <Card
                sx={{
                  mb: 3,
                  borderRadius: 3.5,
                  border: '1px solid rgba(15, 23, 42, 0.06)',
                  bgcolor: 'rgba(255,255,255,0.82)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 16px 40px rgba(15,23,42,0.08)',
                }}
              >
                <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                    <Box sx={{ width: 4, height: 26, bgcolor: 'primary.main', borderRadius: 4 }} />
                    <Typography variant="h6" fontWeight={700}>基本信息</Typography>
                  </Stack>

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField label="酒店名称 (中文)" value={values.nameZh} onChange={(ev) => setField('nameZh', ev.target.value)} fullWidth required />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField label="酒店名称 (英文)" value={values.nameEn} onChange={(ev) => setField('nameEn', ev.target.value)} fullWidth required />
                    </Grid>
                    {selectedId && !addressEditMode ? (
                      <Grid item xs={12}>
                        <Stack spacing={1.5}>
                          <TextField label="详细地址" value={values.address || ''} fullWidth multiline rows={2} InputProps={{ readOnly: true }} />
                          <Box>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => {
                                setAddressEditMode(true);
                                setValues((v) => ({
                                  ...v,
                                  provinceCode: v.provinceCode || '',
                                  cityCode: v.cityCode || '',
                                  districtCode: v.districtCode || '',
                                  streetAddress: v.streetAddress || v.address || '',
                                }));
                              }}
                            >
                              编辑地址
                            </Button>
                          </Box>
                        </Stack>
                      </Grid>
                    ) : (
                      <>
                        <Grid item xs={12} md={4}>
                          <Autocomplete
                            options={provinceOptions}
                            value={provinceOptions.find((x) => x.code === values.provinceCode) || null}
                            onChange={(e2, next) => {
                              setValues((v) => ({
                                ...v,
                                provinceCode: next?.code || '',
                                cityCode: '',
                                districtCode: '',
                              }));
                            }}
                            getOptionLabel={(opt) => (opt ? opt.name : '')}
                            renderInput={(params) => <TextField {...params} label="省" fullWidth required />}
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Autocomplete
                            options={cityOptions}
                            value={cityOptions.find((x) => x.code === values.cityCode) || null}
                            onChange={(e2, next) => {
                              setValues((v) => ({ ...v, cityCode: next?.code || '', districtCode: '' }));
                            }}
                            getOptionLabel={(opt) => (opt ? opt.name : '')}
                            disabled={!values.provinceCode || isMunicipality}
                            renderInput={(params) => <TextField {...params} label="市" fullWidth required={!isMunicipality} />}
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Autocomplete
                            options={districtOptions}
                            value={districtOptions.find((x) => x.code === values.districtCode) || null}
                            onChange={(e2, next) => {
                              setValues((v) => ({ ...v, districtCode: next?.code || '' }));
                            }}
                            getOptionLabel={(opt) => (opt ? opt.name : '')}
                            disabled={!values.cityCode}
                            renderInput={(params) => <TextField {...params} label="区/县" fullWidth required />}
                          />
                        </Grid>
                      </>
                    )}
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="酒店星级"
                        type="number"
                        value={values.star}
                        onChange={(ev) => setField('star', ev.target.value)}
                        fullWidth
                        required
                        InputProps={{
                          inputProps: { min: 1, max: 5 },
                          startAdornment: <InputAdornment position="start"><StarIcon sx={{ color: '#f59e0b' }} fontSize="small" /></InputAdornment>
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField label="开业时间" type="date" value={values.openTime} onChange={(ev) => setField('openTime', ev.target.value)} fullWidth required InputLabelProps={{ shrink: true }} />
                    </Grid>
                    {!selectedId || addressEditMode ? (
                      <Grid item xs={12}>
                        <TextField
                          label="街道地址"
                          value={values.streetAddress}
                          onChange={(ev) => setField('streetAddress', ev.target.value)}
                          fullWidth
                          required
                          multiline
                          rows={2}
                          helperText={provinceName ? `将保存为：${provinceName}${isMunicipality ? '' : (cityName || '')}${districtName || ''}${values.streetAddress || ''}` : ''}
                        />
                      </Grid>
                    ) : null}

                    <Grid item xs={12}>
                      <TextField label="酒店简介" value={values.description} onChange={(ev) => setField('description', ev.target.value)} fullWidth multiline rows={3} />
                    </Grid>
                    <Grid item xs={12}>
                      <Autocomplete
                        multiple
                        freeSolo
                        options={[]}
                        sx={{
                          '& .MuiAutocomplete-inputRoot': {
                            flexWrap: 'nowrap',
                          },
                          '& .MuiAutocomplete-input': {
                            minWidth: 220,
                            flexGrow: 1,
                          },
                        }}
                        value={Array.isArray(values.facilities) ? values.facilities : []}
                        onChange={(e2, next) => {
                          const cleaned = normalizeFacilitiesList(next);
                          setValues((v) => ({ ...v, facilities: cleaned, facilitiesText: cleaned.join('，') }));
                        }}
                        renderTags={(tagValue, getTagProps) => {
                          if (!tagValue || tagValue.length === 0) return null;
                          return (
                            <Box
                              sx={{
                                display: 'flex',
                                flexWrap: 'nowrap',
                                alignItems: 'center',
                                gap: 1,
                                overflowX: 'auto',
                                maxWidth: '100%',
                                pr: 0.5,
                                '&::-webkit-scrollbar': { height: 6 },
                                '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: 999 },
                              }}
                            >
                              {tagValue.map((option, index) => (
                                <Chip
                                  variant="outlined"
                                  label={option}
                                  {...getTagProps({ index })}
                                  key={option + index}
                                  sx={{ flex: '0 0 auto' }}
                                />
                              ))}
                            </Box>
                          );
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="设施服务"
                            placeholder="输入后回车"
                            fullWidth
                            
                            inputProps={{
                              ...params.inputProps,
                              style: { minWidth: 220 },
                            }}
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
                        <TextField
                          label="经度(lng)"
                          value={values.lng}
                          onChange={(ev) => setField('lng', ev.target.value)}
                          size="small"
                          sx={{ maxWidth: 220 }}
                        />
                        <TextField
                          label="纬度(lat)"
                          value={values.lat}
                          onChange={(ev) => setField('lat', ev.target.value)}
                          size="small"
                          sx={{ maxWidth: 220 }}
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          disabled={geoLoading}
                          onClick={autoGeocodeFromAddress}
                          sx={{ whiteSpace: 'nowrap' }}
                        >
                          {geoLoading ? '定位中...' : '根据地址自动定位'}
                        </Button>
                      </Stack>
                      {(() => {
                        const composed = `${provinceName || ''}${isMunicipality ? '' : (cityName || '')}${districtName || ''}${values.streetAddress || ''}`;
                        const mapKeyword = composed.trim() || (values.nameZh || '').trim();
                        return (
                          <HotelMap
                            api={api}
                            lng={values.lng}
                            lat={values.lat}
                            defaultKeyword={mapKeyword}
                            defaultCity={cityForMap}
                            onChange={({ lng, lat }) => {
                              setValues((v) => ({ ...v, lng: String(lng), lat: String(lat) }));
                            }}
                          />
                        );
                      })()}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card
                sx={{
                  mb: 3,
                  borderRadius: 3.5,
                  border: '1px solid rgba(15, 23, 42, 0.06)',
                  bgcolor: 'rgba(255,255,255,0.82)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 16px 40px rgba(15,23,42,0.08)',
                }}
              >
                <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                    <Box sx={{ width: 4, height: 26, bgcolor: 'secondary.main', borderRadius: 4 }} />
                    <Typography variant="h6" fontWeight={700}>媒体资料</Typography>
                  </Stack>

                  <Grid container spacing={4}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>酒店图片</Typography>
                      <UploadZone label="上传图片" accept="image/*" onChange={onPickImages} icon={AddPhotoIcon} loading={uploadLoading} />
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 2 }}>
                        {(values.images || []).map((url, idx) => (
                          <Box key={idx} sx={{ position: 'relative', width: 96, height: 96, borderRadius: 2, overflow: 'hidden', border: '1px solid #e2e8f0', '&:hover .delete-btn': { opacity: 1 } }}>
                            <img src={getMediaUrl(url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <IconButton className="delete-btn" onClick={() => removeMedia('images', idx)} size="small" sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(239, 68, 68, 0.9)', color: 'white', opacity: 0, '&:hover': { bgcolor: 'error.main' }, p: 0.5 }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>宣传视频</Typography>
                      <UploadZone label="上传视频" accept="video/*" onChange={onPickVideos} icon={VideoIcon} loading={uploadLoading} />
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 2 }}>
                        {(values.videos || []).map((url, idx) => (
                          <Box key={idx} sx={{ position: 'relative', width: 180, height: 110, borderRadius: 2, overflow: 'hidden', border: '1px solid #e2e8f0', bgcolor: '#000', '&:hover .delete-btn': { opacity: 1 } }}>
                            <video src={getMediaUrl(url)} muted controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <IconButton className="delete-btn" onClick={() => removeMedia('videos', idx)} size="small" sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(239, 68, 68, 0.9)', color: 'white', opacity: 0, '&:hover': { bgcolor: 'error.main' }, p: 0.5 }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card
                sx={{
                  mb: 3,
                  borderRadius: 3.5,
                  border: '1px solid rgba(15, 23, 42, 0.06)',
                  bgcolor: 'rgba(255,255,255,0.82)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 16px 40px rgba(15,23,42,0.08)',
                }}
              >
                <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Box sx={{ width: 4, height: 26, bgcolor: 'success.main', borderRadius: 4 }} />
                      <Typography variant="h6" fontWeight={700}>房型价格</Typography>
                    </Stack>
                    <Button startIcon={<AddIcon />} variant="outlined" color="success" onClick={addRoom} size="small">
                      添加房型
                    </Button>
                  </Stack>

                  <Grid container spacing={2}>
                    {values.roomTypes.map((r, idx) => (
                      <Grid item xs={12} md={6} key={idx}>
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2, borderLeft: '4px solid', borderLeftColor: 'success.light', '&:hover': { boxShadow: 2 } }}>
                          <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main' }}>
                            <RoomIcon />
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <TextField
                              variant="standard"
                              placeholder="房型名称 (如: 豪华大床房)"
                              value={r.name}
                              onChange={(ev) => setRoomField(idx, 'name', ev.target.value)}
                              fullWidth
                              InputProps={{ disableUnderline: true, style: { fontWeight: 600, fontSize: '0.95rem' } }}
                            />
                            <TextField
                              variant="standard"
                              placeholder="0"
                              type="number"
                              value={r.price}
                              onChange={(ev) => setRoomField(idx, 'price', ev.target.value)}
                              InputProps={{ disableUnderline: true, style: { color: theme.palette.success.dark, fontWeight: 500 } }}
                            />
                          </Box>
                          <IconButton onClick={() => removeRoom(idx)} sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                            <DeleteIcon />
                          </IconButton>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Stack>
      </Container>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={closeSnack} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={closeSnack} severity={snack.severity} variant="filled" sx={{ width: '100%', boxShadow: 4, fontWeight: 500 }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}