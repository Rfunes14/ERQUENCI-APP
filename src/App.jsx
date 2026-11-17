import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { jsPDF } from 'jspdf';
import {
  ShieldCheck, Truck, UserCheck, MapPin, Phone, AlertTriangle,
  CheckCircle2, Clock, FileText, Plus, Send, LogOut, Lock,
  Building2, Wrench, RefreshCw, Share2, Download, Car,
  Calendar, Search, Activity, Navigation, Camera, XCircle
} from 'lucide-react';

// ============================================================================
// LOGO CORPORATIVO ERQUENCI (LAZO INFINITO ESMERALDA A AZUL MÉDICO)
// ============================================================================
const ErquenciLogo = ({ subtitle = "Torre de Control ART" }) => (
  <div className="flex items-center gap-3 select-none">
    <svg width="44" height="32" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="erqGrad" x1="0" y1="40" x2="120" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34B37B" />
          <stop offset="55%" stopColor="#268786" />
          <stop offset="100%" stopColor="#1E588D" />
        </linearGradient>
      </defs>
      <path
        d="M32 16C17.64 16 6 26.745 6 40C6 53.255 17.64 64 32 64C44.5 64 53 54 62 40C71 26 79.5 16 92 16C104 16 112 24 114 34"
        stroke="url(#erqGrad)"
        strokeWidth="11"
        strokeLinecap="round"
      />
      <path
        d="M114 46C111.5 56.5 103 64 92 64C79.5 64 71 54 62 40C53 26 44.5 16 32 16"
        stroke="url(#erqGrad)"
        strokeWidth="11"
        strokeLinecap="round"
        strokeOpacity="0.85"
      />
      <path d="M22 40H42" stroke="#34B37B" strokeWidth="8" strokeLinecap="round" />
      <path d="M104 26L116 35L103 42" stroke="#1E588D" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <div>
      <div className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-[#34B37B] to-[#1E588D] bg-clip-text text-transparent">
        ERQUENCI <span className="font-semibold text-xs uppercase tracking-widest text-slate-500 ml-1">ART</span>
      </div>
      <div className="text-[11px] font-medium text-slate-500 -mt-1">{subtitle}</div>
    </div>
  </div>
);

// ============================================================================
// COMPONENTE DE FIRMA DIGITAL TÁCTIL (CANVAS RESPONSIVE)
// ============================================================================
const SignaturePad = ({ onSave, disabled }) => {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);

  const getCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvasRef.current.width / rect.width),
      y: (clientY - rect.top) * (canvasRef.current.height / rect.height),
    };
  };

  const startDraw = (e) => {
    if (disabled) return;
    setDrawing(true);
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!drawing || disabled) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getCoords(e);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1E588D';
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasStrokes(true);
  };

  const endDraw = () => setDrawing(false);

  const clearPad = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasStrokes(false);
  };

  const confirmSignature = () => {
    if (!hasStrokes) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="space-y-2">
      <div className="border-2 border-dashed border-slate-300 rounded-xl bg-white overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          width={500}
          height={180}
          className="w-full h-40 cursor-crosshair"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>
      <div className="flex justify-between items-center gap-2">
        <button
          type="button"
          onClick={clearPad}
          className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
        >
          Borrar trazo
        </button>
        <button
          type="button"
          disabled={!hasStrokes || disabled}
          onClick={confirmSignature}
          className="px-4 py-2 text-xs font-semibold text-white bg-[#34B37B] hover:bg-[#2a9666] disabled:opacity-40 rounded-lg flex items-center gap-1.5 shadow-sm"
        >
          <CheckCircle2 className="w-4 h-4" /> Confirmar Firma y Finalizar Viaje
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// CÁLCULO DE SEMÁFORO DE VENCIMIENTOS LEGALES
// ============================================================================
const evaluarVencimiento = (fechaStr) => {
  const hoy = new Date();
  const venc = new Date(fechaStr + 'T00:00:00');
  const diffDias = Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24));
  if (diffDias < 0) return { estado: 'VENCIDO', dias: diffDias, badge: 'bg-red-100 text-red-700 border-red-300', bloqueado: true };
  if (diffDias <= 30) return { estado: 'POR VENCER', dias: diffDias, badge: 'bg-amber-100 text-amber-800 border-amber-300', bloqueado: false };
  return { estado: 'VIGENTE', dias: diffDias, badge: 'bg-emerald-100 text-emerald-700 border-emerald-300', bloqueado: false };
};

// ============================================================================
// APLICACIÓN PRINCIPAL ERQUENCI ART SAAS
// ============================================================================
export default function App() {
  // Detectar si se abrió desde el link único de un paciente (?token=...)
  const params = new URLSearchParams(window.location.search);
  const pacienteTokenUrl = params.get('token');

  // Estado de sesión y modo demo comercial
  const [session, setSession] = useState(null);
  const [modoDemo, setModoDemo] = useState(true);
  const [rolActivo, setRolActivo] = useState(pacienteTokenUrl ? 'PACIENTE' : 'CENTRAL_ART');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Datos operativos (Sincronizados con Supabase + Respaldo inicial demo)
  const [prestadores, setPrestadores] = useState([
    { id: '22222222-2222-2222-2222-222222222221', razon_social: 'Erquenci Flota San Rafael S.A.S.', cuit: '30-71999111-4', zona_cobertura: 'San Rafael, Mendoza', telefono_guardia: '2604551122', habilitado_operar: true },
    { id: '22222222-2222-2222-2222-222222222222', razon_social: 'Traslados Médicos Valle del Atuel', cuit: '30-71888222-7', zona_cobertura: 'San Rafael / Malargüe', telefono_guardia: '2604663344', habilitado_operar: true },
  ]);

  const [vehiculos, setVehiculos] = useState([
    {
      id: '33333333-3333-3333-3333-333333333331',
      prestador_id: '22222222-2222-2222-2222-222222222221',
      patente: 'AE 842 KL',
      modelo: 'Peugeot 408 Feline',
      tipo_movilidad: 'AMBULATORIO',
      chofer_nombre: 'Martín Rodríguez',
      chofer_foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      licencia_venc: '2027-08-15',
      docs: [
        { tipo: 'RTO', vencimiento: '2027-05-10' },
        { tipo: 'SEGURO', vencimiento: '2027-03-20' },
        { tipo: 'HABILITACION_TRANSPORTE', vencimiento: '2027-06-01' },
        { tipo: 'MATAFUEGOS', vencimiento: '2027-04-12' },
      ],
    },
    {
      id: '33333333-3333-3333-3333-333333333332',
      prestador_id: '22222222-2222-2222-2222-222222222221',
      patente: 'AF 319 MN',
      modelo: 'Renault Kangoo Express',
      tipo_movilidad: 'SILLA_RUEDAS',
      chofer_nombre: 'Diego Morales',
      chofer_foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      licencia_venc: '2026-12-02',
      docs: [
        { tipo: 'RTO', vencimiento: '2026-11-29' },
        { tipo: 'SEGURO', vencimiento: '2027-02-15' },
        { tipo: 'HABILITACION_TRANSPORTE', vencimiento: '2027-01-30' },
        { tipo: 'MATAFUEGOS', vencimiento: '2027-05-18' },
      ],
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      prestador_id: '22222222-2222-2222-2222-222222222222',
      patente: 'AD 901 PT',
      modelo: 'Fiat Fiorino Ambulancia',
      tipo_movilidad: 'CAMILLA',
      chofer_nombre: 'Lucas Fernández',
      chofer_foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      licencia_venc: '2027-04-10',
      docs: [
        { tipo: 'RTO', vencimiento: '2027-01-10' },
        { tipo: 'SEGURO', vencimiento: '2027-03-01' },
        { tipo: 'HABILITACION_TRANSPORTE', vencimiento: '2026-11-10' }, // VENCIDO -> BLOQUEADO
        { tipo: 'MATAFUEGOS', vencimiento: '2027-02-20' },
      ],
    },
  ]);

  const [traslados, setTraslados] = useState([
    {
      id: '44444444-4444-4444-4444-444444444441',
      token_paciente: pacienteTokenUrl || '55555555-5555-5555-5555-555555555551',
      prestador_id: '22222222-2222-2222-2222-222222222221',
      vehiculo_id: '33333333-3333-3333-3333-333333333331',
      paciente_nombre: 'Carlos Alberto Méndez',
      paciente_dni: '28.451.902',
      paciente_telefono: '2604519823',
      numero_siniestro: 'SIN-2026-88412',
      tipo_movilidad_requerida: 'AMBULATORIO',
      origen_direccion: 'Av. Balloffet 1120, San Rafael',
      destino_nombre: 'Policlínica San Rafael (Av. Mitre 650)',
      fecha_programada: '2026-11-17',
      hora_programada: '16:30',
      estado: 'EN_CAMINO_DOMICILIO',
      km_reales: 4.8,
      gps_progreso: 45,
      firma_url: null,
      falla_reportada: null,
      eventos: [
        { hora: '16:05', estado: 'ASIGNADO', detalle: 'Derivado por Torre de Control Erquenci ART' },
        { hora: '16:14', estado: 'EN_CAMINO_DOMICILIO', detalle: 'Móvil AE 842 KL inició recorrido GPS' },
      ],
    },
  ]);

  const [viajeSeleccionadoId, setViajeSeleccionadoId] = useState('44444444-4444-4444-4444-444444444441');
  const [tabAdmin, setTabAdmin] = useState('TORRE'); // TORRE | FLOTA | PRESTADORES | NUEVO_VIAJE
  const [chatMensajes, setChatMensajes] = useState([
    { id: 1, rol: 'CHOFER', nombre: 'Martín Rodríguez', texto: 'Buenas tardes Carlos, ya estoy saliendo por Av. Balloffet hacia tu domicilio.', hora: '16:15' },
    { id: 2, rol: 'PACIENTE', nombre: 'Carlos Méndez', texto: 'Perfecto Martín, ya te espero en la puerta con la orden de la ART.', hora: '16:16' },
  ]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [modalDesperfecto, setModalDesperfecto] = useState(false);
  const [textoFalla, setTextoFalla] = useState('');

  // Formularios de alta
  const [nuevoViaje, setNuevoViaje] = useState({
    paciente_nombre: '',
    paciente_dni: '',
    paciente_telefono: '',
    numero_siniestro: '',
    origen_direccion: '',
    destino_nombre: 'Policlínica San Rafael (Av. Mitre 650)',
    prestador_id: '22222222-2222-2222-2222-222222222221',
    vehiculo_id: '33333333-3333-3333-3333-333333333331',
    hora_programada: '17:30',
  });

  const [nuevoPrestador, setNuevoPrestador] = useState({ razon_social: '', cuit: '', zona_cobertura: 'San Rafael, Mendoza', telefono_guardia: '' });
  const [nuevoVehiculo, setNuevoVehiculo] = useState({
    prestador_id: '22222222-2222-2222-2222-222222222221',
    patente: '',
    modelo: '',
    tipo_movilidad: 'AMBULATORIO',
    chofer_nombre: '',
    licencia_venc: '2027-06-01',
    rto_venc: '2027-06-01',
    seguro_venc: '2027-06-01',
    hab_venc: '2027-06-01',
    matafuegos_venc: '2027-06-01',
  });

  // Escuchar sesión real de Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        setModoDemo(false);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) setModoDemo(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Simulación de avance GPS cuando está en camino o a bordo
  useEffect(() => {
    const interval = setInterval(() => {
      setTraslados((prev) =>
        prev.map((t) => {
          if (t.estado === 'EN_CAMINO_DOMICILIO' && t.gps_progreso < 95) {
            return { ...t, gps_progreso: t.gps_progreso + 3 };
          }
          if (t.estado === 'PACIENTE_A_BORDO' && t.gps_progreso < 100) {
            return { ...t, gps_progreso: Math.min(100, t.gps_progreso + 4), km_reales: +(t.km_reales + 0.3).toFixed(1) };
          }
          return t;
        })
      );
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError('Credenciales inválidas o usuario no registrado en Supabase Auth.');
  };

  // Verificar si un vehículo tiene algún documento o licencia vencida
  const vehiculoEstaBloqueado = (v) => {
    const licVencida = evaluarVencimiento(v.licencia_venc).bloqueado;
    const docVencido = v.docs.some((d) => evaluarVencimiento(d.vencimiento).bloqueado);
    return licVencida || docVencido;
  };

  const viajeActivo = traslados.find((t) => t.id === viajeSeleccionadoId) || traslados[0];
  const vehiculoAsignado = vehiculos.find((v) => v.id === viajeActivo?.vehiculo_id);
  const prestadorAsignado = prestadores.find((p) => p.id === viajeActivo?.prestador_id);

  // Actualizar estado del viaje y guardar evento de auditoría
  const cambiarEstadoViaje = async (id, nuevoEstado, extra = {}) => {
    const ahora = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    setTraslados((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              estado: nuevoEstado,
              ...extra,
              eventos: [...t.eventos, { hora: ahora, estado: nuevoEstado, detalle: `Actualizado a ${nuevoEstado.replace(/_/g, ' ')}` }],
            }
          : t
      )
    );
    // Sincronizar también en Supabase si existe el registro
    await supabase.from('traslados').update({ estado: nuevoEstado }).eq('id', id);
  };

  // Reporte de desperfecto mecánico desde app chofer
  const enviarReporteDesperfecto = () => {
    if (!textoFalla.trim()) return;
    cambiarEstadoViaje(viajeActivo.id, 'ALERTA_DESPERFECTO', { falla_reportada: textoFalla });
    setModalDesperfecto(false);
    setTextoFalla('');
  };

  // Reasignar móvil de auxilio desde Torre de Control ART
  const reasignarMovilAuxilio = (trasladoId, nuevoVehiculoId) => {
    const veh = vehiculos.find((v) => v.id === nuevoVehiculoId);
    if (!veh || vehiculoEstaBloqueado(veh)) return;
    cambiarEstadoViaje(trasladoId, 'ASIGNADO', {
      vehiculo_id: veh.id,
      prestador_id: veh.prestador_id,
      falla_reportada: null,
    });
  };

  // Crear nuevo traslado desde Torre de Control ART
  const crearNuevoTraslado = async (e) => {
    e.preventDefault();
    const veh = vehiculos.find((v) => v.id === nuevoViaje.vehiculo_id);
    if (veh && vehiculoEstaBloqueado(veh)) {
      alert('No se puede asignar un móvil con documentación o licencia vencida.');
      return;
    }
    const idNuevo = crypto.randomUUID();
    const tokenNuevo = crypto.randomUUID();
    const registro = {
      id: idNuevo,
      token_paciente: tokenNuevo,
      ...nuevoViaje,
      fecha_programada: new Date().toISOString().split('T')[0],
      estado: 'ASIGNADO',
      km_reales: 0,
      gps_progreso: 10,
      firma_url: null,
      falla_reportada: null,
      eventos: [{ hora: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }), estado: 'ASIGNADO', detalle: 'Orden emitida por Torre de Control Erquenci ART' }],
    };
    setTraslados([registro, ...traslados]);
    setViajeSeleccionadoId(idNuevo);
    setTabAdmin('TORRE');
  };

  // Generar PDF oficial de auditoría y liquidación para la ART
  const descargarPdfLiquidacion = (t) => {
    const doc = new jsPDF();
    const veh = vehiculos.find((v) => v.id === t.vehiculo_id);
    const prest = prestadores.find((p) => p.id === t.prestador_id);

    doc.setFillColor(30, 88, 141);
    doc.rect(0, 0, 210, 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('ERQUENCI ART — COMPROBANTE DE TRASLADO AUDITADO', 14, 18);
    doc.setFontSize(10);
    doc.text('Sistema Centralizado de Gestión de Traslados Sanitarios | Ley 25.326', 14, 26);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.text(`N° Siniestro ART: ${t.numero_siniestro}`, 14, 44);
    doc.text(`Fecha y Hora: ${t.fecha_programada} - ${t.hora_programada} hs`, 14, 51);
    doc.text(`Paciente: ${t.paciente_nombre} (DNI: ${t.paciente_dni})`, 14, 58);
    doc.text(`Origen: ${t.origen_direccion}`, 14, 65);
    doc.text(`Destino Médico: ${t.destino_nombre}`, 14, 72);

    doc.line(14, 78, 196, 78);
    doc.text(`Prestador Ejecutor: ${prest?.razon_social || 'N/A'}`, 14, 86);
    doc.text(`Móvil y Chofer: ${veh?.modelo || ''} (${veh?.patente || ''}) — ${veh?.chofer_nombre || ''}`, 14, 93);
    doc.text(`Kilómetros Reales Auditados por GPS: ${t.km_reales} km`, 14, 100);
    doc.text(`Estado Final: ${t.estado}`, 14, 107);

    doc.text('Trazabilidad Horaria:', 14, 120);
    t.eventos.forEach((ev, idx) => {
      doc.setFontSize(9);
      doc.text(`• [${ev.hora}] ${ev.estado}: ${ev.detalle}`, 16, 127 + idx * 6);
    });

    if (t.firma_url) {
      doc.setFontSize(10);
      doc.text('Conformidad Digital del Paciente:', 14, 165);
      doc.addImage(t.firma_url, 'PNG', 14, 170, 70, 28);
    }

    doc.save(`Liquidacion_ART_${t.numero_siniestro}.pdf`);
  };

  const enviarMensajeChat = (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim()) return;
    const remitente = rolActivo === 'PACIENTE' ? viajeActivo.paciente_nombre : vehiculoAsignado?.chofer_nombre || 'Central ART';
    setChatMensajes([
      ...chatMensajes,
      {
        id: Date.now(),
        rol: rolActivo,
        nombre: remitente,
        texto: nuevoMensaje,
        hora: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setNuevoMensaje('');
  };

  const copiarLinkPaciente = (token) => {
    const url = `${window.location.origin}/?token=${token}`;
    navigator.clipboard.writeText(url);
    alert(`Link seguro del paciente copiado para enviar por WhatsApp:\n${url}`);
  };

  // ==========================================================================
  // PANTALLA DE LOGIN REAL (SI NO ESTÁ EN MODO DEMO NI LOGUEADO)
  // ==========================================================================
  if (!modoDemo && !session && !pacienteTokenUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-teal-50/40 to-blue-100/50 p-4">
        <div className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-slate-200 p-8 space-y-6">
          <ErquenciLogo subtitle="Acceso Corporativo Seguro" />
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Correo Institucional</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operaciones@erquenci.com.ar"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#1E588D] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Contraseña</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#1E588D] outline-none"
              />
            </div>
            {authError && <p className="text-xs text-red-600 font-medium">{authError}</p>}
            <button type="submit" className="w-full py-2.5 bg-[#1E588D] hover:bg-[#16436b] text-white font-semibold rounded-xl text-sm shadow">
              Ingresar a la Plataforma
            </button>
          </form>
          <div className="pt-4 border-t border-slate-100 text-center">
            <button
              onClick={() => setModoDemo(true)}
              className="text-xs font-semibold text-[#34B37B] hover:underline"
            >
              Activar Modo Demo Comercial (Presentación ART)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* BARRA SUPERIOR CORPORATIVA */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <ErquenciLogo
            subtitle={
              rolActivo === 'CENTRAL_ART'
                ? 'Torre de Control ART — Multi-Prestador'
                : rolActivo === 'CHOFER'
                ? 'Terminal Móvil Chofer en Ruta'
                : 'Portal Seguro del Paciente'
            }
          />

          {/* SELECTOR DE VISTA PARA DEMO COMERCIAL (Oculto si el paciente entró con token directo) */}
          {!pacienteTokenUrl && (
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setRolActivo('CENTRAL_ART')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  rolActivo === 'CENTRAL_ART' ? 'bg-[#1E588D] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Torre Control ART
              </button>
              <button
                onClick={() => setRolActivo('CHOFER')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  rolActivo === 'CHOFER' ? 'bg-[#34B37B] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Car className="w-3.5 h-3.5" /> App Chofer
              </button>
              <button
                onClick={() => setRolActivo('PACIENTE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  rolActivo === 'PACIENTE' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" /> Vista Paciente
              </button>
            </div>
          )}

          {!pacienteTokenUrl && (
            <button
              onClick={() => {
                supabase.auth.signOut();
                setModoDemo(false);
              }}
              className="text-xs font-medium text-slate-500 hover:text-red-600 flex items-center gap-1"
              title="Salir a pantalla de Login"
            >
              <Lock className="w-3.5 h-3.5" /> Login Real
            </button>
          )}
        </div>
      </header>

      {/* ==================================================================== */}
      {/* VISTA 1: TORRE DE CONTROL ART (MULTI-PRESTADOR + AUDITORÍA FLOTA)    */}
      {/* ==================================================================== */}
      {rolActivo === 'CENTRAL_ART' && (
        <main className="max-w-7xl w-full mx-auto px-4 py-6 space-y-6">
          {/* ALERTA GLOBAL DE DESPERFECTO MECÁNICO EN RUTA */}
          {traslados.some((t) => t.estado === 'ALERTA_DESPERFECTO') && (
            <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-md animate-pulse">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-red-600 shrink-0" />
                <div>
                  <h3 className="font-bold text-red-900 text-sm">¡ALERTA DE DESPERFECTO MECÁNICO EN RUTA!</h3>
                  <p className="text-xs text-red-700">
                    Un móvil reportó falla mecánica con traslado activo. Reasigná inmediatamente una unidad habilitada.
                  </p>
                </div>
              </div>
              {traslados
                .filter((t) => t.estado === 'ALERTA_DESPERFECTO')
                .map((t) => (
                  <div key={t.id} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-red-200">
                    <span className="text-xs font-semibold text-slate-700">Paciente: {t.paciente_nombre}</span>
                    <select
                      className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 font-medium"
                      defaultValue=""
                      onChange={(e) => reasignarMovilAuxilio(t.id, e.target.value)}
                    >
                      <option value="" disabled>Elegir móvil de auxilio...</option>
                      {vehiculos
                        .filter((v) => !vehiculoEstaBloqueado(v) && v.id !== t.vehiculo_id)
                        .map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.patente} - {v.modelo} ({v.chofer_nombre})
                          </option>
                        ))}
                    </select>
                  </div>
                ))}
            </div>
          )}

          {/* SUB-NAVEGACIÓN TORRE DE CONTROL */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
            <button
              onClick={() => setTabAdmin('TORRE')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
                tabAdmin === 'TORRE' ? 'bg-[#1E588D] text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              <Activity className="w-4 h-4" /> Monitoreo de Traslados ({traslados.length})
            </button>
            <button
              onClick={() => setTabAdmin('NUEVO_VIAJE')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
                tabAdmin === 'NUEVO_VIAJE' ? 'bg-[#34B37B] text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              <Plus className="w-4 h-4" /> Derivar Nuevo Traslado
            </button>
            <button
              onClick={() => setTabAdmin('FLOTA')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
                tabAdmin === 'FLOTA' ? 'bg-[#1E588D] text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              <Truck className="w-4 h-4" /> Flota y Vencimientos Legales ({vehiculos.length})
            </button>
            <button
              onClick={() => setTabAdmin('PRESTADORES')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
                tabAdmin === 'PRESTADORES' ? 'bg-[#1E588D] text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4" /> Prestadores Homologados ({prestadores.length})
            </button>
          </div>

          {/* PESTAÑA 1: MONITOREO EN VIVO */}
          {tabAdmin === 'TORRE' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {traslados.map((t) => {
                  const veh = vehiculos.find((v) => v.id === t.vehiculo_id);
                  const prest = prestadores.find((p) => p.id === t.prestador_id);
                  const esAlerta = t.estado === 'ALERTA_DESPERFECTO';
                  return (
                    <div
                      key={t.id}
                      onClick={() => setViajeSeleccionadoId(t.id)}
                      className={`bg-white rounded-2xl p-5 border transition cursor-pointer ${
                        esAlerta
                          ? 'border-red-500 ring-2 ring-red-200'
                          : viajeSeleccionadoId === t.id
                          ? 'border-[#1E588D] shadow-md'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#1E588D] bg-blue-50 px-2.5 py-0.5 rounded-full">
                            {t.numero_siniestro}
                          </span>
                          <h3 className="text-base font-bold text-slate-900 mt-1">{t.paciente_nombre}</h3>
                          <p className="text-xs text-slate-500">DNI: {t.paciente_dni} • Tel: {t.paciente_telefono}</p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            esAlerta
                              ? 'bg-red-600 text-white'
                              : t.estado === 'FINALIZADO'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {t.estado.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl mb-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-[#34B37B] shrink-0" />
                          <span><strong>Origen:</strong> {t.origen_direccion}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Navigation className="w-4 h-4 text-[#1E588D] shrink-0" />
                          <span><strong>Destino:</strong> {t.destino_nombre}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-2.5">
                          {veh?.chofer_foto && (
                            <img src={veh.chofer_foto} alt={veh.chofer_nombre} className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                          )}
                          <div>
                            <div className="text-xs font-bold text-slate-800">{veh?.chofer_nombre || 'Sin asignar'}</div>
                            <div className="text-[11px] text-slate-500">
                              {prest?.razon_social} • <strong>{veh?.patente}</strong> ({t.km_reales} km GPS)
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copiarLinkPaciente(t.token_paciente);
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-[#1E588D] bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1"
                          >
                            <Share2 className="w-3.5 h-3.5" /> Link Paciente
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              descargarPdfLiquidacion(t);
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg flex items-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" /> PDF ART
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* AUDITORÍA DEL VIAJE SELECCIONADO */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 h-fit">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#1E588D]" /> Auditoría y Trazabilidad ART
                </h3>
                {viajeActivo && (
                  <>
                    <div className="space-y-2 border-l-2 border-[#34B37B] pl-3 ml-1">
                      {viajeActivo.eventos.map((ev, i) => (
                        <div key={i} className="text-xs">
                          <span className="font-bold text-slate-800">{ev.hora}</span> —{' '}
                          <span className="font-semibold text-[#1E588D]">{ev.estado}</span>
                          <p className="text-slate-500">{ev.detalle}</p>
                        </div>
                      ))}
                    </div>
                    {viajeActivo.firma_url ? (
                      <div className="pt-3 border-t border-slate-100">
                        <p className="text-xs font-bold text-emerald-700 mb-1">✓ Conformidad Firmada por Paciente:</p>
                        <img src={viajeActivo.firma_url} alt="Firma paciente" className="border rounded-xl bg-slate-50 h-24 w-full object-contain" />
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500">
                        Pendiente de firma digital del paciente al llegar a destino.
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* PESTAÑA 2: DERIVAR NUEVO TRASLADO */}
          {tabAdmin === 'NUEVO_VIAJE' && (
            <form onSubmit={crearNuevoTraslado} className="bg-white rounded-2xl border border-slate-200 p-6 max-w-2xl space-y-4">
              <h3 className="font-bold text-base text-slate-900">Emitir Orden de Traslado ART</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre del Paciente</label>
                  <input required value={nuevoViaje.paciente_nombre} onChange={(e) => setNuevoViaje({ ...nuevoViaje, paciente_nombre: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm" placeholder="Ej: Juan Pablo Sosa" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">DNI Paciente</label>
                  <input required value={nuevoViaje.paciente_dni} onChange={(e) => setNuevoViaje({ ...nuevoViaje, paciente_dni: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm" placeholder="32.456.789" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">N° Siniestro ART</label>
                  <input required value={nuevoViaje.numero_siniestro} onChange={(e) => setNuevoViaje({ ...nuevoViaje, numero_siniestro: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm" placeholder="SIN-2026-9901" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Teléfono WhatsApp</label>
                  <input required value={nuevoViaje.paciente_telefono} onChange={(e) => setNuevoViaje({ ...nuevoViaje, paciente_telefono: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm" placeholder="2604..." />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Domicilio de Retiro (San Rafael)</label>
                  <input required value={nuevoViaje.origen_direccion} onChange={(e) => setNuevoViaje({ ...nuevoViaje, origen_direccion: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm" placeholder="Calle, altura y barrio" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Centro Médico de Destino</label>
                  <select value={nuevoViaje.destino_nombre} onChange={(e) => setNuevoViaje({ ...nuevoViaje, destino_nombre: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm">
                    <option>Policlínica San Rafael (Av. Mitre 650)</option>
                    <option>Hospital Teodoro J. Schestakow (Emilio Civit 150)</option>
                    <option>Centro de Rehabilitación Cuyo (Av. H. Yrigoyen 1420)</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Asignar Móvil Habilitado (Los móviles con papeles vencidos están bloqueados automáticamente)
                  </label>
                  <select
                    value={nuevoViaje.vehiculo_id}
                    onChange={(e) => {
                      const v = vehiculos.find((item) => item.id === e.target.value);
                      setNuevoViaje({ ...nuevoViaje, vehiculo_id: e.target.value, prestador_id: v?.prestador_id || nuevoViaje.prestador_id });
                    }}
                    className="w-full border rounded-xl px-3 py-2 text-sm"
                  >
                    {vehiculos.map((v) => {
                      const bloqueado = vehiculoEstaBloqueado(v);
                      return (
                        <option key={v.id} value={v.id} disabled={bloqueado}>
                          {bloqueado ? '⛔ BLOQUEADO (Doc. Vencida) — ' : '✅ HABILITADO — '}
                          {v.patente} | {v.modelo} | Chofer: {v.chofer_nombre}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
              <button type="submit" className="px-5 py-2.5 bg-[#34B37B] hover:bg-[#2a9666] text-white font-bold rounded-xl text-sm shadow">
                Confirmar y Despachar Traslado
              </button>
            </form>
          )}

          {/* PESTAÑA 3: FLOTA Y CONTROL DE VENCIMIENTOS LEGALES */}
          {tabAdmin === 'FLOTA' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {vehiculos.map((v) => {
                  const prest = prestadores.find((p) => p.id === v.prestador_id);
                  const bloqueado = vehiculoEstaBloqueado(v);
                  const evalLic = evaluarVencimiento(v.licencia_venc);
                  return (
                    <div key={v.id} className={`bg-white rounded-2xl border p-5 space-y-3 ${bloqueado ? 'border-red-400 bg-red-50/20' : 'border-slate-200'}`}>
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 bg-slate-900 text-white font-mono text-xs font-bold rounded-lg">{v.patente}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${bloqueado ? 'bg-red-600 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                          {bloqueado ? 'BLOQUEADO ART' : 'APTO OPERAR'}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{v.modelo}</h4>
                        <p className="text-xs text-slate-500">{prest?.razon_social}</p>
                      </div>
                      <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100">
                        <img src={v.chofer_foto} alt={v.chofer_nombre} className="w-10 h-10 rounded-full object-cover" />
                        <div className="text-xs">
                          <div className="font-bold text-slate-800">{v.chofer_nombre}</div>
                          <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-semibold mt-0.5 ${evalLic.badge}`}>
                            Licencia: {v.licencia_venc} ({evalLic.estado})
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        {v.docs.map((d, idx) => {
                          const ev = evaluarVencimiento(d.vencimiento);
                          return (
                            <div key={idx} className="flex justify-between items-center text-xs">
                              <span className="text-slate-600 font-medium">{d.tipo.replace(/_/g, ' ')}</span>
                              <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${ev.badge}`}>
                                {d.vencimiento} ({ev.estado})
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Alta rápida de móvil + vencimientos */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setVehiculos([
                    ...vehiculos,
                    {
                      id: crypto.randomUUID(),
                      prestador_id: nuevoVehiculo.prestador_id,
                      patente: nuevoVehiculo.patente.toUpperCase(),
                      modelo: nuevoVehiculo.modelo,
                      tipo_movilidad: nuevoVehiculo.tipo_movilidad,
                      chofer_nombre: nuevoVehiculo.chofer_nombre,
                      chofer_foto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
                      licencia_venc: nuevoVehiculo.licencia_venc,
                      docs: [
                        { tipo: 'RTO', vencimiento: nuevoVehiculo.rto_venc },
                        { tipo: 'SEGURO', vencimiento: nuevoVehiculo.seguro_venc },
                        { tipo: 'HABILITACION_TRANSPORTE', vencimiento: nuevoVehiculo.hab_venc },
                        { tipo: 'MATAFUEGOS', vencimiento: nuevoVehiculo.matafuegos_venc },
                      ],
                    },
                  ]);
                  setNuevoVehiculo({ ...nuevoVehiculo, patente: '', modelo: '', chofer_nombre: '' });
                }}
                className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4"
              >
                <h4 className="font-bold text-sm text-slate-900">Registrar Nuevo Móvil y Vencimientos Legales</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <select value={nuevoVehiculo.prestador_id} onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, prestador_id: e.target.value })} className="border rounded-xl px-3 py-2">
                    {prestadores.map((p) => <option key={p.id} value={p.id}>{p.razon_social}</option>)}
                  </select>
                  <input required placeholder="Patente (ej: AG 123 ZZ)" value={nuevoVehiculo.patente} onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, patente: e.target.value })} className="border rounded-xl px-3 py-2" />
                  <input required placeholder="Modelo vehículo" value={nuevoVehiculo.modelo} onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, modelo: e.target.value })} className="border rounded-xl px-3 py-2" />
                  <input required placeholder="Nombre del Chofer" value={nuevoVehiculo.chofer_nombre} onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, chofer_nombre: e.target.value })} className="border rounded-xl px-3 py-2" />
                  <div>
                    <label className="text-[10px] font-bold text-slate-500">Venc. Licencia Chofer</label>
                    <input type="date" value={nuevoVehiculo.licencia_venc} onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, licencia_venc: e.target.value })} className="w-full border rounded-xl px-3 py-1.5" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500">Venc. RTO</label>
                    <input type="date" value={nuevoVehiculo.rto_venc} onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, rto_venc: e.target.value })} className="w-full border rounded-xl px-3 py-1.5" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500">Venc. Seguro ART</label>
                    <input type="date" value={nuevoVehiculo.seguro_venc} onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, seguro_venc: e.target.value })} className="w-full border rounded-xl px-3 py-1.5" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500">Venc. Habilitación Transp.</label>
                    <input type="date" value={nuevoVehiculo.hab_venc} onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, hab_venc: e.target.value })} className="w-full border rounded-xl px-3 py-1.5" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500">Venc. Matafuegos</label>
                    <input type="date" value={nuevoVehiculo.matafuegos_venc} onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, matafuegos_venc: e.target.value })} className="w-full border rounded-xl px-3 py-1.5" />
                  </div>
                </div>
                <button type="submit" className="px-4 py-2 bg-[#1E588D] text-white font-bold rounded-xl text-xs">
                  Guardar Unidad en Flota
                </button>
              </form>
            </div>
          )}

          {/* PESTAÑA 4: PRESTADORES HOMOLOGADOS */}
          {tabAdmin === 'PRESTADORES' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                {prestadores.map((p) => (
                  <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{p.razon_social}</h4>
                      <p className="text-xs text-slate-500">CUIT: {p.cuit} • Zona: {p.zona_cobertura}</p>
                      <p className="text-xs text-slate-500">Guardia 24hs: {p.telefono_guardia}</p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">Homologado</span>
                  </div>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setPrestadores([...prestadores, { id: crypto.randomUUID(), ...nuevoPrestador, habilitado_operar: true }]);
                  setNuevoPrestador({ razon_social: '', cuit: '', zona_cobertura: 'San Rafael, Mendoza', telefono_guardia: '' });
                }}
                className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3"
              >
                <h4 className="font-bold text-sm text-slate-900">Dar de Alta Nuevo Prestador</h4>
                <input required placeholder="Razón Social (ej: Ambulancias del Sur S.A.)" value={nuevoPrestador.razon_social} onChange={(e) => setNuevoPrestador({ ...nuevoPrestador, razon_social: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-xs" />
                <input required placeholder="CUIT" value={nuevoPrestador.cuit} onChange={(e) => setNuevoPrestador({ ...nuevoPrestador, cuit: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-xs" />
                <input required placeholder="Zona de Cobertura" value={nuevoPrestador.zona_cobertura} onChange={(e) => setNuevoPrestador({ ...nuevoPrestador, zona_cobertura: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-xs" />
                <input required placeholder="Teléfono de Guardia" value={nuevoPrestador.telefono_guardia} onChange={(e) => setNuevoPrestador({ ...nuevoPrestador, telefono_guardia: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-xs" />
                <button type="submit" className="px-4 py-2 bg-[#34B37B] text-white font-bold rounded-xl text-xs">
                  Homologar Prestador en Erquenci ART
                </button>
              </form>
            </div>
          )}
        </main>
      )}

      {/* ==================================================================== */}
      {/* VISTA 2: TERMINAL MÓVIL DEL CHOFER                                   */}
      {/* ==================================================================== */}
      {rolActivo === 'CHOFER' && viajeActivo && (
        <main className="max-w-xl w-full mx-auto px-4 py-6 space-y-5">
          {/* Credencial Chofer */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={vehiculoAsignado?.chofer_foto} alt="Chofer" className="w-12 h-12 rounded-full object-cover border-2 border-[#34B37B]" />
              <div>
                <h2 className="font-bold text-sm text-slate-900">{vehiculoAsignado?.chofer_nombre}</h2>
                <p className="text-xs text-slate-500">{vehiculoAsignado?.modelo} • <strong>{vehiculoAsignado?.patente}</strong></p>
              </div>
            </div>
            <button
              onClick={() => setModalDesperfecto(true)}
              className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Wrench className="w-4 h-4" /> Reportar Falla
            </button>
          </div>

          {/* Tarjeta del Paciente Asignado */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-bold text-[#1E588D] bg-blue-50 px-2.5 py-0.5 rounded-full">
                  {viajeActivo.numero_siniestro}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{viajeActivo.paciente_nombre}</h3>
                <p className="text-xs text-slate-500">DNI: {viajeActivo.paciente_dni}</p>
              </div>
              <a href={`tel:${viajeActivo.paciente_telefono}`} className="p-2.5 bg-emerald-50 text-[#34B37B] rounded-full">
                <Phone className="w-5 h-5" />
              </a>
            </div>

            <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl text-xs">
              <div><strong>Retirar en:</strong> {viajeActivo.origen_direccion}</div>
              <div><strong>Llevar a:</strong> {viajeActivo.destino_nombre}</div>
              <div><strong>Distancia GPS acumulada:</strong> {viajeActivo.km_reales} km</div>
            </div>

            {/* Botonera secuencial de estados */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => cambiarEstadoViaje(viajeActivo.id, 'EN_CAMINO_DOMICILIO')}
                className={`py-2.5 rounded-xl text-xs font-bold border ${viajeActivo.estado === 'EN_CAMINO_DOMICILIO' ? 'bg-[#1E588D] text-white' : 'bg-white text-slate-700'}`}
              >
                1. En Camino a Domicilio
              </button>
              <button
                onClick={() => cambiarEstadoViaje(viajeActivo.id, 'EN_DOMICILIO')}
                className={`py-2.5 rounded-xl text-xs font-bold border ${viajeActivo.estado === 'EN_DOMICILIO' ? 'bg-[#1E588D] text-white' : 'bg-white text-slate-700'}`}
              >
                2. Llegué a Puerta
              </button>
              <button
                onClick={() => cambiarEstadoViaje(viajeActivo.id, 'PACIENTE_A_BORDO')}
                className={`col-span-2 py-2.5 rounded-xl text-xs font-bold border ${viajeActivo.estado === 'PACIENTE_A_BORDO' ? 'bg-[#34B37B] text-white' : 'bg-white text-slate-700'}`}
              >
                3. Paciente a Bordo — Iniciar Traslado a Clínica
              </button>
            </div>

            {/* Firma del paciente con el dedo */}
            <div className="pt-3 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Firma Digital del Paciente al Finalizar (Con el dedo en pantalla):
              </label>
              <SignaturePad
                disabled={viajeActivo.estado === 'FINALIZADO'}
                onSave={(dataUrl) => cambiarEstadoViaje(viajeActivo.id, 'FINALIZADO', { firma_url: dataUrl })}
              />
            </div>
          </div>

          {/* Chat Directo Chofer <-> Paciente */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <h4 className="font-bold text-xs text-slate-700 uppercase">Chat Directo con el Paciente</h4>
            <div className="max-h-40 overflow-y-auto space-y-2 bg-slate-50 p-3 rounded-xl">
              {chatMensajes.map((m) => (
                <div key={m.id} className={`text-xs p-2 rounded-lg max-w-[85%] ${m.rol === 'CHOFER' ? 'bg-[#1E588D] text-white ml-auto' : 'bg-white border text-slate-800'}`}>
                  <div className="font-bold text-[10px] opacity-80">{m.nombre} • {m.hora}</div>
                  <div>{m.texto}</div>
                </div>
              ))}
            </div>
            <form onSubmit={enviarMensajeChat} className="flex gap-2">
              <input value={nuevoMensaje} onChange={(e) => setNuevoMensaje(e.target.value)} placeholder="Escribir mensaje al paciente..." className="flex-1 border rounded-xl px-3 py-2 text-xs" />
              <button type="submit" className="px-3.5 py-2 bg-[#34B37B] text-white rounded-xl">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Modal de Reporte de Desperfecto */}
          {modalDesperfecto && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
                <div className="flex items-center gap-2 text-red-600 font-bold text-base">
                  <AlertTriangle className="w-6 h-6" /> Reportar Desperfecto Mecánico
                </div>
                <p className="text-xs text-slate-600">
                  Esto enviará una alerta sonora inmediata a la Torre de Control de Erquenci ART con tu ubicación GPS para despachar un móvil de auxilio.
                </p>
                <textarea
                  rows={3}
                  value={textoFalla}
                  onChange={(e) => setTextoFalla(e.target.value)}
                  placeholder="Describí la falla (ej: Pinchadura de neumático en Av. Mitre, problema de embrague...)"
                  className="w-full border rounded-xl p-3 text-xs"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setModalDesperfecto(false)} className="px-4 py-2 text-xs font-semibold text-slate-600">Cancelar</button>
                  <button onClick={enviarReporteDesperfecto} className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl text-xs">
                    Enviar Alerta Urgente a Central
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      )}

      {/* ==================================================================== */}
      {/* VISTA 3: PORTAL SEGURO DEL PACIENTE (AISLADO POR TOKEN ÚNICO)        */}
      {/* ==================================================================== */}
      {rolActivo === 'PACIENTE' && viajeActivo && (
        <main className="max-w-lg w-full mx-auto px-4 py-6 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Mapa visual de progreso en tiempo real */}
            <div className="bg-gradient-to-r from-[#1E588D] to-[#268786] p-5 text-white">
              <div className="flex justify-between items-center text-xs opacity-90 mb-1">
                <span>Traslado Autorizado ART</span>
                <span>{viajeActivo.numero_siniestro}</span>
              </div>
              <h2 className="text-lg font-bold">Hola, {viajeActivo.paciente_nombre}</h2>
              <p className="text-xs text-blue-100 mt-0.5">Estado actual: <strong>{viajeActivo.estado.replace(/_/g, ' ')}</strong></p>

              {/* Barra de recorrido GPS */}
              <div className="mt-4 bg-white/20 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-[#34B37B] h-full transition-all duration-700"
                  style={{ width: `${viajeActivo.gps_progreso}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] mt-1.5 text-blue-100">
                <span>Tu Domicilio</span>
                <span>Móvil al {viajeActivo.gps_progreso}%</span>
                <span>Clínica Destino</span>
              </div>
            </div>

            {/* Datos del Chofer y Vehículo asignado */}
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={vehiculoAsignado?.chofer_foto}
                    alt={vehiculoAsignado?.chofer_nombre}
                    className="w-14 h-14 rounded-full object-cover border-2 border-[#34B37B]"
                  />
                  <div>
                    <div className="text-[11px] font-bold text-[#34B37B] uppercase">Tu Chofer Asignado</div>
                    <h3 className="font-bold text-base text-slate-900">{vehiculoAsignado?.chofer_nombre}</h3>
                    <p className="text-xs text-slate-600">
                      {vehiculoAsignado?.modelo} • Patente: <strong>{vehiculoAsignado?.patente}</strong>
                    </p>
                  </div>
                </div>
                <a href={`tel:${prestadorAsignado?.telefono_guardia}`} className="p-3 bg-blue-50 text-[#1E588D] rounded-full">
                  <Phone className="w-5 h-5" />
                </a>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl text-xs space-y-1.5 text-slate-700">
                <div><strong>Punto de retiro:</strong> {viajeActivo.origen_direccion}</div>
                <div><strong>Destino médico:</strong> {viajeActivo.destino_nombre}</div>
              </div>
            </div>
          </div>

          {/* Chat del Paciente con su Chofer */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <h4 className="font-bold text-xs text-slate-700 uppercase">Chat con tu Chofer</h4>
            <div className="max-h-40 overflow-y-auto space-y-2 bg-slate-50 p-3 rounded-xl">
              {chatMensajes.map((m) => (
                <div key={m.id} className={`text-xs p-2 rounded-lg max-w-[85%] ${m.rol === 'PACIENTE' ? 'bg-[#34B37B] text-white ml-auto' : 'bg-white border text-slate-800'}`}>
                  <div className="font-bold text-[10px] opacity-80">{m.nombre} • {m.hora}</div>
                  <div>{m.texto}</div>
                </div>
              ))}
            </div>
            <form onSubmit={enviarMensajeChat} className="flex gap-2">
              <input value={nuevoMensaje} onChange={(e) => setNuevoMensaje(e.target.value)} placeholder="Escribile a tu chofer..." className="flex-1 border rounded-xl px-3 py-2 text-xs" />
              <button type="submit" className="px-3.5 py-2 bg-[#1E588D] text-white rounded-xl">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </main>
      )}
    </div>
  );
}
