import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [credenciales, setCredenciales] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const iniciarSesion = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const res = await fetch('http://localhost:8000/api/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credenciales)
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('is_superuser', data.is_superuser);
        // Redirige según el rol del usuario
        if (data.is_superuser) {
          navigate('/admin');
        } else {
          navigate('/empleado');
        }
      } else {
        setError(data.error || 'Credenciales incorrectas. Verifique su usuario y contraseña.');
      }
    } catch (err) {
      setError('No se pudo conectar con el servidor. Verifique que el backend esté en ejecución.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '48px auto' }}>
      <div className="ql-card">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span
            style={{
              display: 'inline-block',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              fontWeight: '700',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              marginBottom: '8px'
            }}
          >
            SISTEMA QUEUELESS
          </span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--secondary)' }}>
            Acceso Personal
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Ingrese sus credenciales institucionales
          </p>
        </div>

        {error && <div className="ql-alert ql-alert-error">{error}</div>}

        <form onSubmit={iniciarSesion}>
          <div className="ql-form-group">
            <label className="ql-label" htmlFor="username">
              Usuario
            </label>
            <input
              id="username"
              type="text"
              placeholder="Ej. empleado_ventanilla"
              required
              className="ql-input"
              value={credenciales.username}
              onChange={(e) => setCredenciales({ ...credenciales, username: e.target.value })}
            />
          </div>

          <div className="ql-form-group" style={{ marginBottom: '22px' }}>
            <label className="ql-label" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              required
              className="ql-input"
              value={credenciales.password}
              onChange={(e) => setCredenciales({ ...credenciales, password: e.target.value })}
            />
          </div>

          <button type="submit" className="ql-btn ql-btn-primary ql-btn-block" disabled={cargando}>
            {cargando ? 'Verificando acceso...' : 'Ingresar al Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}