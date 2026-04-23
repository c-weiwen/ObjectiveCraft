import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.js';
import { jsx as _jsx } from "react/jsx-runtime";
createRoot(document.getElementById('root')).render(/*#__PURE__*/_jsx(StrictMode, {
  children: /*#__PURE__*/_jsx(App, {})
}));
