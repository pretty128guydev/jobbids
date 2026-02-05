import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField, Select, MenuItem, TableFooter, TablePagination, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, Chip, LinearProgress } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../api';
import BidForm from './BidForm';

const formatJST = (d) => {
  if (!d) return '';
  try {
    return new Intl.DateTimeFormat('ja-JP', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Tokyo' }).format(new Date(d));
  } catch (e) { return d; }
};

const truncateText = (text, max = 18) => {
  if (!text) return '';
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
};

export default function BidsTable({ refreshSignal }) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState({ company: '', status: '', interview_status: '' });
  const [editing, setEditing] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [descOpen, setDescOpen] = useState(false);
  const [descText, setDescText] = useState('');

  function openDesc(text) {
    setDescText(text || '');
    setDescOpen(true);
  }

  async function fetchData(p = page, l = limit) {
    const params = { page: p + 1, limit: l, ...filters };
    setLoading(true);
    try {
      const res = await api.get('/bids', { params });
      setData(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Failed to load bids';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(0, limit); setPage(0); }, [filters, limit]);

  // refetch when parent triggers refresh
  useEffect(() => {
    if (refreshSignal !== undefined) fetchData(page, limit);
  }, [refreshSignal]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this bid?')) return;
    setLoading(true);
    try {
      await api.delete(`/bids/${id}`);
      setSuccess('Bid deleted');
      await fetchData();
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Delete failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Remove ALL bids? This cannot be undone.')) return;
    setLoading(true);
    try {
      await api.delete('/bids/all');
      setSuccess('All bids removed');
      setPage(0);
      await fetchData(0, limit);
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Remove all failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const [error, setError] = useState('');
  const handleCloseError = () => setError('');

  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <TextField label="Company" size="small" value={filters.company} onChange={(e)=>setFilters({...filters, company: e.target.value})} />
        <TextField label="Job Title" size="small" value={filters.job_title||''} onChange={(e)=>setFilters({...filters, job_title: e.target.value})} />
        <Select value={filters.status} displayEmpty onChange={(e)=>setFilters({...filters, status: e.target.value})} size="small">
          <MenuItem value="">All Status</MenuItem>
          <MenuItem value="applied">Applied</MenuItem>
          <MenuItem value="refused">Refused</MenuItem>
          <MenuItem value="chatting">Chatting</MenuItem>
          <MenuItem value="test task">Test Task</MenuItem>
          <MenuItem value="fill the form">Fill The Form</MenuItem>
        </Select>
        <Select value={filters.interview_status} displayEmpty onChange={(e)=>setFilters({...filters, interview_status: e.target.value})} size="small">
          <MenuItem value="">All Interview Status</MenuItem>
          <MenuItem value="recruiter">recruiter</MenuItem>
          <MenuItem value="tech">tech</MenuItem>
          <MenuItem value="tech(live coding)">tech(live coding)</MenuItem>
          <MenuItem value="tech 2">tech 2</MenuItem>
          <MenuItem value="final">final</MenuItem>
        </Select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Button variant="outlined" color="error" disabled={loading || total === 0} onClick={handleClearAll}>Remove All</Button>
          <Button variant="contained" onClick={()=>{setEditing(null); setOpenForm(true);}}>Add Bid</Button>
        </div>
      </div>
      {loading && <LinearProgress />}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Company</TableCell>
              <TableCell>Job Title</TableCell>
              <TableCell>JD Link</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Bidded Date</TableCell>
              <TableCell>Interview Status</TableCell>
              <TableCell>Interview Scheduled</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map(row => (
              <TableRow key={row.id}>
                <TableCell title={row.company_name || ''}><strong>{truncateText(row.company_name, 18)}</strong></TableCell>
                <TableCell title={row.job_title || ''}>{truncateText(row.job_title, 22)}</TableCell>
                <TableCell style={{ whiteSpace: 'nowrap' }}>
                  {row.jd_link ? (
                    <Chip
                      component="a"
                      href={row.jd_link}
                      target="_blank"
                      rel="noreferrer"
                      label="JD"
                      clickable
                      size="small"
                      color="info"
                      variant="outlined"
                    />
                  ) : ('')}
                </TableCell>
                <TableCell>
                  {(() => {
                    const s = (row.status || 'applied').toLowerCase();
                    const label = s.split(' ').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ');
                    const colorMap = {
                      'applied': '#0faf3f',
                      'refused': '#d32f2f',
                      'chatting': '#0288d1',
                      'test task': '#db7617',
                      'fill the form': '#7b1fa2'
                    };
                    const bg = colorMap[s] || '#455a64';
                    return (
                      <Chip label={label} size="medium" sx={{ bgcolor: bg, color: '#fff', fontWeight: 700 }} />
                    );
                  })()}
                </TableCell>
                <TableCell><span className="muted">{row.bidded_date ? formatJST(row.bidded_date) : ''}</span></TableCell>
                <TableCell>
                  {(() => {
                    const iv = (row.interview_status || 'none').toLowerCase();
                    const interviewMap = {
                      'none': '#616161',
                      'recruiter': '#2e7d32',
                      'tech': '#f9a825',
                      'tech 2': '#f9a825',
                      'tech(live coding)': '#7e57c2',
                      'final': '#d81b60'
                    };
                    const ibg = interviewMap[iv] || '#616161';
                    if (iv === 'none') return (<span className="muted">None</span>);
                    return (<Chip label={iv} size="small" sx={{ bgcolor: ibg, color: '#fff', fontWeight: 700 }} />);
                  })()}
                </TableCell>
                <TableCell>{row.interview_scheduled ? formatJST(row.interview_scheduled) : ''}</TableCell>
                <TableCell>
                  {row.description ? (
                    <>
                      <span style={{ cursor: 'pointer' }} onClick={()=>openDesc(row.description)} title="Click to view full description">{row.description.length > 20 ? row.description.slice(0,20) + '...' : row.description}</span>
                      {row.description.length > 20 && <Button size="small" onClick={()=>openDesc(row.description)} style={{ marginLeft: 8 }}>View</Button>}
                    </>
                  ) : ('')}
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={()=>{setEditing(row); setOpenForm(true);}}><EditIcon/></IconButton>
                  <IconButton size="small" onClick={()=>handleDelete(row.id)}><DeleteIcon/></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TablePagination
                count={total}
                page={page}
                rowsPerPage={limit}
                onPageChange={(e, newPage)=>{ setPage(newPage); fetchData(newPage, limit); }}
                onRowsPerPageChange={(e)=>{ setLimit(parseInt(e.target.value,10)); setPage(0); }}
                rowsPerPageOptions={[5,10,25]}
                component="div"
              />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>

      <Dialog open={openForm} onClose={()=>setOpenForm(false)} maxWidth="sm" fullWidth>
        <BidForm
          initial={editing}
          onClose={(res)=>{ setOpenForm(false); fetchData(); if (res?.successMessage) setSuccess(res.successMessage); }}
        />
      </Dialog>

      <Dialog open={descOpen} onClose={()=>setDescOpen(false)} scroll="paper" maxWidth="sm" fullWidth>
        <DialogTitle>Description</DialogTitle>
        <DialogContent dividers sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{descText}</div>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setDescOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      <Snackbar anchorOrigin={{ vertical: 'top', horizontal: 'right' }} open={!!error} autoHideDuration={6000} onClose={handleCloseError}>
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>{error}</Alert>
      </Snackbar>
      <Snackbar anchorOrigin={{ vertical: 'top', horizontal: 'right' }} open={!!success} autoHideDuration={4000} onClose={()=>setSuccess('')}>
        <Alert onClose={()=>setSuccess('')} severity="success" sx={{ width: '100%' }}>{success}</Alert>
      </Snackbar>
    </>
  );
}
