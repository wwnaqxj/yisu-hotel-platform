import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.js';
import { SearchProvider } from './context/SearchContext.jsx';

import MerchantHotelEdit from './pages/admin/Merchant/HotelEdit.jsx';
import AdminAuditList from './pages/admin/Admin/AuditList.jsx';
import Profile from './pages/admin/Profile/index.jsx';
import SignIn from './features/auth/SignIn.jsx';
import SignUp from './features/auth/SignUp.jsx';
import MobileHome from './pages/mobile/Home.jsx';
import HotelListPlaceholder from './pages/mobile/HotelList.jsx';

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
    <SearchProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/login" replace />} />

        <Route path="/admin/login" element={<SignIn />} />
        <Route path="/admin/register" element={<SignUp />} />
        <Route
          path="/admin/merchant/hotel-edit"
          element={
            <RequireRole role="merchant">
              <MerchantHotelEdit />
            </RequireRole>
          }
        />
        <Route
          path="/admin/audit"
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

        {/* 用户端移动首页 & 列表占位 */}
        <Route path="/mobile/home" element={<MobileHome />} />
        <Route path="/mobile/list" element={<HotelListPlaceholder />} />

        <Route path="*" element={<div>Not Found</div>} />
      </Routes>
    </SearchProvider>
  );
}
