import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  Paper,
  Snackbar,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Hotel as HotelIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Visibility as OnlineIcon,
  VisibilityOff as OfflineIcon,
  Warning as WarningIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useApi } from '../../../hooks/useApi.js';

// ─── Constants ─────────────────────────────────────────────────────────────

const TABS = [
  { value: 'pending', label: '待审核', color: '#f59e0b', bg: '#fffbeb', icon: '🕐' },
  { value: 'approved', label: '已发布', color: '#10b981', bg: '#ecfdf5', icon: '✅' },
  { value: 'rejected', label: '已驳回', color: '#ef4444', bg: '#fef2f2', icon: '❌' },
  { value: 'offline', label: '已下线', color: '#6b7280', bg: '#f9fafb', icon: '📴' },
];

const STATUS_META = {
  pending: { label: '审核中', color: 'warning' },
  approved: { label: '已发布', color: 'success' },
  rejected: { label: '已驳回', color: 'error' },
  offline: { label: '已下线', color: 'default' },
};

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatusChip({ status }) {
  const m = STATUS_META[status] || STATUS_META.pending;
  return (
    <Chip
      label={m.label}
      color={m.color}
      size="small"
      variant="outlined"
      sx={{ fontWeight: 700, fontSize: 12 }}
    />
  );
}

function StarBadge({ count }) {
  return (
    <Chip
      label={'★'.repeat(count) + ' ' + count + '星'}
      size="small"
      sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 600, fontSize: 11 }}
    />
  );
}

/** Hotel detail drawer */
function DetailDrawer({ hotel, open, onClose }) {
  if (!hotel) return null;
  const img = Array.isArray(hotel.images) ? hotel.images[0] : hotel.images;
  const facilities = Array.isArray(hotel.facilities) ? hotel.facilities : [];
  const rooms = hotel.rooms || [];

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 480, p: 0 } }}>
      {/* Header image */}
      {img && (
        <Box
          component="img"
          src={img}
          alt={hotel.nameZh}
          sx={{ width: '100%', height: 200, objectFit: 'cover' }}
        />
      )}
      {!img && (
        <Box sx={{ height: 200, bgcolor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <HotelIcon sx={{ fontSize: 64, color: '#cbd5e1' }} />
        </Box>
      )}

      <Box sx={{ p: 3 }}>
        {/* Title */}
        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
          <Typography variant="h6" fontWeight={700}>
            {hotel.nameZh}
          </Typography>
          <StatusChip status={hotel.status} />
        </Stack>
        <Typography variant="body2" color="text.secondary" mb={0.5}>
          {hotel.nameEn}
        </Typography>

        <Divider sx={{ my: 2 }} />

        {/* Info grid */}
        {[
          ['城市', hotel.city],
          ['地址', hotel.address],
          ['星级', <StarBadge key="star" count={hotel.star} />],
          ['开业时间', hotel.openTime],
          ['最低价格', hotel.minPrice ? `¥${hotel.minPrice}/晚` : '—'],
          ['提交者', hotel.owner?.username || '—'],
          ['更新时间', new Date(hotel.updatedAt).toLocaleString('zh-CN')],
        ].map(([k, v]) => (
          <Stack direction="row" spacing={2} key={k} mb={1.5} alignItems="center">
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 72 }}>
              {k}
            </Typography>
            <Box sx={{ flex: 1 }}>
              {typeof v === 'string' ? (
                <Typography variant="body2">{v}</Typography>
              ) : v}
            </Box>
          </Stack>
        ))}

        {/* Description */}
        <Box mt={2} mb={2}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
            酒店简介
          </Typography>
          <Typography variant="body2" mt={0.5} color="text.primary" sx={{ lineHeight: 1.7 }}>
            {hotel.description || '暂无简介'}
          </Typography>
        </Box>

        {/* Facilities */}
        {facilities.length > 0 && (
          <Box mb={2}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
              设施服务
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1} mt={1}>
              {facilities.map((f) => (
                <Chip key={f} label={f} size="small" sx={{ bgcolor: '#e0f2fe', color: '#0369a1' }} />
              ))}
            </Stack>
          </Box>
        )}

        {/* Rooms */}
        {rooms.length > 0 && (
          <Box mb={2}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
              房型价格
            </Typography>
            {rooms.map((r) => (
              <Stack key={r.id} direction="row" justifyContent="space-between" alignItems="center" mt={1}
                sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 1 }}>
                <Typography variant="body2">{r.name}</Typography>
                <Typography variant="body2" fontWeight={700} color="error.main">¥{r.price}</Typography>
              </Stack>
            ))}
          </Box>
        )}

        {/* Reject reason */}
        {hotel.rejectReason && (
          <Alert severity="error" icon={<WarningIcon />} sx={{ mt: 1 }}>
            <Typography variant="caption" fontWeight={600}>驳回原因</Typography>
            <Typography variant="body2" mt={0.5}>{hotel.rejectReason}</Typography>
          </Alert>
        )}
      </Box>
    </Drawer>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function AuditList() {
  const api = useApi();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('pending');
  const [items, setItems] = useState([]);
  const [countMap, setCountMap] = useState({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);          // 0-based for MUI
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [draftKeyword, setDraftKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  // Reject dialog
  const [rejectDlg, setRejectDlg] = useState({ open: false, id: null });
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Detail drawer
  const [drawerHotel, setDrawerHotel] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ── Data fetching ────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/admin/audit', {
        params: { status: activeTab, page: page + 1, pageSize, keyword },
      });
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
      setCountMap(res.data.countMap || {});
    } catch (e) {
      setError(e.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, pageSize, keyword, api]);

  useEffect(() => { refresh(); }, [refresh]);

  // ── Tab change resets page ───────────────────────────────────────────────
  function handleTabChange(_, val) {
    setActiveTab(val);
    setPage(0);
  }

  // ── Search ───────────────────────────────────────────────────────────────
  function handleSearch(e) {
    e.preventDefault();
    setKeyword(draftKeyword);
    setPage(0);
  }

  // ── Actions ──────────────────────────────────────────────────────────────
  async function doAction(action, id, payload = {}) {
    setActionLoading(true);
    try {
      if (action === 'approve') await api.post(`/api/admin/audit/${id}/approve`);
      if (action === 'reject') await api.post(`/api/admin/audit/${id}/reject`, payload);
      if (action === 'offline') await api.post(`/api/admin/hotel/${id}/offline`);
      if (action === 'online') await api.post(`/api/admin/hotel/${id}/online`);

      const msgs = {
        approve: '审核通过，酒店已发布',
        reject: '已驳回该酒店申请',
        offline: '酒店已下线',
        online: '酒店已恢复上线',
      };
      setSnack({ open: true, msg: msgs[action], severity: 'success' });
      setRejectDlg({ open: false, id: null });
      setRejectReason('');
      await refresh();
    } catch (e) {
      setSnack({ open: true, msg: e.message || '操作失败', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  // ── Detail Drawer ────────────────────────────────────────────────────────
  async function openDetail(id) {
    try {
      const res = await api.get(`/api/admin/audit/${id}`);
      setDrawerHotel(res.data.hotel);
      setDrawerOpen(true);
    } catch (e) {
      setSnack({ open: true, msg: '获取详情失败', severity: 'error' });
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: '#0f172a',
          borderBottom: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: 64 }}>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{ color: '#ffffff', letterSpacing: 1 }}
          >
            易宿管理中心
          </Typography>
          <Tooltip title="个人中心">
            <IconButton
              edge="end"
              color="inherit"
              onClick={() => navigate('/admin/profile')}
            >
              <PersonIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Toolbar />

      <Box sx={{ bgcolor: '#f1f5f9', minHeight: '100vh', p: 3 }}>

        {/* ── Page header ── */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={800}
            sx={{ background: 'linear-gradient(90deg,#2563eb,#7c3aed)', backgroundClip: 'text', color: 'transparent' }}>
            酒店审核管理
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            对商户提交的酒店进行审核、发布、下线或恢复上线操作
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={refresh} disabled={loading}>
          刷新
        </Button>
      </Stack>

        {/* ── Stat cards row ── */}
      <Stack direction="row" spacing={2} mb={3}>
        {TABS.map((t) => (
          <Paper key={t.value}
            onClick={() => handleTabChange(null, t.value)}
            sx={{
              flex: 1, p: 2, borderRadius: 3, cursor: 'pointer',
              border: activeTab === t.value ? `2px solid ${t.color}` : '2px solid transparent',
              bgcolor: activeTab === t.value ? t.bg : '#fff',
              transition: 'all 0.18s',
              '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.1)' },
            }}>
            <Typography variant="h3" sx={{ lineHeight: 1, mb: 0.5 }}>{t.icon}</Typography>
            <Typography variant="h5" fontWeight={800} sx={{ color: t.color }}>
              {countMap[t.value] ?? 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">{t.label}</Typography>
          </Paper>
        ))}
      </Stack>

        {/* ── Main table card ── */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, bgcolor: '#fff' }}>
          <Tabs value={activeTab} onChange={handleTabChange} textColor="primary" indicatorColor="primary">
            {TABS.map((t) => (
              <Tab
                key={t.value}
                value={t.value}
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <span>{t.label}</span>
                    {(countMap[t.value] > 0) && (
                      <Chip
                        label={countMap[t.value]}
                        size="small"
                        sx={{ height: 20, bgcolor: t.color, color: '#fff', fontWeight: 700, fontSize: 11 }}
                      />
                    )}
                  </Stack>
                }
                sx={{ fontWeight: 600, minHeight: 56 }}
              />
            ))}
          </Tabs>
        </Box>

        {/* Search bar */}
        <Box sx={{ px: 3, py: 2, bgcolor: '#fafafa', borderBottom: '1px solid #e5e7eb' }}>
          <Box component="form" onSubmit={handleSearch}>
            <TextField
              size="small"
              placeholder="搜索酒店名称 / 城市 / 地址…"
              value={draftKeyword}
              onChange={(e) => setDraftKeyword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                  </InputAdornment>
                ),
                endAdornment: draftKeyword && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => { setDraftKeyword(''); setKeyword(''); setPage(0); }}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ width: 360, bgcolor: '#fff', borderRadius: 2 }}
            />
            <Button type="submit" variant="contained" sx={{ ml: 1.5, borderRadius: 2 }}>搜索</Button>
          </Box>
        </Box>

        {/* Table */}
        <TableContainer sx={{ minHeight: 400 }}>
          {loading ? (
            <Stack alignItems="center" justifyContent="center" sx={{ height: 400 }}>
              <CircularProgress />
            </Stack>
          ) : error ? (
            <Box sx={{ p: 4 }}><Alert severity="error">{error}</Alert></Box>
          ) : items.length === 0 ? (
            <Stack alignItems="center" justifyContent="center" sx={{ height: 400, opacity: 0.5 }}>
              <HotelIcon sx={{ fontSize: 64, mb: 1.5, color: '#cbd5e1' }} />
              <Typography color="text.secondary">暂无相关酒店数据</Typography>
            </Stack>
          ) : (
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  {['酒店信息', '城市', '星级', '最低价', '提交时间', '状态', '操作'].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, color: '#64748b', fontSize: 13 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow
                    key={item.id}
                    sx={{ '&:hover': { bgcolor: '#f8fafc' }, transition: 'background 0.15s' }}
                  >
                    {/* Hotel Info */}
                    <TableCell sx={{ maxWidth: 280 }}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar
                          src={Array.isArray(item.images) ? item.images[0] : item.images}
                          variant="rounded"
                          sx={{ width: 56, height: 56, bgcolor: '#e2e8f0' }}
                        >
                          <HotelIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={700} noWrap sx={{ maxWidth: 200 }}>
                            {item.nameZh}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200, display: 'block' }}>
                            {item.nameEn}
                          </Typography>
                          {/* Rejected reason inline */}
                          {item.status === 'rejected' && item.rejectReason && (
                            <Tooltip title={item.rejectReason} arrow>
                              <Chip
                                icon={<WarningIcon sx={{ fontSize: '14px !important' }} />}
                                label="查看驳回原因"
                                size="small"
                                color="error"
                                variant="outlined"
                                sx={{ mt: 0.5, fontSize: 11, cursor: 'pointer' }}
                              />
                            </Tooltip>
                          )}
                        </Box>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">{item.city}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 160, display: 'block' }}>
                        {item.address}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <StarBadge count={item.star} />
                    </TableCell>

                    <TableCell>
                      {item.minPrice
                        ? <Typography variant="body2" fontWeight={700} color="error.main">¥{item.minPrice}</Typography>
                        : <Typography variant="body2" color="text.disabled">—</Typography>
                      }
                    </TableCell>

                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(item.updatedAt).toLocaleDateString('zh-CN')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {new Date(item.updatedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <StatusChip status={item.status} />
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        {/* Detail */}
                        <Tooltip title="查看详情">
                          <IconButton size="small" onClick={() => openDetail(item.id)} sx={{ color: '#64748b' }}>
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {/* Approve */}
                        {item.status === 'pending' && (
                          <Tooltip title="审核通过">
                            <IconButton
                              size="small"
                              disabled={actionLoading}
                              onClick={() => doAction('approve', item.id)}
                              sx={{ bgcolor: '#ecfdf5', color: '#10b981', '&:hover': { bgcolor: '#d1fae5' } }}
                            >
                              <CheckIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* Reject */}
                        {item.status === 'pending' && (
                          <Tooltip title="驳回">
                            <IconButton
                              size="small"
                              disabled={actionLoading}
                              onClick={() => { setRejectDlg({ open: true, id: item.id }); setRejectReason(''); }}
                              sx={{ bgcolor: '#fef2f2', color: '#ef4444', '&:hover': { bgcolor: '#fee2e2' } }}
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* Offline */}
                        {item.status === 'approved' && (
                          <Tooltip title="下线酒店（可恢复）">
                            <Button
                              size="small"
                              variant="outlined"
                              color="warning"
                              startIcon={<OfflineIcon />}
                              disabled={actionLoading}
                              onClick={() => doAction('offline', item.id)}
                              sx={{ borderRadius: 2, fontSize: 12 }}
                            >
                              下线
                            </Button>
                          </Tooltip>
                        )}

                        {/* Online */}
                        {item.status === 'offline' && (
                          <Tooltip title="恢复上线">
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={<OnlineIcon />}
                              disabled={actionLoading}
                              onClick={() => doAction('online', item.id)}
                              sx={{ borderRadius: 2, fontSize: 12 }}
                            >
                              恢复
                            </Button>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={pageSize}
          onRowsPerPageChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
          rowsPerPageOptions={[10, 15, 25]}
          labelRowsPerPage="每页条数"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / 共${count}条`}
        />
      </Paper>

        {/* ── Reject Dialog ── */}
      <Dialog
        open={rejectDlg.open}
        onClose={() => setRejectDlg({ open: false, id: null })}
        maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <WarningIcon color="error" />
            <span>驳回审核</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            驳回原因将展示给商户，请详细说明，帮助商户正确修改后重新提交。
          </Alert>
          <TextField
            autoFocus
            label="驳回原因"
            fullWidth multiline rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="例如：酒店图片模糊，无法清晰展示客房设施；地址信息不完整，缺少门牌号…"
            helperText={`${rejectReason.length} 字`}
            error={rejectReason.length > 0 && rejectReason.trim().length < 5}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setRejectDlg({ open: false, id: null })} sx={{ borderRadius: 2 }}>
            取消
          </Button>
          <Button
            variant="contained" color="error"
            disabled={!rejectReason.trim() || rejectReason.trim().length < 5 || actionLoading}
            onClick={() => doAction('reject', rejectDlg.id, { reason: rejectReason })}
            sx={{ borderRadius: 2 }}
          >
            {actionLoading ? '提交中…' : '确认驳回'}
          </Button>
        </DialogActions>
      </Dialog>

        {/* ── Detail Drawer ── */}
      <DetailDrawer hotel={drawerHotel} open={drawerOpen} onClose={() => setDrawerOpen(false)} />

        {/* ── Snackbar ── */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} variant="filled" sx={{ borderRadius: 2 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
      </Box>
    </>
  );
}
