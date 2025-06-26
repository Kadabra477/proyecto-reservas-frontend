import React from 'react';
import ReactDOM from 'react-dom/client';
// Importa App.css aquí si quieres que los estilos globales se apliquen primero
import './App.css';
// Importa Font Awesome CSS *después* de tus estilos globales si App.css ya contiene la importación de las fuentes
// o si quieres que App.css tenga precedencia en caso de conflictos.
import '@fortawesome/fontawesome-free/css/all.min.css'; 

import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);