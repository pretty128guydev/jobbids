import React from 'react';
import { Container, Typography, Paper, AppBar, Toolbar, Box } from '@mui/material';
import BidsTable from './components/BidsTable';
import Summary from './components/Summary';

export default function App() {
  return (
    <Box sx={{ width: '100%' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div">JobBids</Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth={false} style={{ marginTop: 16, paddingLeft: 24, paddingRight: 24 }}>
        <Summary />

        <Paper style={{ padding: 16 }} elevation={2}>
          <BidsTable />
        </Paper>
      </Container>
    </Box>
  );
}
