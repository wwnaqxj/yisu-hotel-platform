import React, { useEffect, useState } from 'react';
import { useApi } from '../../../hooks/useApi.js';

export default function AuditList() {
  const api = useApi();

  const [status, setStatus] = useState('pending');
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  async function refresh(nextStatus = status) {
    const res = await api.get('/api/admin/audit', { params: { status: nextStatus } });
    setItems(res.data.items || []);
  }

  useEffect(() => {
    refresh().catch(() => {});
  }, [status]);

  async function onApprove(id) {
    setError('');
    try {
      await api.post(`/api/admin/audit/${id}/approve`);
      await refresh();
    } catch (e) {
      setError(e.message || '失败');
    }
  }

  async function onReject(id) {
    setError('');
    const reason = window.prompt('请输入不通过原因：') || '不通过';
    try {
      await api.post(`/api/admin/audit/${id}/reject`, { reason });
      await refresh();
    } catch (e) {
      setError(e.message || '失败');
    }
  }

  async function onOffline(id) {
    setError('');
    try {
      await api.post(`/api/admin/hotel/${id}/offline`);
      await refresh();
    } catch (e) {
      setError(e.message || '失败');
    }
  }

  async function onOnline(id) {
    setError('');
    try {
      await api.post(`/api/admin/hotel/${id}/online`);
      await refresh();
    } catch (e) {
      setError(e.message || '失败');
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: '0 auto' }}>
      <h2>管理员：酒店审核 / 发布 / 下线</h2>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div>状态：</div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: 8 }}>
          <option value="pending">审核中</option>
          <option value="approved">通过/已发布</option>
          <option value="rejected">不通过</option>
          <option value="offline">已下线</option>
        </select>
        <button onClick={() => refresh()} style={{ padding: '8px 12px' }}>刷新</button>
      </div>

      {error ? <div style={{ color: 'crimson', marginTop: 10 }}>{error}</div> : null}

      <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
        {items.map((h) => (
          <div key={h.id} style={{ padding: 10, border: '1px solid #e5e7eb', borderRadius: 10 }}>
            <div style={{ fontWeight: 600 }}>{h.nameZh} / {h.nameEn}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>状态：{h.status}{h.rejectReason ? `（原因：${h.rejectReason}）` : ''}</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {h.status === 'pending' ? (
                <>
                  <button onClick={() => onApprove(h.id)} style={{ padding: '6px 10px' }}>通过</button>
                  <button onClick={() => onReject(h.id)} style={{ padding: '6px 10px' }}>不通过</button>
                </>
              ) : null}

              {h.status === 'approved' ? (
                <button onClick={() => onOffline(h.id)} style={{ padding: '6px 10px' }}>下线</button>
              ) : null}

              {h.status === 'offline' ? (
                <button onClick={() => onOnline(h.id)} style={{ padding: '6px 10px' }}>恢复上线</button>
              ) : null}
            </div>
          </div>
        ))}
        {items.length === 0 ? <div style={{ fontSize: 12, opacity: 0.7 }}>暂无数据</div> : null}
      </div>
    </div>
  );
}
