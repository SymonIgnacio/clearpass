import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const WriteProtected = ({ children, fallback = null }) => {
  const { user } = useAuth();
  
  // Captain (THEMIS role 5) has read-only access
  if (user && Number(user.role) === 5) {
    return fallback;
  }
  
  return children;
};

export default WriteProtected;