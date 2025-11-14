
import React from 'react';
import { NavLink } from 'react-router-dom';
import { List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { 
  Dashboard, 
  Group, 
  Home, 
  Gavel, 
  Description, 
  BarChart, 
  Campaign 
} from '@mui/icons-material';
import '../App.css'; // Ensure this path is correct if App.css contains sidebar styles

const Sidebar = () => {
  const navItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/' },
    { text: 'Residents', icon: <Group />, path: '/residents' },
    { text: 'Households', icon: <Home />, path: '/households' },
    { text: 'Blotter', icon: <Gavel />, path: '/blotter' },
    { text: 'Certificates', icon: <Description />, path: '/certificates' },
    { text: 'Analytics', icon: <BarChart />, path: '/analytics' },
    { text: 'Announcements', icon: <Campaign />, path: '/announcements' },
  ];

  return (
    <div className="sidebar">
      <List>
        {navItems.map((item) => (
          <ListItem 
            button 
            key={item.text} 
            component={NavLink} 
            to={item.path} 
            style={({ isActive }) => ({ 
              backgroundColor: isActive ? 'var(--hover-color)' : 'transparent',
              borderRight: isActive ? '3px solid var(--primary-color)' : 'none',
              color: isActive ? 'var(--primary-color)' : 'inherit'
            })}
          >
            <ListItemIcon style={{ color: 'inherit' }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </div>
  );
};

export default Sidebar;
