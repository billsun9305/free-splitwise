import React from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../config/api';

function LogoutButton({ className }) {
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await apiService.logout();
      // Clear JWT token from localStorage
      localStorage.removeItem('jwt_token');
      console.log('JWT token cleared');
      // Here you can also clear any user state in your application
      navigate('/login'); // Redirect to login page
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear token even if logout API fails
      localStorage.removeItem('jwt_token');
      navigate('/login');
    }
  };

  return (
    <button onClick={logout} className={`text-sm ${className}`}>Logout</button>
  );
}

export default LogoutButton;
