import React from 'react';
import { useAuth } from '../contexts/useAuth';

const WriteProtected = ({ children, fallback = null }) => {
  const { user } = useAuth();
  
  // Captain (THEMIS role 2) has read-only access
  // Clerk (Role 4) has read-only access to residents list (cannot write)
  if (user && (Number(user.role) === 2 || Number(user.role) === 4)) {
    return fallback;
  }
  
  return children;
};

export default WriteProtected;
