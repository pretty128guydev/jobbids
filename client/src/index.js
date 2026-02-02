import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './App.css';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

const darkTheme = createTheme({
	palette: {
		mode: 'dark',
		background: { default: '#0f1115', paper: '#111217' },
		primary: { main: '#90caf9' },
		secondary: { main: '#f48fb1' }
	},
	components: {
		MuiPaper: {
			styleOverrides: {
				root: { backgroundImage: 'none' }
			}
		}
	}
});

const root = createRoot(document.getElementById('root'));
root.render(
	<ThemeProvider theme={darkTheme}>
		<CssBaseline />
		<App />
	</ThemeProvider>
);
