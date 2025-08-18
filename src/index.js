import React from 'react';
import ReactDOM from 'react-dom/client';
// Importa App.css aquí para que los estilos globales se apliquen primero
import './App.css';
// Importa Font Awesome CSS si lo necesitas y no está ya en tu HTML principal
import '@fortawesome/fontawesome-free/css/all.min.css';

import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
