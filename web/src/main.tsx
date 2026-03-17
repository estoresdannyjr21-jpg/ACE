import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const THEME_KEY = 'ace-truckers-theme';
const saved = localStorage.getItem(THEME_KEY);
const theme = saved === 'dark' || saved === 'light' ? saved : 'light';
document.documentElement.setAttribute('data-theme', theme);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
