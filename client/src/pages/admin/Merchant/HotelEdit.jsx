import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  AppBar,
  Avatar,
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
  LocationOn as LocationIcon,
  Star as StarIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  VideoCameraBack as VideoIcon,
  RoomService as RoomIcon, // 房型图标
  Store as StoreIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';

import { useApi } from '../../../hooks/useApi';
import { useAuth } from '../../../hooks/useAuth.js';
import { logout as logoutAction } from '../../../store/userSlice.js';

// --- 工具函数：处理日期 ---
function toDateInputValue(v) {
  if (!v) return '';
  const d = dayjs(v);
  return d.isValid() ? d.format('YYYY-MM-DD') : '';
}

// --- 1. 新增：配置你的后端地址 ---
const API_BASE_URL = 'http://192.168.249.94:3001';

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

  // --- 状态管理 ---
  const [loading, setLoading] = useState(false); // 全局/提交加载
  const [uploadLoading, setUploadLoading] = useState(false); // 上传加载
  const [listLoading, setListLoading] = useState(false); // 列表加载
  const [myHotels, setMyHotels] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [currentTime, setCurrentTime] = useState(dayjs().format('YYYY-MM-DD HH:mm'));
  
  // 消息提示 Snackbar
  const [snack, setSnack] = useState({ open: false, severity: 'info', message: '' });

  // 表单数据
  const [values, setValues] = useState({
    nameZh: '',
    nameEn: '',
    city: '',
    address: '',
    star: 5,
    openTime: toDateInputValue('2020-01-01'),
    description: '',
    facilitiesText: '', // 文本域输入的设施，逗号分隔
    images: [],
    videos: [],
    roomTypes: [{ name: '标准间', price: 299 }],
  });

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
    setValues({
      nameZh: '',
      nameEn: '',
      city: '',
      address: '',
      star: 5,
      openTime: toDateInputValue('2020-01-01'),
      description: '',
      facilitiesText: '',
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
      
      // 数据处理：设施数组转字符串
      let facilitiesStr = '';
      if (Array.isArray(h.facilities)) {
        facilitiesStr = h.facilities.join('，');
      } else if (h.facilities) {
        facilitiesStr = String(h.facilities);
      }

      // 数据处理：媒体可能为 null 或单字符串或数组
      const ensureArray = (item) => {
        if (!item) return [];
        if (Array.isArray(item)) return item;
        return [item]; // 如果是字符串，包一层
      };

      setValues({
        nameZh: h.nameZh || '',
        nameEn: h.nameEn || '',
        city: h.city || '',
        address: h.address || '',
        star: Number(h.star || 5),
        openTime: toDateInputValue(h.openTime),
        description: h.description || '',
        facilitiesText: facilitiesStr,
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
    if (!values.city?.trim()) return '请输入所在城市';
    if (!values.address?.trim()) return '请输入详细地址';
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

  async function onSubmit(e) {
    e.preventDefault();
    const msg = validate();
    if (msg) return notify('warning', msg);

    setLoading(true);
    try {
      const payload = {
        nameZh: values.nameZh,
        nameEn: values.nameEn,
        city: values.city,
        address: values.address,
        star: Number(values.star),
        openTime: values.openTime,
        description: values.description,
        facilities: normalizeFacilities(values.facilitiesText),
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
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
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
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: 64 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar variant="rounded" sx={{ bgcolor: theme.palette.primary.main, fontWeight: 'bold', width: 36, height: 36 }}>
              <StoreIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} color="white" lineHeight={1.2}>
                易宿商户中心
              </Typography>
              <Typography variant="caption" color="rgba(255,255,255,0.5)">
                {currentTime}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
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

      <Container maxWidth={false} sx={{ py: 3, px: 3 }}>
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
                borderRadius: 3,
                border: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              }}
            >
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#fff' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <HotelIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight={700}>我的酒店</Typography>
                </Stack>
                <Tooltip title="刷新列表">
                  <IconButton onClick={refreshList} disabled={listLoading} size="small">
                    {listLoading ? <CircularProgress size={20} /> : <RefreshIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              </Box>

              <Box sx={{ flex: 1, overflowY: 'auto', bgcolor: '#f1f5f9', p: 1.5 }}>
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
                            bgcolor: active ? '#fff' : 'rgba(255,255,255,0.7)',
                            borderRadius: 2,
                            '&:hover': { transform: 'translateY(-2px)', bgcolor: '#fff' }
                          }}
                        >
                          <Stack direction="row" spacing={2}>
                            <Avatar variant="rounded" sx={{ bgcolor: active ? 'primary.main' : 'grey.300', width: 40, height: 40 }}>
                              {(item.nameZh || 'H')[0]}
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

              <Card sx={{ mb: 3, borderRadius: 3, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ p: 4 }}>
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
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="所在城市"
                        value={values.city}
                        onChange={(ev) => setField('city', ev.target.value)}
                        fullWidth
                        required
                        InputProps={{ startAdornment: <InputAdornment position="start"><LocationIcon color="action" fontSize="small" /></InputAdornment> }}
                      />
                    </Grid>
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
                    <Grid item xs={12}>
                      <TextField label="详细地址" value={values.address} onChange={(ev) => setField('address', ev.target.value)} fullWidth required multiline rows={2} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField label="酒店简介" value={values.description} onChange={(ev) => setField('description', ev.target.value)} fullWidth multiline rows={3} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField label="设施服务 (逗号分隔)" value={values.facilitiesText} onChange={(ev) => setField('facilitiesText', ev.target.value)} fullWidth />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card sx={{ mb: 3, borderRadius: 3, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ p: 4 }}>
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

              <Card sx={{ mb: 3, borderRadius: 3, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ p: 4 }}>
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