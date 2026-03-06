import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const TeacherRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" />;
  }

  try {
    const decodedToken = jwtDecode(token);
    if (decodedToken.user.role === 'Teacher' || decodedToken.user.role === 'Admin') {
      return children;
    } else {
      return <Navigate to="/" />;
    }
  } catch (error) {
    return <Navigate to="/login" />;
  }
};

export default TeacherRoute;
