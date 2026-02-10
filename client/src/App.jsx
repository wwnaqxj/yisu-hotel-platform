import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import AdminLogin from './pages/admin/Login/index.jsx';
import MerchantHotelEdit from './pages/admin/Merchant/HotelEdit.jsx';
import AdminAuditList from './pages/admin/Admin/AuditList.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/login" replace />} />

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/merchant/hotel-edit" element={<MerchantHotelEdit />} />
      <Route path="/admin/audit" element={<AdminAuditList />} />

      <Route path="*" element={<div>Not Found</div>} />
    </Routes>
  );
}
