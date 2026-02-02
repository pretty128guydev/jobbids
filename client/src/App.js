import React, { useEffect, useState } from 'react';
import { Container, Typography, Paper, AppBar, Toolbar, Box, Button } from '@mui/material';
import BidsTable from './components/BidsTable';
import StatsPage from './components/StatsPage';
import LoginDialog from './components/LoginDialog';
import api from './api';

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [view, setView] = useState('bids');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/auth/status');
        setAuthed(!!res.data.authenticated);
        if (!res.data.authenticated) setLoginOpen(true);
      } catch (e) {
        setAuthed(false);
        setLoginOpen(true);
      }
    })();
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {}
    setAuthed(false);
    setLoginOpen(true);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <AppBar position="static">
        <Toolbar>
          <img src="/logo-jobbids.svg" alt="JobBids" style={{ height: 34, marginRight: 12 }} />
          <Typography variant="h6" component="div">JobBids</Typography>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            {authed && (
              <>
                <Button color={view === 'bids' ? 'secondary' : 'inherit'} onClick={()=>setView('bids')}>Bids</Button>
                <Button color={view === 'stats' ? 'secondary' : 'inherit'} onClick={()=>setView('stats')}>Stats</Button>
              </>
            )}
            {authed ? <Button color="inherit" onClick={handleLogout}>Logout</Button> : null}
          </div>
        </Toolbar>
      </AppBar>

      <Container maxWidth={false} style={{ marginTop: 16, paddingLeft: 24, paddingRight: 24 }}>
        <Paper style={{ padding: 16 }} elevation={2}>
          {authed ? (
            view === 'bids' ? <BidsTable /> : <StatsPage />
          ) : (
            <div style={{ padding: 16 }}>Please sign in to view job bids.</div>
          )}
        </Paper>
      </Container>

      <LoginDialog open={loginOpen} onClose={async (res) => {
        setLoginOpen(false);
        try {
          const s = await api.get('/auth/status');
          setAuthed(!!s.data.authenticated);
        } catch (e) {
          setAuthed(false);
          setLoginOpen(true);
        }
      }} />
    </Box>
  );
}
