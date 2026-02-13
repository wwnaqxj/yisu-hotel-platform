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
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { useApi } from '../../../hooks/useApi';
import { useAuth } from '../../../hooks/useAuth.js';
import { logout as logoutAction } from '../../../store/userSlice.js';

function toDateInputValue(v) {
  if (!v) return '';
  const d = dayjs(v);
  return d.isValid() ? d.format('YYYY-MM-DD') : '';
}

export default function HotelEdit() {
  const api = useApi();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [myHotels, setMyHotels] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [currentTime, setCurrentTime] = useState(dayjs().format('YYYY-MM-DD HH:mm'));

  const [snack, setSnack] = useState({ open: false, severity: 'info', message: '' });

  const [values, setValues] = useState({
    nameZh: '',
    nameEn: '',
    city: '',
    address: '',
    star: 5,
    openTime: toDateInputValue('2020-01-01'),
    roomTypes: [{ name: '标准间', price: 299 }],
  });

  const [menuAnchor, setMenuAnchor] = useState(null);
  const menuOpen = Boolean(menuAnchor);

  const selectedHotel = useMemo(() => {
    return myHotels.find((h) => h.id === selectedId) || null;
  }, [myHotels, selectedId]);

  useEffect(() => {
    refreshList();
    const timer = setInterval(() => {
      setCurrentTime(dayjs().format('YYYY-MM-DD HH:mm'));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  function notify(severity, message) {
    setSnack({ open: true, severity, message });
  }

  function closeSnack() {
    setSnack((s) => ({ ...s, open: false }));
  }

  async function refreshList() {
    setListLoading(true);
    try {
      const res = await api.get('/api/merchant/hotel/list');
      setMyHotels(res.data.items || []);
    } catch (e) {
      notify('error', '加载列表失败');
    } finally {
      setListLoading(false);
    }
  }

  function handleReset() {
    setSelectedId(null);
    setValues({
      nameZh: '',
      nameEn: '',
      city: '',
      address: '',
      star: 5,
      openTime: toDateInputValue('2020-01-01'),
      roomTypes: [{ name: '标准间', price: 299 }],
    });
  }

  async function handleSelectHotel(id) {
    setLoading(true);
    try {
      const res = await api.get(`/api/merchant/hotel/${id}`);
      const h = res.data.hotel;
      const rooms = res.data.rooms || [];

      setSelectedId(h.id);
      setValues({
        nameZh: h.nameZh || '',
        nameEn: h.nameEn || '',
        city: h.city || '',
        address: h.address || '',
        star: Number(h.star || 5),
        openTime: toDateInputValue(h.openTime),
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

  function validate() {
    if (!values.nameZh?.trim()) return '请输入中文名称';
    if (!values.nameEn?.trim()) return '请输入英文名称';
    if (!values.city?.trim()) return '请输入城市';
    if (!values.address?.trim()) return '请输入详细地址';
    const star = Number(values.star);
    if (!Number.isFinite(star) || star < 1 || star > 5) return '星级需为 1~5';
    if (!values.openTime) return '请选择开业时间';

    if (!Array.isArray(values.roomTypes) || values.roomTypes.length < 1) return '至少需要添加一个房型';
    for (let i = 0; i < values.roomTypes.length; i += 1) {
      const r = values.roomTypes[i];
      if (!r?.name?.trim()) return '房型名称不能为空';
      const price = Number(r.price);
      if (!Number.isFinite(price) || price < 0) return '房型价格不合法';
    }
    return '';
  }

  async function onSubmit(e) {
    e.preventDefault();
    const msg = validate();
    if (msg) {
      notify('warning', msg);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        nameZh: values.nameZh,
        nameEn: values.nameEn,
        city: values.city,
        address: values.address,
        star: Number(values.star),
        openTime: values.openTime,
        roomTypes: values.roomTypes.map((r) => ({ name: r.name, price: Number(r.price) })),
      };

      if (selectedId) {
        await api.put(`/api/merchant/hotel/${selectedId}`, payload);
        notify('success', '更新成功，已提交审核');
      } else {
        await api.post('/api/merchant/hotel', payload);
        notify('success', '创建成功，已提交审核');
      }

      await refreshList();
      if (!selectedId) handleReset();
    } catch (e2) {
      notify('error', e2.message || '保存失败');
    } finally {
      setLoading(false);
    }
  }

  function getStatusChip(status, reason) {
    const s = String(status || 'pending');
    if (s === 'Pass' || s === 'approved') return <Chip size="small" color="success" label="已发布" />;
    if (s === 'Reject' || s === 'rejected') return <Chip size="small" color="error" label={reason ? `已驳回` : '已驳回'} />;
    if (s === 'offline') return <Chip size="small" color="warning" label="已下线" />;
    return <Chip size="small" color="info" label="审核中" />;
  }

  function openMenu(e) {
    setMenuAnchor(e.currentTarget);
  }

  function closeMenu() {
    setMenuAnchor(null);
  }

  function onProfile() {
    closeMenu();
    navigate('/admin/profile');
  }

  function onLogout() {
    closeMenu();
    dispatch(logoutAction());
    navigate('/admin/login', { replace: true });
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f6fa' }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: '#0b1530', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Toolbar sx={{ minHeight: 64, display: 'flex', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                bgcolor: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                color: '#fff',
                letterSpacing: 1,
              }}
            >
              Y
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                易宿商户中心
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.65 }}>
                {currentTime}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="账号">
              <IconButton onClick={openMenu} size="small" sx={{ color: '#fff' }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: '#2563eb', fontSize: 14 }}>
                  {(user?.username || 'A').slice(0, 1).toUpperCase()}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>
              {user?.username || 'Account'}
            </Typography>
            <Menu anchorEl={menuAnchor} open={menuOpen} onClose={closeMenu}>
              <MenuItem onClick={onProfile}>个人中心</MenuItem>
              <Divider />
              <MenuItem onClick={onLogout} sx={{ color: 'error.main' }}>
                退出登录
              </MenuItem>
            </Menu>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={4} lg={3}>
            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Stack spacing={0.5}>
                  <Typography sx={{ fontWeight: 800 }}>我的酒店</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    点击左侧酒店可回填编辑
                  </Typography>
                </Stack>
                <Tooltip title="刷新列表">
                  <span>
                    <IconButton onClick={refreshList} disabled={listLoading}>
                      {listLoading ? <CircularProgress size={20} /> : <Typography sx={{ fontWeight: 900 }}>↻</Typography>}
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
              <Divider />

              <Box sx={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
                {listLoading ? (
                  <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress />
                  </Box>
                ) : myHotels.length === 0 ? (
                  <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>暂无酒店数据</Box>
                ) : (
                  <List disablePadding>
                    {myHotels.map((item) => {
                      const active = selectedId === item.id;
                      return (
                        <ListItemButton
                          key={item.id}
                          onClick={() => handleSelectHotel(item.id)}
                          selected={active}
                          sx={{
                            py: 1.5,
                            borderLeft: active ? '4px solid #2563eb' : '4px solid transparent',
                            alignItems: 'flex-start',
                          }}
                        >
                          <Box sx={{ mr: 1.5, mt: 0.5 }}>
                            <Avatar
                              variant="rounded"
                              sx={{ width: 40, height: 40, bgcolor: active ? '#2563eb' : 'rgba(15, 23, 42, 0.08)', color: active ? '#fff' : 'rgba(15,23,42,0.7)' }}
                            >
                              H
                            </Avatar>
                          </Box>
                          <ListItemText
                            primary={
                              <Typography sx={{ fontWeight: 700, color: active ? '#2563eb' : 'text.primary' }}>
                                {item.nameZh}
                              </Typography>
                            }
                            secondary={
                              <Box sx={{ pt: 0.25 }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                  {item.nameEn}
                                </Typography>
                                <Stack direction="row" spacing={1} sx={{ mt: 0.75 }} alignItems="center" justifyContent="space-between">
                                  {getStatusChip(item.status, item.rejectReason)}
                                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    {item.city}
                                  </Typography>
                                </Stack>
                              </Box>
                            }
                          />
                        </ListItemButton>
                      );
                    })}
                  </List>
                )}
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8} lg={9}>
            <Paper variant="outlined" sx={{ borderRadius: 2, p: 2.5, minHeight: 'calc(100vh - 160px)' }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between">
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {selectedId ? '编辑酒店信息' : '录入新酒店'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {selectedId && selectedHotel ? `当前：${selectedHotel.nameZh}` : '填写后提交将进入审核流程'}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  {selectedId ? (
                    <Button onClick={handleReset} variant="outlined">
                      取消编辑
                    </Button>
                  ) : null}
                  <Button onClick={handleReset} variant={selectedId ? 'text' : 'contained'}>
                    新建录入
                  </Button>
                </Stack>
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Box component="form" onSubmit={onSubmit}>
                <Typography sx={{ fontWeight: 800, mb: 1.5 }}>基本信息</Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="酒店名（中文）"
                      value={values.nameZh}
                      onChange={(e) => setField('nameZh', e.target.value)}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="酒店名（英文）"
                      value={values.nameEn}
                      onChange={(e) => setField('nameEn', e.target.value)}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="所在城市"
                      value={values.city}
                      onChange={(e) => setField('city', e.target.value)}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="酒店星级"
                      type="number"
                      value={values.star}
                      onChange={(e) => setField('star', e.target.value)}
                      fullWidth
                      inputProps={{ min: 1, max: 5 }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="开业时间"
                      type="date"
                      value={values.openTime}
                      onChange={(e) => setField('openTime', e.target.value)}
                      fullWidth
                      required
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="详细地址"
                      value={values.address}
                      onChange={(e) => setField('address', e.target.value)}
                      fullWidth
                      required
                      multiline
                      minRows={2}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Stack direction="row" spacing={1} alignItems="baseline" sx={{ mb: 1.5 }}>
                  <Typography sx={{ fontWeight: 800 }}>房型管理</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    至少添加一种房型
                  </Typography>
                </Stack>

                <Paper variant="outlined" sx={{ borderStyle: 'dashed', borderRadius: 2, p: 2, bgcolor: 'rgba(15, 23, 42, 0.02)' }}>
                  <Stack spacing={2}>
                    {values.roomTypes.map((r, idx) => (
                      <Grid container spacing={2} key={idx} alignItems="center">
                        <Grid item xs={12} md={6}>
                          <TextField
                            label={idx === 0 ? '房型名称' : '房型名称'}
                            value={r.name}
                            onChange={(e) => setRoomField(idx, 'name', e.target.value)}
                            fullWidth
                            required
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <TextField
                            label={idx === 0 ? '价格（元）' : '价格（元）'}
                            type="number"
                            value={r.price}
                            onChange={(e) => setRoomField(idx, 'price', e.target.value)}
                            fullWidth
                            required
                            inputProps={{ min: 0 }}
                          />
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <Button color="error" variant="text" onClick={() => removeRoom(idx)}>
                            删除
                          </Button>
                        </Grid>
                      </Grid>
                    ))}

                    <Button variant="outlined" onClick={addRoom}>
                      添加房型
                    </Button>
                  </Stack>
                </Paper>

                <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 3 }}>
                  <Button type="submit" variant="contained" disabled={loading}>
                    {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : selectedId ? '保存修改' : '立即创建'}
                  </Button>
                </Stack>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <Snackbar open={snack.open} autoHideDuration={2600} onClose={closeSnack} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={closeSnack} severity={snack.severity} variant="filled" sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}