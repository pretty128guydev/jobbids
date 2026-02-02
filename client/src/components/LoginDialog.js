import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Alert } from '@mui/material';
import api from '../api';

export default function LoginDialog({ open, onClose }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/login', { username, password });
      setLoading(false);
      onClose && onClose({ success: true });
    } catch (err) {
      setError(err?.response?.data?.error || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={()=>{}} maxWidth="xs" fullWidth>
      <DialogTitle>Sign in</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
        <TextField fullWidth label="Username" margin="dense" value={username} onChange={(e)=>setUsername(e.target.value)} />
        <TextField fullWidth label="Password" margin="dense" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
      </DialogContent>
      <DialogActions>
        <Button disabled={loading} onClick={handleLogin} variant="contained">Sign in</Button>
      </DialogActions>
    </Dialog>
  );
}
