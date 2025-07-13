import React from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../config/api';

function LogoutButton({ className }) {
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await apiService.logout();
      // Here you can also clear any user state in your application
      navigate('/login'); // Redirect to login page
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <button onClick={logout} className={`text-sm ${className}`}>Logout</button>
  );
}

export default LogoutButton;
