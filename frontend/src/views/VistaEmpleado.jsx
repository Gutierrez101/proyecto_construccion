import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = `http://${window.location.hostname}:8000/api`;

export default function VistaEmpleado() {
  const [turnoActual, setTurnoActual] = useState(null);
  const navigate = useNavigate();
  const SERVICIO_ASIGNADO = 1;

  const manejarNoAutorizado = () => {
    localStorage.removeItem('token');
    alert('Tu sesión expiró o no es válida. Inicia sesión nuevamente.');
    navigate('/login');
  };

  const llamarSiguiente = async () => {
    const token = localStorage.getItem('token');
    if (!token) return manejarNoAutorizado();

    const res = await fetch(`${API_URL}/turnos/llamar_siguiente/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`
      },
      body: JSON.stringify({ servicio_id: SERVICIO_ASIGNADO })
    });

    if (res.status === 401) return manejarNoAutorizado();

    if (res.ok) {
      const data = await res.json();
      setTurnoActual(data);
    } else {
      const errorData = await res.json().catch(() => ({}));
      alert(errorData.mensaje || 'No hay más turnos en espera para este servicio.');
    }
  };

  const actualizarEstado = async (nuevoEstado) => {
    const token = localStorage.getItem('token');
    if (!token) return manejarNoAutorizado();

    const res = await fetch(`${API_URL}/turnos/${turnoActual.id}/actualizar_estado/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`
      },
      body: JSON.stringify({ estado: nuevoEstado })
    });

    if (res.status === 401) return manejarNoAutorizado();

    if (res.ok && nuevoEstado === 'COMPLETADO') {
      setTurnoActual(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md mt-10">
      <h2 className="text-2xl font-bold mb-6">Módulo de Atención</h2>

      {!turnoActual ? (
        <div className="text-center py-10">
          <button
            onClick={llamarSiguiente}
            className="bg-green-600 text-white px-8 py-4 rounded-lg text-xl font-bold hover:bg-green-700"
          >
            Llamar Siguiente Turno
          </button>
        </div>
      ) : (
        <div className="border p-6 rounded-lg bg-gray-50">
          <h3 className="text-xl">Atendiendo a:</h3>
          <p className="text-3xl font-bold my-2">
            {turnoActual.codigo_turno} - {turnoActual.ciudadano_nombre}
          </p>
          <p className="text-gray-600 mb-6">
            Identificación: {turnoActual.ciudadano_identificacion}
          </p>

          <div className="flex gap-4">
            <button
              onClick={() => actualizarEstado('EN_ATENCION')}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Iniciar Trámite
            </button>
            <button
              onClick={() => actualizarEstado('COMPLETADO')}
              className="bg-gray-800 text-white px-4 py-2 rounded"
            >
              Finalizar Atención
            </button>
          </div>
        </div>
      )}
    </div>
  );
}