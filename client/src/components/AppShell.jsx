import React, { useMemo, useState } from 'react';
import { Box, Container } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Sidebar, { DRAWER_WIDTH } from './Sidebar';
import Header from './Header';

import Chatbot from './Chatbot';
import { useAuth } from '../contexts/useAuth';

const AppShell = ({ children }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  // Check if user is a resident (Role 12 or 13)
  const isResident = user && (parseInt(user.role) === 12 || parseInt(user.role) === 13);

  const contentSx = useMemo(
    () => ({
      flexGrow: 1,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'background.default',
      minWidth: 0,
    }),
    []
  );

  const handleOpenSidebar = () => {
    setMobileOpen(true);
  };

  const handleCloseSidebar = () => {
    setMobileOpen(false);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={handleCloseSidebar} />
      <Box component='main' sx={contentSx}>
        <Header showMenuButton={isMobile} onOpenSidebar={handleOpenSidebar} />
        <Box
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            flexGrow: 1,
            backgroundColor: 'background.default',
          }}
        >
          <Container maxWidth={false} disableGutters sx={{ mx: 'auto' }}>
            {children}
          </Container>
        </Box>
      </Box>
      {/* Global Chatbot for Residents */}
      {isResident && <Chatbot />}
    </Box>
  );
};

export default AppShell;
