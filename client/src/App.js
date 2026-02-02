import React, { useEffect, useState } from 'react';
import { Container, Typography, Paper, AppBar, Toolbar, Box, Button } from '@mui/material';
import BidsTable from './components/BidsTable';
import LoginDialog from './components/LoginDialog';
import api from './api';

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

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
          <Typography variant="h6" component="div">JobBids</Typography>
          <div style={{ marginLeft: 'auto' }}>
            {authed ? <Button color="inherit" onClick={handleLogout}>Logout</Button> : null}
          </div>
        </Toolbar>
      </AppBar>

      <Container maxWidth={false} style={{ marginTop: 16, paddingLeft: 24, paddingRight: 24 }}>
        <Paper style={{ padding: 16 }} elevation={2}>
          <BidsTable />
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
