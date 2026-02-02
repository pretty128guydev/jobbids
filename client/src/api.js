import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://jobbids-ncob.onrender.com/api'
});

// send cookies for session-based auth
api.defaults.withCredentials = true;

export default api;
