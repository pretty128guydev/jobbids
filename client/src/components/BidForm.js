import React, { useState, useEffect } from 'react';
import { DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Snackbar, Alert, Backdrop, CircularProgress } from '@mui/material';
import api from '../api';

export default function BidForm({ initial, onClose }) {
  const [form, setForm] = useState({ company_name: '', job_title: '', jd_link: '', description: '', status: 'applied', interview_status: 'none', interview_scheduled: '' });

  useEffect(()=>{
    if (initial) setForm({
      company_name: initial.company_name || '',
      job_title: initial.job_title || '',
      jd_link: initial.jd_link || '',
      status: (initial.status || 'applied').toLowerCase(),
      interview_status: (initial.interview_status || 'none') || 'none',
      description: initial.description || '',
      interview_scheduled: initial.interview_scheduled ? new Date(initial.interview_scheduled).toISOString().slice(0,16) : ''
    });
    else setForm({ company_name: '', job_title: '', jd_link: '', description: '', status: 'applied', interview_status: 'none', interview_scheduled: '' });
  }, [initial]);

  const handleSubmit = async () => {
    // client-side validation
    if (!form.company_name || !form.job_title || !form.jd_link) {
      setError('Company, Job Title and JD Link are required');
      return;
    }
    // basic URL validation
    try { new URL(form.jd_link); } catch (e) { setError('Invalid JD Link URL'); return; }

    const payload = { ...form };
    if (form.interview_scheduled === '') payload.interview_scheduled = null;

    try {
      setLoading(true);
      // when creating, check if company already exists
      if (!initial) {
        try {
          const chk = await api.get('/bids/check/company', { params: { company: form.company_name } });
          if (chk.data && chk.data.exists) {
            setError('A bid for this company already exists');
            setLoading(false);
            return;
          }
        } catch (e) {
          // ignore check errors and proceed (server will validate)
        }
      }

      if (initial) {
        await api.put(`/bids/${initial.id}`, payload);
      } else {
        await api.post('/bids', payload);
      }
      const msg = initial ? 'Bid updated' : 'Bid added';
      setLoading(false);
      onClose && onClose({ successMessage: msg });
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Server error';
      setError(msg);
      setLoading(false);
    }
  };

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [companyExists, setCompanyExists] = useState(false);
  const [checking, setChecking] = useState(false);
  const [companyCheckError, setCompanyCheckError] = useState('');
  const handleCloseError = () => setError('');

  useEffect(() => {
    let t;
    const name = (form.company_name || '').replace(/\s+/g, ' ').trim();
    setCompanyCheckError('');
    if (!name) { setCompanyExists(false); setChecking(false); return; }
    // if editing and name didn't change, skip check
    if (initial && (initial.company_name||'').replace(/\s+/g,' ').trim() === name) { setCompanyExists(false); setChecking(false); return; }

    setChecking(true);
    t = setTimeout(async () => {
      try {
        const res = await api.get('/bids/check/company', { params: { company: name } });
        setCompanyExists(!!res.data.exists);
      } catch (e) {
        setCompanyCheckError('');
      } finally {
        setChecking(false);
      }
    }, 500);

    return () => clearTimeout(t);
  }, [form.company_name, initial]);

  return (
    <>
      <DialogTitle>{initial ? 'Edit Bid' : 'Add Bid'}</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Company"
          margin="dense"
          value={form.company_name}
          onChange={(e)=>setForm({...form, company_name: e.target.value})}
          error={!!companyExists}
          helperText={companyExists ? 'Company already has a bid' : ''}
          InputProps={{ endAdornment: checking ? <CircularProgress size={16} color="inherit" /> : null }}
        />
        <TextField fullWidth label="Job Title" margin="dense" value={form.job_title} onChange={(e)=>setForm({...form, job_title: e.target.value})} />
        <TextField fullWidth label="JD Link" margin="dense" value={form.jd_link} onChange={(e)=>setForm({...form, jd_link: e.target.value})} />
        <TextField select fullWidth label="Status" margin="dense" value={form.status} onChange={(e)=>setForm({...form, status: e.target.value})}>
          <MenuItem value="applied">Applied</MenuItem>
          <MenuItem value="refused">Refused</MenuItem>
          <MenuItem value="chatting">Chatting</MenuItem>
          <MenuItem value="test task">Test Task</MenuItem>
          <MenuItem value="fill the form">Fill The Form</MenuItem>
        </TextField>

        <TextField select fullWidth label="Interview Status" margin="dense" value={form.interview_status} onChange={(e)=>setForm({...form, interview_status: e.target.value})}>
          <MenuItem value="">None</MenuItem>
          <MenuItem value="recruiter">recruiter</MenuItem>
          <MenuItem value="tech">tech</MenuItem>
          <MenuItem value="tech(live coding)">tech(live coding)</MenuItem>
          <MenuItem value="tech 2">tech 2</MenuItem>
          <MenuItem value="final">final</MenuItem>
        </TextField>
        <TextField fullWidth label="Interview Scheduled" margin="dense" type="datetime-local" value={form.interview_scheduled} onChange={(e)=>setForm({...form, interview_scheduled: e.target.value})} InputLabelProps={{ shrink: true }} />
        <TextField fullWidth label="Description (optional)" margin="dense" value={form.description||''} onChange={(e)=>setForm({...form, description: e.target.value})} multiline rows={3} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading || (!initial && companyExists)}>{initial ? 'Save' : 'Add'}</Button>
      </DialogActions>
      <Snackbar anchorOrigin={{ vertical: 'top', horizontal: 'right' }} open={!!error} autoHideDuration={6000} onClose={handleCloseError}>
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>{error}</Alert>
      </Snackbar>
      <Backdrop open={loading} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
}
