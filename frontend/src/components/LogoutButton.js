import React from 'react';
import { useNavigate } from 'react-router-dom';

function LogoutButton({ setRole, className }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setRole('');
    navigate('/');
  };

  return (
    <button onClick={handleLogout} className={className || 'btn btn-danger'}>
      Logout
    </button>
  );
}

export default LogoutButton;