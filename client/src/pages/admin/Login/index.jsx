import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setToken, setUser } from '../../../store/userSlice.js';
import { useApi } from '../../../hooks/useApi.js';

export default function AdminLogin() {
  const api = useApi();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [role, setRole] = useState('merchant');
  const [error, setError] = useState('');

  async function onSubmit() {
    setError('');
    try {
      if (mode === 'register') {
        const res = await api.post('/api/auth/register', { username, password, role });
        dispatch(setToken(res.data.token));
        dispatch(setUser(res.data.user));
      } else {
        const res = await api.post('/api/auth/login', { username, password });
        dispatch(setToken(res.data.token));
        dispatch(setUser(res.data.user));
      }

      const me = await api.get('/api/auth/me');
      const r = me.data.user?.role;
      if (r === 'admin') navigate('/admin/audit');
      else navigate('/admin/merchant/hotel-edit');
    } catch (e) {
      setError(e.message || '失败');
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 420, margin: '0 auto' }}>
      <h2>登录 / 注册</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={() => setMode('login')} style={{ padding: '6px 10px' }}>登录</button>
        <button onClick={() => setMode('register')} style={{ padding: '6px 10px' }}>注册</button>
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="用户名" style={{ padding: 8 }} />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="密码" type="password" style={{ padding: 8 }} />

        {mode === 'register' ? (
          <select value={role} onChange={(e) => setRole(e.target.value)} style={{ padding: 8 }}>
            <option value="merchant">商户</option>
            <option value="admin">管理员</option>
          </select>
        ) : null}

        <button onClick={onSubmit} style={{ padding: 10 }}>提交</button>
        {error ? <div style={{ color: 'crimson' }}>{error}</div> : null}

        <div style={{ fontSize: 12, opacity: 0.7 }}>
          默认管理员账号：admin / admin123
        </div>
      </div>
    </div>
  );
}
