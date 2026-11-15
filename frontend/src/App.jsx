import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import VistaCiudadano from './views/VistaCiudadano';
import VistaEmpleado from './views/VistaEmpleado';
import VistaAdmin from './views/VistaAdmin';
import Login from './views/Login';

const RutaProtegida = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function Navegacion() {
  const location = useLocation();
  const token = localStorage.getItem('token');

  // El ciudadano que entra por QR o el usuario en login no ven la barra interna
  if (location.pathname === '/ciudadano' || location.pathname === '/login' || !token) {
    return null;
  }

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('is_superuser');
    window.location.href = '/login';
  };

  return (
    <nav className="ql-navbar">
      <div className="ql-navbar-brand">
        <span>QL</span>
        QueueLess | Gestión de Turnos
      </div>

      <div className="ql-navbar-links">
        <Link
          to="/empleado"
          className={`ql-nav-link ${location.pathname === '/empleado' ? 'active' : ''}`}
        >
          Panel Empleado
        </Link>
        <Link
          to="/admin"
          className={`ql-nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
        >
          Dashboard Admin
        </Link>
        <button onClick={cerrarSesion} className="ql-btn ql-btn-danger">
          Cerrar Sesión
        </button>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <Navegacion />
      <main className="ql-container">
        <Routes>
          <Route path="/ciudadano" element={<VistaCiudadano />} />
          <Route path="/login" element={<Login />} />
          <Route path="/empleado" element={<RutaProtegida><VistaEmpleado /></RutaProtegida>} />
          <Route path="/admin" element={<RutaProtegida><VistaAdmin /></RutaProtegida>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;