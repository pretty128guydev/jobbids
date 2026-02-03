import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, CircularProgress, Select, MenuItem, FormControl, InputLabel, Table, TableHead, TableRow, TableCell, TableBody, Button } from '@mui/material';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
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

export default function StatsPage({ refreshSignal }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ byStatus: [], byInterviewStatus: [] });
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('day');
  const [metricType, setMetricType] = useState('status');
  const [seriesStatus, setSeriesStatus] = useState('');
  const [seriesData, setSeriesData] = useState([]);
  const statuses = ['applied','refused','chatting','test task','fill the form'];
  const interviewStatuses = ['none','recruiter','tech','tech(live coding)','tech 2','final'];
  const [multiRaw, setMultiRaw] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [chartKeys, setChartKeys] = useState([]);

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
  }, [refreshSignal]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const params = { period, type: metricType };
        const res = await api.get('/bids/summary/timeseries/multi', { params });
        if (!mounted) return;
        setMultiRaw(res.data.data || []);
      } catch (e) {
        // ignore for now
      }
    })();
    return () => { mounted = false; };
  }, [period, metricType, refreshSignal]);

  // pivot multiRaw into chartData
  useEffect(() => {
    if (!multiRaw || !multiRaw.length) { setChartData([]); setChartKeys([]); return; }
    const labels = Array.from(new Set(multiRaw.map(r=>r.label))).sort();
    const valuesSet = Array.from(new Set(multiRaw.map(r=>r.value)));
    const keys = seriesStatus ? [seriesStatus] : valuesSet;
    const map = {};
    for (const r of multiRaw) {
      map[r.label] = map[r.label] || {};
      map[r.label][r.value] = (map[r.label][r.value] || 0) + r.cnt;
    }
    const data = labels.map(label => {
      const obj = { label };
      for (const k of keys) obj[k] = map[label] && map[label][k] ? map[label][k] : 0;
      return obj;
    });
    setChartData(data);
    setChartKeys(keys);
  }, [multiRaw, seriesStatus]);

  if (loading) return <div style={{ padding: 24, textAlign: 'center' }}><CircularProgress /></div>;
  if (error) return <div style={{ padding: 24 }}>{error}</div>;

  return (
    <Paper style={{ padding: 12 }}>
      <Typography variant="h5" sx={{ mb: 1 }}>Quick Summary</Typography>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 320 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 8 }}>
            <FormControl size="small">
              <InputLabel>Overview</InputLabel>
              <Select value={metricType} label="Overview" onChange={(e)=>{ setMetricType(e.target.value); setSeriesStatus(''); }} style={{ minWidth: 200 }}>
                <MenuItem value="status">Status</MenuItem>
                <MenuItem value="interview_status">Interview Status</MenuItem>
              </Select>
            </FormControl>
          </div>
          <Bars items={metricType === 'status' ? data.byStatus : data.byInterviewStatus} title={metricType === 'status' ? 'Count per Status' : 'Count per Interview Status'} />
          <div style={{ padding: 12 }}>
            <Typography variant="subtitle1">Counts table</Typography>
            <Table size="small">
              <TableHead>
                <TableRow><TableCell>{metricType === 'status' ? 'Status' : 'Interview Status'}</TableCell><TableCell>Count</TableCell></TableRow>
              </TableHead>
              <TableBody>
                {(metricType === 'status' ? data.byStatus : data.byInterviewStatus).map(s => (
                  <TableRow key={metricType === 'status' ? s.status : s.interview_status}><TableCell>{metricType === 'status' ? s.status : s.interview_status}</TableCell><TableCell>{s.cnt}</TableCell></TableRow>
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
            {/* <FormControl size="small">
              <InputLabel>Type</InputLabel>
              <Select value={metricType} label="Type" onChange={(e)=>{ setMetricType(e.target.value); setSeriesStatus(''); }} style={{ minWidth: 140 }}>
                <MenuItem value="status">Status</MenuItem>
                <MenuItem value="interview_status">Interview Status</MenuItem>
              </Select>
            </FormControl> */}

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
            <div style={{ width: '100%', height: 320 }}>
              {chartData && chartData.length ? (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {chartKeys.map((k, idx) => (
                      <Line key={k} type="monotone" dataKey={k} stroke={["#1976d2","#d32f2f","#0288d1","#db7617","#7b1fa2","#2e7d32"][idx % 6]} dot={{ r: 3 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (<div style={{ padding: 12 }}>No timeseries data</div>)}
            </div>
            <div style={{ marginTop: 8 }}>
              <Table size="small">
                <TableHead>
                  <TableRow><TableCell>Label</TableCell><TableCell>Count</TableCell></TableRow>
                </TableHead>
                <TableBody>
                  {chartData.map(r => (
                    <TableRow key={r.label}><TableCell>{r.label}</TableCell><TableCell>{chartKeys.reduce((s,k)=>s+(r[k]||0),0)}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </Paper>
  );
}
