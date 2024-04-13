import React from 'react';
import { useNavigate } from 'react-router-dom';

function LogoutButton({ className }) {
  const navigate = useNavigate();

  const logout = async () => {
    try {
      // await fetch('http://localhost:8080/logout', {
      await fetch('https://free-splitwise-f7e9136cd3b7.herokuapp.com/logout', {
        credentials: 'include', // Ensure cookies, such as session cookies, are sent with the request
        redirect: 'follow' // This might be the default, allows following redirects automatically
      });
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
