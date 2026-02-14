import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.js';

import AdminLogin from './pages/admin/Login/index.jsx';
import MerchantHotelEdit from './pages/admin/Merchant/HotelEdit.jsx';
import AdminAuditList from './pages/admin/Admin/AuditList.jsx';
import Profile from './pages/admin/Profile/index.jsx';

function RequireAuth({ children }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/admin/login" replace />;
  if (!user) return <div>Loading...</div>;
  return children;
}

function RequireRole({ role, children }) {
  const { token, user } = useAuth();

  if (!token) return <Navigate to="/admin/login" replace />;
  if (!user) return <div>Loading...</div>;
  if (user.role !== role) return <Navigate to="/admin/login" replace />;

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/login" replace />} />

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin/merchant/hotel-edit"
        element={
          <RequireRole role="merchant">
            <MerchantHotelEdit />
          </RequireRole>
        }
      />
      <Route
        p        ath="/admin/audit"
        element={
          <RequireRole role="admin">
            <AdminAuditList />
          </RequireRole>
        }
      />

      <Route
        path="/admin/profile"
        element={
          <RequireAuth>
            <Profile />
          </RequireAuth>
        }
      />

      <Route path="*" element={<div>Not Found</div>} />
    </Routes>
  );
}
