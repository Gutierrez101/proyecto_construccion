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
    <nav className="p-4 bg-blue-600 text-white flex justify-between items-center">
      <div className="flex gap-4">
        <Link to="/empleado">Panel Empleado</Link>
        <Link to="/admin">Dashboard Admin</Link>
      </div>
      <button onClick={cerrarSesion} className="bg-red-500 px-3 py-1 rounded text-sm">
        Cerrar Sesión
      </button>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <Navegacion />
      <div className="container mx-auto p-4">
        <Routes>
          <Route path="/ciudadano" element={<VistaCiudadano />} />
          <Route path="/login" element={<Login />} />
          <Route path="/empleado" element={<RutaProtegida><VistaEmpleado /></RutaProtegida>} />
          <Route path="/admin" element={<RutaProtegida><VistaAdmin /></RutaProtegida>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;