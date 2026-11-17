import React, { useState, useEffect, useCallback } from 'react';
import { requestForToken, escucharNotificacionesPrimerPlano } from '../services/firebase';

// Detecta automáticamente localhost en PC o la IP local cuando el ciudadano escanea el QR desde el celular
const API_URL = `http://${window.location.hostname}:8000/api`;

export default function VistaCiudadano() {
  const [servicios, setServicios] = useState([]);
  const [formulario, setFormulario] = useState({ nombre: '', identificacion: '', servicio_id: '' });
  const [fcmToken, setFcmToken] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [miTurno, setMiTurno] = useState(() => {
    const guardado = localStorage.getItem('mi_turno_activo');
    return guardado ? JSON.parse(guardado) : null;
  });
  const [estadoCola, setEstadoCola] = useState(null);

  // Consultar el avance y posición en la fila desde el backend
  const consultarEstadoCola = useCallback(async (turnoId) => {
    try {
      const res = await fetch(`${API_URL}/turnos/${turnoId}/estado_cola/`);
      if (res.ok) {
        const data = await res.json();
        setEstadoCola(data);
      } else if (res.status === 404) {
        localStorage.removeItem('mi_turno_activo');
        setMiTurno(null);
        setEstadoCola(null);
      }
    } catch (err) {
      console.error('Error al consultar estado de la fila:', err);
    }
  }, []);

  useEffect(() => {
    requestForToken().then((token) => {
      if (token) setFcmToken(token);
    });

    fetch(`${API_URL}/servicios/`)
      .then((res) => res.json())
      .then((data) => setServicios(data.results ? data.results : data))
      .catch((err) => console.error('Error al cargar servicios:', err));
  }, []);

  // Monitoreo continuo de la fila mientras el ciudadano tenga un turno activo
  useEffect(() => {
    if (!miTurno?.id) return;

    consultarEstadoCola(miTurno.id);

    // Refresca la pantalla al instante cuando llega una notificación push
    const desuscribir = escucharNotificacionesPrimerPlano(() => {
      consultarEstadoCola(miTurno.id);
    });

    // Respaldo automático cada 5 segundos
    const intervalo = setInterval(() => {
      if (estadoCola?.estado !== 'COMPLETADO' && estadoCola?.estado !== 'CANCELADO') {
        consultarEstadoCola(miTurno.id);
      }
    }, 5000);

    return () => {
      clearInterval(intervalo);
      if (typeof desuscribir === 'function') desuscribir();
    };
  }, [miTurno, estadoCola?.estado, consultarEstadoCola]);

  const solicitarTurno = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const res = await fetch(`${API_URL}/turnos/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ciudadano_nombre: formulario.nombre,
          ciudadano_identificacion: formulario.identificacion,
          servicio: formulario.servicio_id,
          fcm_token: fcmToken
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMiTurno(data);
        localStorage.setItem('mi_turno_activo', JSON.stringify(data));
        consultarEstadoCola(data.id);
      } else {
        setErrorMsg('Hubo un error al generar el turno. Verifique los datos ingresados.');
      }
    } catch (error) {
      setErrorMsg('No se pudo conectar con el servidor para generar el turno.');
    }
  };

  const reiniciarFormulario = () => {
    localStorage.removeItem('mi_turno_activo');
    setMiTurno(null);
    setEstadoCola(null);
    setFormulario({ nombre: '', identificacion: '', servicio_id: '' });
  };

  const obtenerBadgeEstado = (estado) => {
    switch (estado) {
      case 'LLAMANDO':
        return { clase: 'ql-badge ql-badge-llamando', texto: '¡Llamando a Ventanilla!' };
      case 'EN_ATENCION':
        return { clase: 'ql-badge ql-badge-atencion', texto: 'En Atención' };
      case 'COMPLETADO':
        return { clase: 'ql-badge ql-badge-completado', texto: 'Atención Finalizada' };
      case 'CANCELADO':
        return { clase: 'ql-badge ql-badge-cancelado', texto: 'Turno Cancelado' };
      default:
        return { clase: 'ql-badge ql-badge-pendiente', texto: 'En Fila de Espera' };
    }
  };

  const badgeActual = obtenerBadgeEstado(estadoCola?.estado);

  return (
    <div className="ql-mobile-container">
      <div className="ql-card">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span
            style={{
              display: 'inline-block',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              fontWeight: '700',
              padding: '5px 12px',
              borderRadius: '20px',
              fontSize: '0.78rem',
              marginBottom: '8px'
            }}
          >
            ATENCIÓN CIUDADANA
          </span>
          <h2 className="ql-page-title">
            {miTurno ? 'Estado de su Turno' : 'Solicitar Turno Virtual'}
          </h2>
          <p className="ql-page-subtitle">
            {miTurno
              ? 'Consulte en tiempo real el avance de la fila para su atención'
              : 'Complete sus datos para asignarle un turno de atención'}
          </p>
        </div>

        {errorMsg && <div className="ql-alert ql-alert-error">{errorMsg}</div>}

        {miTurno ? (
          <div className={`ql-ticket ${estadoCola?.estado === 'LLAMANDO' ? 'ql-ticket-calling' : ''}`}>
            <span className={badgeActual.clase}>{badgeActual.texto}</span>

            <p style={{ marginTop: '12px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              {estadoCola?.servicio_nombre || 'Servicio Seleccionado'}
            </p>

            <h1 className="ql-ticket-code">{miTurno.codigo_turno}</h1>

            <p style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--secondary)', marginBottom: '16px' }}>
              {miTurno.ciudadano_nombre || formulario.nombre}
            </p>

            {/* Panel de posición en la cola cuando el turno está PENDIENTE */}
            {estadoCola && estadoCola.estado === 'PENDIENTE' && (
              <div className="ql-queue-box">
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                  TURNOS ANTES QUE EL SUYO
                </span>
                <div className="ql-queue-number">{estadoCola.turnos_adelante}</div>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '8px' }}>
                  Atendiendo actualmente: <strong style={{ color: 'var(--secondary)' }}>{estadoCola.turno_actual}</strong>
                </p>
              </div>
            )}

            {/* Mensaje dinámico de estado */}
            <div
              style={{
                backgroundColor: estadoCola?.estado === 'LLAMANDO' ? 'var(--primary-light)' : '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                marginTop: '12px',
                fontSize: '0.92rem',
                fontWeight: '700',
                color: estadoCola?.estado === 'LLAMANDO' ? 'var(--primary)' : 'var(--secondary)'
              }}
            >
              {estadoCola ? estadoCola.mensaje : 'Calculando posición en la fila...'}
            </div>

            {(estadoCola?.estado === 'COMPLETADO' || estadoCola?.estado === 'CANCELADO') && (
              <button
                type="button"
                onClick={reiniciarFormulario}
                className="ql-btn ql-btn-primary ql-btn-block"
                style={{ marginTop: '18px' }}
              >
                Solicitar Nuevo Turno
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={solicitarTurno}>
            <div className="ql-form-group">
              <label className="ql-label" htmlFor="nombre">
                Nombre Completo
              </label>
              <input
                id="nombre"
                type="text"
                placeholder="Ej. Juan Pérez"
                required
                className="ql-input"
                value={formulario.nombre}
                onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
              />
            </div>

            <div className="ql-form-group">
              <label className="ql-label" htmlFor="identificacion">
                Número de Cédula / Identificación
              </label>
              <input
                id="identificacion"
                type="text"
                placeholder="Ej. 0501234567"
                required
                className="ql-input"
                value={formulario.identificacion}
                onChange={(e) => setFormulario({ ...formulario, identificacion: e.target.value })}
              />
            </div>

            <div className="ql-form-group" style={{ marginBottom: '24px' }}>
              <label className="ql-label" htmlFor="servicio">
                Trámite o Servicio Requerido
              </label>
              <select
                id="servicio"
                required
                className="ql-select"
                value={formulario.servicio_id}
                onChange={(e) => setFormulario({ ...formulario, servicio_id: e.target.value })}
              >
                <option value="">Seleccione un Trámite/Servicio</option>
                {servicios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="ql-btn ql-btn-primary ql-btn-block ql-btn-lg">
              Generar Turno
            </button>
          </form>
        )}
      </div>
    </div>
  );
}