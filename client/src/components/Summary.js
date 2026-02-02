import React, { useEffect, useState } from 'react';
import { Grid, Paper, Typography } from '@mui/material';
import api from '../api';

export default function Summary() {
  const [stats, setStats] = useState({ byStatus: [], byInterviewStatus: [] });

  useEffect(() => {
    let mounted = true;
    api.get('/bids/summary/stats').then(res => { if (mounted) setStats(res.data); }).catch(()=>{});
    return () => mounted = false;
  }, []);

  return (
    <Grid container spacing={2} style={{ marginBottom: 16 }}>
      <Grid item xs={12} md={6} lg={3}>
        <Paper style={{ padding: 12 }} elevation={1}>
          <Typography variant="subtitle2">Total by Status</Typography>
          {stats.byStatus.map(s => (
            <Typography key={s.status} variant="body2">{s.status}: {s.cnt}</Typography>
          ))}
        </Paper>
      </Grid>
      <Grid item xs={12} md={6} lg={3}>
        <Paper style={{ padding: 12 }} elevation={1}>
          <Typography variant="subtitle2">Interview Status</Typography>
          {stats.byInterviewStatus.map(s => (
            <Typography key={s.interview_status} variant="body2">{s.interview_status || 'None'}: {s.cnt}</Typography>
          ))}
        </Paper>
      </Grid>
    </Grid>
  );
}
