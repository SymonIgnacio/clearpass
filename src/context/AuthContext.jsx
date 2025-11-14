
import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // For now, we'll simulate the logged-in user.
  // We can switch the role to 'Admin', 'Staff', or 'Resident' to test.
  const [user, setUser] = useState({
    name: 'Juan dela Cruz',
    role: 'Admin', // Can be 'Admin', 'Staff', or 'Resident'
  });

  const login = (role) => {
    setUser({ ...user, role });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
