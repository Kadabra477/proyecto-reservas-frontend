import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import ReservasSimplesImg from '../../assets/reservas-simples.jpg';

function Home({ estaAutenticado }) { // Recibe estaAutenticado como prop
  const [nombreUsuario, setNombreUsuario] = useState('');

  useEffect(() => {
    if (estaAutenticado) {
      const storedName = localStorage.getItem('nombreCompleto');
      setNombreUsuario(storedName || 'Usuario');
    } else {
      setNombreUsuario('');
    }
  }, [estaAutenticado]);

  return (
    <main>
      <section className="hero">
        <div className="hero-overlay" />
        <div className="hero-content">
          {/* CORRECCIÓN: Quitada la doble tilde */}
          <h1>¿DÓNDE <span>JUEGO?</span></h1>
          <p>La mejor forma de <strong>reservar</strong> tu cancha</p>
          <div className="hero-buttons">
            {/* Redirige a /complejos si está autenticado, sino a /login */}
            <Link to={estaAutenticado ? "/complejos" : "/login"} className="btn-main">Reservar ahora</Link>
            <a href="#como-funciona" className="btn-secondary">Conocer más</a>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="how">
          <div className="section-container">
            <h2>¿Cómo funciona?</h2>
            <div className="steps">
              <div className="step">
                <div className="step-icon"><div className="step-number">1</div></div>
                <div className="step-content">
                  <h4>Registrate</h4>
                  <p>Creá tu cuenta en pocos segundos</p>
                </div>
              </div>
              <div className="step">
                <div className="step-icon"><div className="step-number">2</div></div>
                <div className="step-content">
                  <h4>Buscá tu cancha</h4>
                  <p>Filtrá por zona, deporte y disponibilidad</p>
                </div>
              </div>
              <div className="step">
                <div className="step-icon"><div className="step-number">3</div></div>
                <div className="step-content">
                  <h4>Reservá online</h4>
                  <p>Elegí día y hora, pagá y ¡listo!</p>
                </div>
              </div>
            </div>
          </div>
      </section>

      <section className="platform-preview">
          <div className="section-container">
            <div className="platform-content">
              <h2>Reservas simples y rápidas</h2>
              <p>Nuestro sistema intuitivo te permite encontrar y reservar tu cancha ideal en solo unos pocos pasos. Olvídate de las llamadas telefónicas y las agendas complicadas. ¡Tu próxima partida está a solo un click!</p>
              <ul className="feature-list">
                <li>✓ Búsqueda por deporte, fecha y horario.</li>
                <li>✓ Visualiza la disponibilidad en tiempo real.</li>
                <li>✓ Confirma y paga de forma segura.</li>
              </ul>
              {!estaAutenticado && (
                  <Link to="/register" className="btn-main">Crear cuenta</Link>
              )}
            </div>
            <div className="platform-image-container">
              <img src={ReservasSimplesImg} alt="Plataforma de Reservas" className="platform-image-actual" />
            </div>
          </div>
      </section>

      <section id="beneficios" className="benefits">
          <div className="section-container">
            <h2>¿Por qué elegirnos?</h2>
            <div className="benefit-list">
              <div className="benefit">
                <div className="benefit-icon">📈</div>
                <div className="benefit-content">
                  <h4>Rentabilidad</h4>
                  <p>Aumentá tus ingresos ocupando horas libres.</p>
                </div>
              </div>
              <div className="benefit">
                <div className="benefit-icon">📅</div>
                <div className="benefit-content">
                  <h4>Agenda Online</h4>
                  <p>Gestión simple, ágil y segura desde cualquier dispositivo.</p>
                </div>
              </div>
              <div className="benefit">
                <div className="benefit-icon">📊</div>
                <div className="benefit-content">
                  <h4>Estadísticas</h4>
                  <p>Balance de ingresos, reservas y horarios pico.</p>
                </div>
              </div>
              <div className="benefit">
                <div className="benefit-icon">📵</div>
                <div className="benefit-content">
                  <h4>Sanción de jugadores</h4>
                  <p>Controlá cancelaciones y ausencias frecuentes.</p>
                </div>
              </div>
            </div>
          </div>
      </section>

      <section className="cta">
          <div className="cta-overlay"></div>
          <div className="cta-content">
            <h2>¿Listo para comenzar?</h2>
            <p>Únete a miles de usuarios que ya disfrutan de nuestro servicio</p>
            {/* Redirige a /complejos si está autenticado, sino a /login */}
            <Link to={estaAutenticado ? "/complejos" : "/login"} className="btn-main">Reservar ahora</Link>
          </div>
      </section>

      <a href="https://wa.me/5492634200763" className="whatsapp-button" target="_blank" rel="noopener noreferrer" title="Contactar por WhatsApp">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" width="24" height="24"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 221.9-99.6 221.9-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>
      </a>

      <footer className="footer">
          <div className="footer-content">
            <div className="footer-logo">
              <h3>¿Dónde Juego?</h3>
            </div>
            <div className="footer-links">
              <Link to="/">Inicio</Link>
              <a href="#como-funciona">Cómo funciona</a>
              <a href="#beneficios">Por qué elegirnos</a>
            </div>
            <div className="footer-social">
              <a href="#" className="social-icon">FB</a>
              <a href="#" className="social-icon">IG</a>
              <a href="#" className="social-icon">TW</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p className="copyright">© {new Date().getFullYear()} Sistema de Reservas de Canchas | Hecho en San Martín, Mendoza ⚽</p>
             <nav className="footer-nav">
             <li><a href="#">Términos</a></li>
             <li><a href="#">Privacidad</a></li>
           </nav>
          </div>
      </footer>
    </main>
  );
}

export default Home;