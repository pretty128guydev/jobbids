import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField, Select, MenuItem, TableFooter, TablePagination, IconButton, Dialog, Snackbar, Alert, Chip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../api';
import BidForm from './BidForm';

export default function BidsTable() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState({ company: '', status: '', interview_status: '' });
  const [editing, setEditing] = useState(null);
  const [openForm, setOpenForm] = useState(false);

  async function fetchData(p = page, l = limit) {
    const params = { page: p + 1, limit: l, ...filters };
    try {
      const res = await api.get('/bids', { params });
      setData(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Failed to load bids';
      setError(msg);
    }
  }

  useEffect(() => { fetchData(0, limit); setPage(0); }, [filters, limit]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this bid?')) return;
    try {
      await api.delete(`/bids/${id}`);
      fetchData();
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Delete failed';
      setError(msg);
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
          <MenuItem value="Applied">Applied</MenuItem>
          <MenuItem value="Interview">Interview</MenuItem>
          <MenuItem value="Offer">Offer</MenuItem>
          <MenuItem value="Rejected">Rejected</MenuItem>
        </Select>
        <TextField label="Interview Status" size="small" value={filters.interview_status} onChange={(e)=>setFilters({...filters, interview_status: e.target.value})} />
        <div style={{ marginLeft: 'auto' }}>
          <Button variant="contained" onClick={()=>{setEditing(null); setOpenForm(true);}}>Add Bid</Button>
        </div>
      </div>

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
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map(row => (
              <TableRow key={row.id}>
                <TableCell><strong>{row.company_name}</strong></TableCell>
                <TableCell>{row.job_title}</TableCell>
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
                  <Chip label={row.status} size="small" color={(() => {
                    switch((row.status||'').toLowerCase()){
                      case 'applied': return 'info';
                      case 'interview': return 'warning';
                      case 'offer': return 'success';
                      case 'rejected': return 'error';
                      default: return 'default';
                    }
                  })()} />
                </TableCell>
                <TableCell><span className="muted">{row.bidded_date ? new Date(row.bidded_date).toLocaleString() : ''}</span></TableCell>
                <TableCell>
                  {row.interview_status ? (
                    <Chip label={row.interview_status} size="small" variant="outlined" color="secondary" />
                  ) : ('')}
                </TableCell>
                <TableCell>{row.interview_scheduled ? new Date(row.interview_scheduled).toLocaleString() : ''}</TableCell>
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
          onClose={()=>{ setOpenForm(false); fetchData(); }}
        />
      </Dialog>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseError}>
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>{error}</Alert>
      </Snackbar>
    </>
  );
}
