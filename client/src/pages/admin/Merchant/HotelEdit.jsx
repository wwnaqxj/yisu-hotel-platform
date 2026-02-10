import React, { useEffect, useState } from 'react';
import { useApi } from '../../../hooks/useApi.js';

export default function HotelEdit() {
  const api = useApi();

  const [nameZh, setNameZh] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [star, setStar] = useState(5);
  const [openTime, setOpenTime] = useState('2020-01-01');

  const [roomName, setRoomName] = useState('标准间');
  const [roomPrice, setRoomPrice] = useState(299);

  const [myHotels, setMyHotels] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function refresh() {
    const res = await api.get('/api/merchant/hotel/list');
    setMyHotels(res.data.items || []);
  }

  useEffect(() => {
    refresh().catch(() => {});
  }, []);

  async function onSave() {
    setError('');
    setMessage('');
    try {
      const res = await api.post('/api/merchant/hotel', {
        nameZh,
        nameEn,
        city,
        address,
        star,
        openTime,
        roomTypes: [{ name: roomName, price: roomPrice }],
      });
      setMessage(`已保存，状态：${res.data.hotel.status}`);
      await refresh();
    } catch (e) {
      setError(e.message || '保存失败');
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: '0 auto' }}>
      <h2>商户：酒店信息录入 / 编辑</h2>

      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
        <input value={nameZh} onChange={(e) => setNameZh(e.target.value)} placeholder="酒店名（中文）" style={{ padding: 8 }} />
        <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="酒店名（英文）" style={{ padding: 8 }} />
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="城市" style={{ padding: 8 }} />
        <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="地址" style={{ padding: 8 }} />
        <input value={star} onChange={(e) => setStar(Number(e.target.value))} placeholder="星级" type="number" style={{ padding: 8 }} />
        <input value={openTime} onChange={(e) => setOpenTime(e.target.value)} placeholder="开业时间" style={{ padding: 8 }} />

        <input value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="房型名称" style={{ padding: 8 }} />
        <input value={roomPrice} onChange={(e) => setRoomPrice(Number(e.target.value))} placeholder="房型价格" type="number" style={{ padding: 8 }} />
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={onSave} style={{ padding: '8px 12px' }}>保存（提交审核）</button>
        {error ? <div style={{ color: 'crimson', marginTop: 8 }}>{error}</div> : null}
        {message ? <div style={{ color: 'green', marginTop: 8 }}>{message}</div> : null}
      </div>

      <div style={{ marginTop: 20 }}>
        <h3>我的酒店</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          {myHotels.map((h) => (
            <div key={h.id} style={{ padding: 10, border: '1px solid #e5e7eb', borderRadius: 10 }}>
              <div style={{ fontWeight: 600 }}>{h.nameZh} / {h.nameEn}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>状态：{h.status}{h.rejectReason ? `（原因：${h.rejectReason}）` : ''}</div>
            </div>
          ))}
          {myHotels.length === 0 ? <div style={{ fontSize: 12, opacity: 0.7 }}>暂无数据</div> : null}
        </div>
      </div>
    </div>
  );
}
