import React, { useMemo, useState } from 'react'
import { Box, Container } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import Sidebar, { DRAWER_WIDTH } from './Sidebar'
import Header from './Header'

const AppShell = ({ children }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)

  const contentSx = useMemo(
    () => ({
      flexGrow: 1,
      minHeight: '100vh',
      backgroundColor: 'background.default',
      minWidth: 0,
    }),
    [],
  )

  const handleOpenSidebar = () => {
    setMobileOpen(true)
  }

  const handleCloseSidebar = () => {
    setMobileOpen(false)
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={handleCloseSidebar} />
      <Box component="main" sx={contentSx}>
        <Header showMenuButton={isMobile} onOpenSidebar={handleOpenSidebar} />
        <Box
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            minHeight: 'calc(100vh - 64px)',
            backgroundColor: 'background.default',
          }}
        >
          <Container maxWidth="lg" disableGutters sx={{ mx: 'auto' }}>
            {children}
          </Container>
        </Box>
      </Box>
    </Box>
  )
}

export default AppShell
