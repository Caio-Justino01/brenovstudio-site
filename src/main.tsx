import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/anton/latin-400.css';
import '@fontsource/barlow-condensed/latin-900.css';
import '@fontsource-variable/manrope';
import { App } from './App';
import './styles/materials.css';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
