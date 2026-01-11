import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const WriteProtected = ({ children, fallback = null }) => {
  const { user } = useAuth();
  
  // Captain (THEMIS role 2) has read-only access
  if (user && Number(user.role) === 2) {
    return fallback;
  }
  
  return children;
};

export default WriteProtected;