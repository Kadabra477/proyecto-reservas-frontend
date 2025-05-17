import React from 'react';
import ReactDOM from 'react-dom/client';
// Importa App.css aquí si quieres que los estilos globales se apliquen primero
// O importa index.css si lo usas
import './App.css';
// import './index.css'; // Descomenta si usas index.css para resets o variables globales
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);