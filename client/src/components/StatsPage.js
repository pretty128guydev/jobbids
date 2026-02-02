import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, CircularProgress, Select, MenuItem, FormControl, InputLabel, Table, TableHead, TableRow, TableCell, TableBody, Button } from '@mui/material';
import api from '../api';

function Bars({ items, title }) {
  if (!items || !items.length) return <div style={{ padding: 12 }}>No data</div>;
  const max = Math.max(...items.map(i => i.cnt));
  return (
    <div style={{ padding: 12 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>{title}</Typography>
      {items.map((it) => (
        <div key={Object.values(it)[0]} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ color: '#333' }}>{Object.values(it)[0]}</div>
            <div style={{ color: '#333' }}>{it.cnt}</div>
          </div>
          <Box sx={{ height: 12, bgcolor: '#eee', borderRadius: 1, mt: 0.5 }}>
            <Box sx={{ height: '100%', bgcolor: 'primary.main', borderRadius: 1, width: `${Math.round((it.cnt / (max || 1)) * 100)}%` }} />
          </Box>
        </div>
      ))}
    </div>
  );
}

function TinyChart({ points }) {
  if (!points || !points.length) return <div style={{ padding: 12 }}>No data</div>;
  // simple SVG line chart
  const width = 600; const height = 160; const pad = 30;
  const max = Math.max(...points.map(p=>p.cnt));
  const min = 0;
  const stepX = (width - pad*2) / Math.max(1, points.length - 1);
  const pointsStr = points.map((p,i)=>{
    const x = pad + i * stepX;
    const y = pad + (1 - ((p.cnt - min) / (max - min || 1))) * (height - pad*2);
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width="100%" height="100%" fill="transparent" />
      <polyline fill="none" stroke="#1976d2" strokeWidth="2" points={pointsStr} />
      {points.map((p,i)=>{
        const x = pad + i * stepX;
        const y = pad + (1 - ((p.cnt - min) / (max - min || 1))) * (height - pad*2);
        return <circle key={i} cx={x} cy={y} r={3} fill="#1976d2" />
      })}
    </svg>
  );
}

export default function StatsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ byStatus: [], byInterviewStatus: [] });
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('week');
  const [metricType, setMetricType] = useState('status');
  const [seriesStatus, setSeriesStatus] = useState('');
  const [seriesData, setSeriesData] = useState([]);
  const statuses = ['applied','refused','chatting','test task','fill the form'];
  const interviewStatuses = ['none','recruiter','tech','tech(live coding)','tech 2','final'];

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get('/bids/summary/stats');
        if (!mounted) return;
        setData({ byStatus: res.data.byStatus || [], byInterviewStatus: res.data.byInterviewStatus || [] });
      } catch (e) {
        setError(e?.response?.data?.error || e.message || 'Failed to load stats');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const params = { period };
        if (seriesStatus) {
          if (metricType === 'status') params.status = seriesStatus;
          else params.interview_status = seriesStatus;
        }
        const res = await api.get('/bids/summary/timeseries', { params });
        if (!mounted) return;
        setSeriesData(res.data.data || []);
      } catch (e) {
        // ignore for now
      }
    })();
    return () => { mounted = false; };
  }, [period, seriesStatus]);

  if (loading) return <div style={{ padding: 24, textAlign: 'center' }}><CircularProgress /></div>;
  if (error) return <div style={{ padding: 24 }}>{error}</div>;

  return (
    <Paper style={{ padding: 12 }}>
      <Typography variant="h5" sx={{ mb: 1 }}>Quick Summary</Typography>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 320 }}>
          <Bars items={data.byStatus} title="Count per Status" />
          <div style={{ padding: 12 }}>
            <Typography variant="subtitle1">Counts table</Typography>
            <Table size="small">
              <TableHead>
                <TableRow><TableCell>Status</TableCell><TableCell>Count</TableCell></TableRow>
              </TableHead>
              <TableBody>
                {data.byStatus.map(s => (
                  <TableRow key={s.status}><TableCell>{s.status}</TableCell><TableCell>{s.cnt}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 420 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 12 }}>
            <FormControl size="small">
              <InputLabel>Period</InputLabel>
              <Select value={period} label="Period" onChange={(e)=>setPeriod(e.target.value)}>
                <MenuItem value="day">Day</MenuItem>
                <MenuItem value="week">Week</MenuItem>
                <MenuItem value="month">Month</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>Type</InputLabel>
              <Select value={metricType} label="Type" onChange={(e)=>{ setMetricType(e.target.value); setSeriesStatus(''); }} style={{ minWidth: 140 }}>
                <MenuItem value="status">Status</MenuItem>
                <MenuItem value="interview_status">Interview Status</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small">
              <InputLabel>Value</InputLabel>
              <Select value={seriesStatus} label="Value" onChange={(e)=>setSeriesStatus(e.target.value)} style={{ minWidth: 200 }}>
                <MenuItem value="">All</MenuItem>
                {(metricType === 'status' ? data.byStatus.map(s=>s.status) : data.byInterviewStatus.map(s=>s.interview_status)).map(v => (
                  <MenuItem key={v} value={v}>{v}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button size="small" onClick={() => { setPeriod('week'); setSeriesStatus(''); }}>Reset</Button>
          </div>

          <div style={{ padding: 12 }}>
            <Typography variant="subtitle1">Timeseries ({period})</Typography>
            <TinyChart points={seriesData} />
            <div style={{ marginTop: 8 }}>
              <Table size="small">
                <TableHead>
                  <TableRow><TableCell>Label</TableCell><TableCell>Count</TableCell></TableRow>
                </TableHead>
                <TableBody>
                  {seriesData.map(r => (<TableRow key={r.label}><TableCell>{r.label}</TableCell><TableCell>{r.cnt}</TableCell></TableRow>))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </Paper>
  );
}
