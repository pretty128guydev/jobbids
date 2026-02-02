import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api'
});

// send cookies for session-based auth
api.defaults.withCredentials = true;

export default api;
