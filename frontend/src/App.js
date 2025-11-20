import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Register from './pages/Register';
import Login from './pages/Login';
import UserDashboard from './pages/UserDashboard';
import BeekeeperDashboard from './pages/BeekeeperDashboard';
import AdminDashboard from './pages/AdminDashboard';
import HoneyStore from './pages/HoneyStore';
import OrderHistory from './pages/OrderHistory';
import MyAccount from './pages/MyAccount';
import TrackingPage from './pages/TrackingPage';

function App() {
  const [role, setRole] = useState(localStorage.getItem('role') || '');

  const handleSetRole = (newRole) => {
    setRole(newRole);
    localStorage.setItem('role', newRole);
  };

  // Role-based dashboard routing
  const Dashboard = () => {
    if (role === 'user') return <UserDashboard setRole={handleSetRole} />;
    if (role === 'beekeeper') return <BeekeeperDashboard setRole={handleSetRole} />;
    if (role === 'admin') return <AdminDashboard setRole={handleSetRole} />;
    return <Navigate to="/" />;
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login setRole={handleSetRole} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/honey-store" element={role === 'user' ? <HoneyStore /> : <Navigate to="/" />} />
        <Route path="/account" element={role ? <MyAccount /> : <Navigate to="/" />} />
        <Route path="/order-history" element={role === 'user' ? <OrderHistory /> : <Navigate to="/" />} />
        <Route path="/track" element={<TrackingPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;