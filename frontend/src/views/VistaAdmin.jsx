import React, { useCallback, useEffect, useState } from 'react';

const API_URL = `http://${window.location.hostname}:8000/api`;
const servicioVacio = { nombre: '', codigo: '', descripcion: '', activo: true };

export default function VistaAdmin() {
  const [turnos, setTurnos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [filtros, setFiltros] = useState({ fecha: '', servicio: '', estado: '' });
  const [servicioForm, setServicioForm] = useState(servicioVacio);
  const [editando, setEditando] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const token = localStorage.getItem('token');

  const cargarTurnos = useCallback(async () => {
    const params = new URLSearchParams(Object.entries(filtros).filter(([, v]) => v));
    const res = await fetch(`${API_URL}/turnos/?${params}`, { headers: { Authorization: `Token ${token}` } });
    if (res.status === 401) { localStorage.removeItem('token'); window.location.href = '/login'; return; }
    const data = await res.json();
    setTurnos(data.results || data);
  }, [filtros, token]);

  const cargarServicios = useCallback(async () => {
    const res = await fetch(`${API_URL}/servicios/`, { headers: { Authorization: `Token ${token}` } });
    const data = await res.json();
    setServicios(data.results || data);
  }, [token]);

  useEffect(() => { cargarTurnos(); cargarServicios(); }, [cargarTurnos, cargarServicios]);

  const guardarServicio = async (e) => {
    e.preventDefault(); setMensaje('');
    const url = editando ? `${API_URL}/servicios/${editando}/` : `${API_URL}/servicios/`;
    const res = await fetch(url, { method: editando ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Token ${token}` }, body: JSON.stringify(servicioForm) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setMensaje(Object.values(data).flat().join(' ' ) || 'No se pudo guardar el servicio.'); return; }
    setServicioForm(servicioVacio); setEditando(null); setMensaje('Servicio guardado.'); cargarServicios();
  };

  const eliminarServicio = async (servicio) => {
    if (!window.confirm(`¿Eliminar el servicio “${servicio.nombre}”?`)) return;
    const res = await fetch(`${API_URL}/servicios/${servicio.id}/`, { method: 'DELETE', headers: { Authorization: `Token ${token}` } });
    if (!res.ok) { const data = await res.json().catch(() => ({})); setMensaje(data.error || 'No se pudo eliminar: revise si tiene turnos pendientes.'); return; }
    setMensaje('Servicio eliminado.'); cargarServicios();
  };

  const atender = async (turno) => {
    const res = await fetch(`${API_URL}/turnos/${turno.id}/atender/`, { method: 'PATCH', headers: { Authorization: `Token ${token}` } });
    if (res.ok) cargarTurnos(); else { const data = await res.json().catch(() => ({})); setMensaje(data.error || 'No se pudo atender el turno.'); }
  };

  const getBadgeColor = (estado) => ({ PENDIENTE: 'ql-badge-pendiente', LLAMANDO: 'ql-badge-llamando', EN_ATENCION: 'ql-badge-atencion', COMPLETADO: 'ql-badge-completado', CANCELADO: 'ql-badge-cancelado' }[estado] || 'ql-badge-default');
  const pendientes = turnos.filter((t) => t.estado === 'PENDIENTE').length;
  const activos = turnos.filter((t) => ['LLAMANDO', 'EN_ATENCION'].includes(t.estado)).length;
  const completados = turnos.filter((t) => t.estado === 'COMPLETADO').length;

  return <>
    <div className="ql-card">
      <div className="ql-page-header"><div><h2 className="ql-page-title">Monitor General de Turnos</h2><p className="ql-page-subtitle">Filtra, supervisa y atiende turnos</p></div><button onClick={cargarTurnos} className="ql-btn ql-btn-outline">Actualizar Lista</button></div>
      {mensaje && <div className="ql-alert">{mensaje}</div>}
      <div className="ql-stats-grid"><div className="ql-stat-card"><p className="ql-stat-label">Total Registrados</p><p className="ql-stat-value">{turnos.length}</p></div><div className="ql-stat-card"><p className="ql-stat-label">En Espera</p><p className="ql-stat-value">{pendientes}</p></div><div className="ql-stat-card"><p className="ql-stat-label">En Ventanilla</p><p className="ql-stat-value">{activos}</p></div><div className="ql-stat-card"><p className="ql-stat-label">Completados</p><p className="ql-stat-value">{completados}</p></div></div>
      <div className="ql-info-grid">
        <label className="ql-form-group">Fecha<input className="ql-input" type="date" value={filtros.fecha} onChange={(e) => setFiltros({ ...filtros, fecha: e.target.value })} /></label>
        <label className="ql-form-group">Servicio<select className="ql-select" value={filtros.servicio} onChange={(e) => setFiltros({ ...filtros, servicio: e.target.value })}><option value="">Todos</option>{servicios.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}</select></label>
        <label className="ql-form-group">Estado<select className="ql-select" value={filtros.estado} onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}><option value="">Todos</option>{['PENDIENTE', 'LLAMANDO', 'EN_ATENCION', 'COMPLETADO', 'CANCELADO'].map((e) => <option key={e}>{e}</option>)}</select></label>
      </div>
      <div className="ql-table-wrapper"><table className="ql-table"><thead><tr><th>Turno</th><th>Ciudadano</th><th>Identificación</th><th>Servicio</th><th>Estado</th><th>Fecha</th><th>Acción</th></tr></thead><tbody>{turnos.length ? turnos.map((t) => <tr key={t.id}><td>{t.codigo_turno}</td><td>{t.ciudadano_nombre}</td><td>{t.ciudadano_identificacion}</td><td>{t.servicio_nombre}</td><td><span className={`ql-badge ${getBadgeColor(t.estado)}`}>{t.estado}</span></td><td>{new Date(t.fecha_creacion).toLocaleString('es-EC')}</td><td>{['LLAMANDO', 'EN_ATENCION'].includes(t.estado) && <button className="ql-btn ql-btn-primary" onClick={() => atender(t)}>Atender</button>}</td></tr>) : <tr><td colSpan="7">No existen turnos para estos filtros.</td></tr>}</tbody></table></div>
    </div>
    <div className="ql-card" style={{ marginTop: 20 }}>
      <div className="ql-page-header"><div><h2 className="ql-page-title">Gestión de Servicios</h2><p className="ql-page-subtitle">Crear, editar y eliminar servicios disponibles</p></div></div>
      <form onSubmit={guardarServicio} className="ql-info-grid">
        <label className="ql-form-group">Nombre<input className="ql-input" required value={servicioForm.nombre} onChange={(e) => setServicioForm({ ...servicioForm, nombre: e.target.value })} /></label>
        <label className="ql-form-group">Código<input className="ql-input" required maxLength="10" value={servicioForm.codigo} onChange={(e) => setServicioForm({ ...servicioForm, codigo: e.target.value.toUpperCase() })} /></label>
        <label className="ql-form-group">Descripción<input className="ql-input" value={servicioForm.descripcion || ''} onChange={(e) => setServicioForm({ ...servicioForm, descripcion: e.target.value })} /></label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><button className="ql-btn ql-btn-primary" type="submit">{editando ? 'Guardar cambios' : 'Crear servicio'}</button>{editando && <button className="ql-btn ql-btn-outline" type="button" onClick={() => { setEditando(null); setServicioForm(servicioVacio); }}>Cancelar</button>}</div>
      </form>
      <div className="ql-table-wrapper"><table className="ql-table"><thead><tr><th>Nombre</th><th>Código</th><th>Descripción</th><th>Acciones</th></tr></thead><tbody>{servicios.map((s) => <tr key={s.id}><td>{s.nombre}</td><td>{s.codigo}</td><td>{s.descripcion}</td><td><button className="ql-btn ql-btn-outline" onClick={() => { setEditando(s.id); setServicioForm({ nombre: s.nombre, codigo: s.codigo, descripcion: s.descripcion || '', activo: s.activo }); }}>Editar</button> <button className="ql-btn ql-btn-danger" onClick={() => eliminarServicio(s)}>Eliminar</button></td></tr>)}</tbody></table></div>
    </div>
  </>;
}
