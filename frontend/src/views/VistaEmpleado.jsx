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

    if (res.ok) {
      if (nuevoEstado === 'COMPLETADO') {
        setTurnoActual(null);
      } else {
        setTurnoActual({ ...turnoActual, estado: nuevoEstado });
      }
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '16px auto' }}>
      <div className="ql-card">
        <div className="ql-page-header">
          <div>
            <h2 className="ql-page-title">Módulo de Atención en Ventanilla</h2>
            <p className="ql-page-subtitle">
              Gestión de llamados y atención de trámites asignados
            </p>
          </div>
          <span className="ql-badge ql-badge-llamando">
            Servicio ID #{SERVICIO_ASIGNADO}
          </span>
        </div>

        {!turnoActual ? (
          <div className="ql-empty-box">
            <h3 style={{ fontSize: '1.2rem', color: 'var(--secondary)', marginBottom: '8px' }}>
              Ventanilla Disponible
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.92rem' }}>
              Presione el botón para llamar al siguiente ciudadano en la cola de espera.
            </p>
            <button onClick={llamarSiguiente} className="ql-btn ql-btn-success ql-btn-lg">
              Llamar Siguiente Turno
            </button>
          </div>
        ) : (
          <div className="ql-attention-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Turno en Ventanilla
              </span>
              <span className={`ql-badge ${turnoActual.estado === 'EN_ATENCION' ? 'ql-badge-atencion' : 'ql-badge-llamando'}`}>
                {turnoActual.estado || 'LLAMANDO'}
              </span>
            </div>

            <div style={{ margin: '12px 0' }}>
              <span style={{ fontSize: '2.6rem', fontWeight: '900', color: 'var(--primary)' }}>
                {turnoActual.codigo_turno}
              </span>
            </div>

            <div className="ql-info-grid">
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                  CIUDADANO
                </p>
                <p style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--secondary)' }}>
                  {turnoActual.ciudadano_nombre}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                  IDENTIFICACIÓN
                </p>
                <p style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--secondary)' }}>
                  {turnoActual.ciudadano_identificacion}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => actualizarEstado('EN_ATENCION')}
                className="ql-btn ql-btn-primary"
                disabled={turnoActual.estado === 'EN_ATENCION'}
              >
                Iniciar Trámite
              </button>
              <button
                onClick={() => actualizarEstado('COMPLETADO')}
                className="ql-btn ql-btn-dark"
              >
                Finalizar Atención
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}