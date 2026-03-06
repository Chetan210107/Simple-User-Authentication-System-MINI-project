import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const { user, loading } = useUser();
  
  if (loading) {
    return <div>Loading...</div>;
  }

  if (!token && !user) {
    return <Navigate to="/login" />;
  }

  if (user?.role === 'Admin') {
    return <Navigate to="/admin-dashboard" />;
  }

  return children;
};

export default PrivateRoute;
