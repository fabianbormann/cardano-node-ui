import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages';
import { styled } from '@mui/material/styles';
import { Footer } from './components';
import Toolbar from '@mui/material/Toolbar';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import { Box, Grid, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import BackgroundAnimation from './components/BackgroundAnimation';

const Content = styled('main')(({ theme }) => ({
  backgroundColor:
    theme.palette.mode === 'light'
      ? theme.palette.grey[100]
      : theme.palette.grey[900],
  flexGrow: 1,
  height: '100vh',
  overflow: 'auto',
  display: 'flex',
  flexDirection: 'column',
}));

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const App = () => {
  const closeApp = () => {
    const closeElectronApp: Function = (window as any).electron?.closeApp;

    closeElectronApp();
  };

  return (
    <Router>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <BackgroundAnimation />
        <Box sx={{ display: 'flex' }}>
          <IconButton
            aria-label="close"
            onClick={closeApp}
            sx={{
              position: 'absolute',
              top: 5,
              left: 5,
              width: 48,
              height: 48,
              zIndex: 2000,
            }}
          >
            <CloseIcon sx={{ color: 'white' }} />
          </IconButton>
          <AppBar
            color="transparent"
            position="absolute"
            open={true}
            elevation={0}
          >
            <Toolbar sx={{ pr: '24px', background: 'transparent' }}>
              <Typography
                component="h1"
                variant="h6"
                color="white"
                noWrap
                sx={{
                  flexGrow: 1,
                  textAlign: 'center',
                }}
              >
                Cardano Node UI
              </Typography>
            </Toolbar>
          </AppBar>
          <Content sx={{ background: 'transparent' }}>
            <Toolbar />

            <Grid container sx={{ flexGrow: 1 }}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
              </Routes>
            </Grid>

            <Footer />
          </Content>
        </Box>
      </div>
    </Router>
  );
};

export default App;
