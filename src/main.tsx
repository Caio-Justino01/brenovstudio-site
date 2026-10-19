import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/anton/latin-400.css';
import '@fontsource/barlow-condensed/latin-900.css';
import '@fontsource-variable/manrope';
import { App } from './App';
import { captureOpeningStartup, prepareOpeningPosition } from './lib/openingStartup';
import { ScrollTrigger } from './lib/motion';
import './styles/materials.css';
import './styles/global.css';

const startup = captureOpeningStartup(window);
const initialPosition = prepareOpeningPosition(window, startup, mode => {
  // refresh() also restores this cached preference; keep it aligned with the native lease.
  ScrollTrigger.clearScrollMemory(mode);
  ScrollTrigger.update();
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App startup={startup} initialPosition={initialPosition} />
  </React.StrictMode>,
);
