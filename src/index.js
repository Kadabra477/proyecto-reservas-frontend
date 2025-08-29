// frontend/src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
// Importa App.css aquí para que los estilos globales se apliquen primero
import './App.css';

// ¡Línea eliminada! La carga de la fuente se moverá a index.html.
// import 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200';

// Ya no importamos Font Awesome si todos los iconos han sido reemplazados por Material Symbols
// import '@fortawesome/fontawesome-free/css/all.min.css';

import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);