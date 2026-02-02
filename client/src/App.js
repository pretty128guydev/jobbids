import React from 'react';
import { Container, Typography, Paper } from '@mui/material';
import BidsTable from './components/BidsTable';

export default function App() {
  return (
    <Container maxWidth="lg" style={{ marginTop: 24 }}>
      <Paper style={{ padding: 16 }}>
        <Typography variant="h4" gutterBottom>Job Bids Dashboard</Typography>
        <BidsTable />
      </Paper>
    </Container>
  );
}
