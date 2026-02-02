import React, { useState, useEffect } from 'react';
import { DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem } from '@mui/material';
import api from '../api';

export default function BidForm({ initial, onClose }) {
  const [form, setForm] = useState({ company_name: '', job_title: '', jd_link: '', status: 'Applied', interview_status: '', interview_scheduled: '' });

  useEffect(()=>{ if (initial) setForm({
    company_name: initial.company_name || '', job_title: initial.job_title||'', jd_link: initial.jd_link||'', status: initial.status||'Applied', interview_status: initial.interview_status||'', interview_scheduled: initial.interview_scheduled ? new Date(initial.interview_scheduled).toISOString().slice(0,16) : ''
  }); else setForm({ company_name: '', job_title: '', jd_link: '', status: 'Applied', interview_status: '', interview_scheduled: '' }); }, [initial]);

  const handleSubmit = async () => {
    const payload = { ...form };
    if (form.interview_scheduled === '') payload.interview_scheduled = null;
    if (initial) {
      await api.put(`/bids/${initial.id}`, payload);
    } else {
      await api.post('/bids', payload);
    }
    onClose();
  };

  return (
    <>
      <DialogTitle>{initial ? 'Edit Bid' : 'Add Bid'}</DialogTitle>
      <DialogContent>
        <TextField fullWidth label="Company" margin="dense" value={form.company_name} onChange={(e)=>setForm({...form, company_name: e.target.value})} />
        <TextField fullWidth label="Job Title" margin="dense" value={form.job_title} onChange={(e)=>setForm({...form, job_title: e.target.value})} />
        <TextField fullWidth label="JD Link" margin="dense" value={form.jd_link} onChange={(e)=>setForm({...form, jd_link: e.target.value})} />
        <TextField select fullWidth label="Status" margin="dense" value={form.status} onChange={(e)=>setForm({...form, status: e.target.value})}>
          <MenuItem value="Applied">Applied</MenuItem>
          <MenuItem value="Interview">Interview</MenuItem>
          <MenuItem value="Offer">Offer</MenuItem>
          <MenuItem value="Rejected">Rejected</MenuItem>
        </TextField>
        <TextField fullWidth label="Interview Status" margin="dense" value={form.interview_status} onChange={(e)=>setForm({...form, interview_status: e.target.value})} />
        <TextField fullWidth label="Interview Scheduled" margin="dense" type="datetime-local" value={form.interview_scheduled} onChange={(e)=>setForm({...form, interview_scheduled: e.target.value})} InputLabelProps={{ shrink: true }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>{initial ? 'Save' : 'Add'}</Button>
      </DialogActions>
    </>
  );
}
