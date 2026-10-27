import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
const Admin = lazy(() => import('./components/Admin.jsx'));
import './index.css';

// /admin is the private inbox. Everything else is the portfolio.
const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
const isAdmin = window.location.pathname.replace(/\/+$/, '') === `${base}/admin`;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isAdmin ? (
      <Suspense fallback={null}>
        <Admin />
      </Suspense>
    ) : (
      <App />
    )}
  </React.StrictMode>
);
