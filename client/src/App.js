import React, { useEffect, useState } from 'react';
import { Container, Typography, Paper, AppBar, Toolbar, Box, Button, IconButton } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import BidsTable from './components/BidsTable';
import StatsPage from './components/StatsPage';
import api from './api';

export default function App() {
  const [authed, setAuthed] = useState(true);
  const [view, setView] = useState('bids');
  const [refreshSignal, setRefreshSignal] = useState(0);

  // Auth removed; app runs as authenticated by default

  return (
    <Box sx={{ width: '100%' }}>
      <AppBar position="static">
        <Toolbar>
            <img src="/logo.png" alt="ToothlessBids" style={{ height: 75, marginRight: 12 }} />
          <Typography variant="h6" component="div">ToothlessBids</Typography>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <IconButton color="inherit" onClick={() => setRefreshSignal(s => s + 1)} title="Refresh data">
              <RefreshIcon />
            </IconButton>
            <>
              <Button color={view === 'bids' ? 'secondary' : 'inherit'} onClick={()=>setView('bids')}>Bids</Button>
              <Button color={view === 'stats' ? 'secondary' : 'inherit'} onClick={()=>setView('stats')}>Stats</Button>
            </>
          </div>
        </Toolbar>
      </AppBar>

      <Container maxWidth={false} style={{ marginTop: 16, paddingLeft: 24, paddingRight: 24 }}>
        <Paper style={{ padding: 16 }} elevation={2}>
          {view === 'bids' ? <BidsTable refreshSignal={refreshSignal} /> : <StatsPage refreshSignal={refreshSignal} />}
        </Paper>
      </Container>

      {/* Login UI removed — app operates without authorization */}
    </Box>
  );
}
