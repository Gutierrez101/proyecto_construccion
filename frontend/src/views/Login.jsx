import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [credenciales, setCredenciales] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const iniciarSesion = async (e) => {
    e.preventDefault();
    setError('');

    const res = await fetch('http://192.168.100.45:8000/api/login/', {
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
      setError(data.error || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="max-w-sm mx-auto bg-white p-6 rounded-lg shadow-md mt-16">
      <h2 className="text-2xl font-bold mb-6 text-center">Acceso Personal</h2>
      {error && <p className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">{error}</p>}
      <form onSubmit={iniciarSesion} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Usuario"
          required
          className="border p-2 rounded"
          onChange={(e) => setCredenciales({ ...credenciales, username: e.target.value })}
        />
        <input
          type="password"
          placeholder="Contraseña"
          required
          className="border p-2 rounded"
          onChange={(e) => setCredenciales({ ...credenciales, password: e.target.value })}
        />
        <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 font-semibold">
          Ingresar
        </button>
      </form>
    </div>
  );
}