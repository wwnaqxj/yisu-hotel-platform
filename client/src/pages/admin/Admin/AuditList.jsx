import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Tabs,
  Tab,
  Box,
  Card,
  Button,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Grid
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  VisibilityOff as OfflineIcon,
  Visibility as OnlineIcon,
  Refresh as RefreshIcon,
  Hotel as HotelIcon
} from '@mui/icons-material';
import { useApi } from '../../../hooks/useApi.js';

export default function AuditList() {
  const api = useApi();

  const [activeTab, setActiveTab] = useState('pending');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reject Dialog State
  const [rejectDialog, setRejectDialog] = useState({ open: false, id: null });
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    refresh();
  }, [activeTab]);

  async function refresh() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/admin/audit', { params: { status: activeTab } });
      setItems(res.data.items || []);
    } catch (e) {
      setError(e.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action, id, payload = {}) {
    setActionLoading(true);
    try {
      if (action === 'approve') await api.post(`/api/admin/audit/${id}/approve`);
      if (action === 'reject') await api.post(`/api/admin/audit/${id}/reject`, payload);
      if (action === 'offline') await api.post(`/api/admin/hotel/${id}/offline`);
      if (action === 'online') await api.post(`/api/admin/hotel/${id}/online`);

      await refresh();
      setRejectDialog({ open: false, id: null });
      setRejectReason('');
    } catch (e) {
      alert(e.message || '操作失败');
    } finally {
      setActionLoading(false);
    }
  }

  const openRejectDialog = (id) => {
    setRejectDialog({ open: true, id });
    setRejectReason('');
  };

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
    return <Chip label={label} color={color} size="small" variant="outlined" sx={{ fontWeight: 'bold' }} />;
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4, minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="800" gutterBottom sx={{ background: 'linear-gradient(45deg, #2563eb, #3b82f6)', backgroundClip: 'text', color: 'transparent' }}>
            酒店审核管理
          </Typography>
          <Typography variant="body2" color="text.secondary">
            对商户提交的酒店信息进行审核、下架或恢复上线操作
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={refresh}
          disabled={loading}
        >
          刷新列表
        </Button>
      </Stack>

      <Card sx={{ mb: 4, borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="待审核" value="pending" sx={{ fontWeight: 600 }} />
          <Tab label="已发布 / 运营中" value="approved" sx={{ fontWeight: 600 }} />
          <Tab label="已驳回" value="rejected" sx={{ fontWeight: 600 }} />
          <Tab label="已下线" value="offline" sx={{ fontWeight: 600 }} />
        </Tabs>

        <Box sx={{ p: 3, minHeight: 400 }}>
          {loading ? (
            <Stack alignItems="center" justifyContent="center" sx={{ height: 300 }}>
              <CircularProgress />
            </Stack>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : items.length === 0 ? (
            <Stack alignItems="center" justifyContent="center" sx={{ height: 300, opacity: 0.5 }}>
              <HotelIcon sx={{ fontSize: 64, mb: 2, color: 'text.disabled' }} />
              <Typography>暂无相关酒店数据</Typography>
            </Stack>
          ) : (
            <Grid container spacing={3}>
              {items.map((item) => (
                <Grid item xs={12} key={item.id}>
                  <Card variant="outlined" sx={{ p: 2, borderRadius: 2, '&:hover': { boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }, transition: 'all 0.2s' }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={8}>
                        <Stack spacing={1}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="h6" fontWeight="bold">
                              {item.nameZh || '未命名酒店'}
                            </Typography>
                            <Chip label={item.star + '星级'} size="small" sx={{ bgcolor: '#f1f5f9' }} />
                            {getStatusChip(item.status)}
                          </Stack>
                          <Typography variant="body2" color="text.secondary">
                            {item.city} · {item.address}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            提交时间：{new Date(item.updatedAt).toLocaleString()}
                          </Typography>
                          {item.rejectReason && (
                            <Alert severity="error" icon={false} sx={{ py: 0, mt: 1 }}>
                              <Typography variant="caption">驳回原因：{item.rejectReason}</Typography>
                            </Alert>
                          )}
                        </Stack>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                          {item.status === 'pending' && (
                            <>
                              <Button
                                variant="contained"
                                color="success"
                                startIcon={<CheckIcon />}
                                onClick={() => handleAction('approve', item.id)}
                                disabled={actionLoading}
                              >
                                通过
                              </Button>
                              <Button
                                variant="outlined"
                                color="error"
                                startIcon={<CloseIcon />}
                                onClick={() => openRejectDialog(item.id)}
                                disabled={actionLoading}
                              >
                                驳回
                              </Button>
                            </>
                          )}
                          {item.status === 'approved' && (
                            <Button
                              variant="outlined"
                              color="warning"
                              startIcon={<OfflineIcon />}
                              onClick={() => handleAction('offline', item.id)}
                              disabled={actionLoading}
                            >
                              下线酒店
                            </Button>
                          )}
                          {item.status === 'offline' && (
                            <Button
                              variant="outlined"
                              color="primary"
                              startIcon={<OnlineIcon />}
                              onClick={() => handleAction('online', item.id)}
                              disabled={actionLoading}
                            >
                              恢复上线
                            </Button>
                          )}
                        </Stack>
                      </Grid>
                    </Grid>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onClose={() => setRejectDialog({ open: false, id: null })} maxWidth="sm" fullWidth>
        <DialogTitle>驳回审核</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            请详细说明驳回原因，以便商户修改。
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="驳回原因"
            fullWidth
            multiline
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeHolder="例如：酒店图片模糊；地址信息不完整..."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRejectDialog({ open: false, id: null })}>取消</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => handleAction('reject', rejectDialog.id, { reason: rejectReason })}
            disabled={!rejectReason.trim() || actionLoading}
          >
            {actionLoading ? '提交中...' : '确认驳回'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
