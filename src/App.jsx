import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { jsPDF } from 'jspdf';
import {
  ShieldCheck, Truck, UserCheck, MapPin, Phone, AlertTriangle,
  CheckCircle2, Clock, FileText, Plus, Send, Lock,
  Building2, Wrench, RefreshCw, Share2, Download, Car,
  Activity, Navigation, Camera, Upload, DollarSign,
  FileSpreadsheet, MessageCircle, Search, Paperclip, Eye,
  Trash2, Edit3, Filter, Users, Accessibility, Scale,
  History, Repeat, Calendar, X, Check, Info
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
// CATÁLOGOS DE CONDICIONES CLÍNICAS Y VEHÍCULOS ESPECIALES
// ============================================================================
const CONDICIONES_PACIENTE_LABELS = {
  AMBULATORIO: 'Ambulatorio (Camina por sus medios)',
  MOVILIDAD_REDUCIDA: 'Movilidad Reducida (Requiere asistencia)',
  SILLA_DE_RUEDAS: 'En Silla de Ruedas',
  BARIATRICO_PESO_ESPECIAL: 'Bariátrico / Peso Especial (+120-150 kg)',
  POST_QUIRURGICO: 'Post-Quirúrgico / Férula o Yeso',
};

const ELEMENTOS_ORTOPEDICOS_LABELS = {
  NINGUNO: 'Ninguno',
  SILLA_RUEDAS_PLEGABLE: 'Silla de Ruedas Plegable (Baúl)',
  SILLA_RUEDAS_RIGIDA: 'Silla de Ruedas Ortopédica / Rígida',
  MULETAS_ANDADOR: 'Muletas / Andador / Bastón',
  FERULA_PIERNA_EXTENDIDA: 'Férula / Yeso (Pierna extendida atrás)',
};

const TIPOS_VEHICULO_ESPECIAL_LABELS = {
  ESTANDAR: 'Sedán Estándar',
  VEHICULO_AMPLIO_150KG: 'Vehículo Amplio / Reforzado (Paciente +120/150 kg)',
  BAUL_GRANDE_SILLA_RUEDAS: 'Sedán Baúl Grande / Rural (Silla de Ruedas)',
  UTILITARIO_RAMPA_ACCESO_BAJO: 'Utilitario / SUV Acceso Cómodo',
  ASIENTO_TRASERO_LIBRE_FKT: 'Habitáculo Trasero Despejado (Inmovilización)',
};

// Extrae las condiciones del traslado desde columnas nativas o desde el respaldo JSON en eventos
const obtenerCondicionesTraslado = (t) => {
  if (!t) {
    return {
      condicion_paciente: 'AMBULATORIO',
      lleva_acompanante: false,
      acompanante_detalle: '',
      lleva_silla_ruedas: false,
      elemento_ortopedico: 'NINGUNO',
      requiere_vehiculo_especial: false,
      peso_paciente_kg: '',
      tipo_vehiculo_especial: 'ESTANDAR',
      observaciones_traslado: '',
    };
  }
  const metaEvento = (t.eventos || []).find((ev) => ev && ev.meta_condiciones)?.meta_condiciones || {};
  const jsonCol = t.condiciones_traslado && typeof t.condiciones_traslado === 'object' ? t.condiciones_traslado : {};
  const combinado = { ...metaEvento, ...jsonCol };

  const peso = t.peso_paciente_kg ?? combinado.peso_paciente_kg ?? '';
  const llevaAcomp = Boolean(t.lleva_acompanante ?? combinado.lleva_acompanante ?? false);
  const llevaSilla = Boolean(t.lleva_silla_ruedas ?? combinado.lleva_silla_ruedas ?? false);
  const reqEspecial = Boolean(
    t.requiere_vehiculo_especial ??
      combinado.requiere_vehiculo_especial ??
      (Number(peso) >= 120)
  );

  return {
    condicion_paciente: t.condicion_paciente || combinado.condicion_paciente || 'AMBULATORIO',
    lleva_acompanante: llevaAcomp,
    acompanante_detalle: t.acompanante_detalle ?? combinado.acompanante_detalle ?? '',
    lleva_silla_ruedas: llevaSilla,
    elemento_ortopedico:
      t.elemento_ortopedico ||
      combinado.elemento_ortopedico ||
      (llevaSilla ? 'SILLA_RUEDAS_PLEGABLE' : 'NINGUNO'),
    requiere_vehiculo_especial: reqEspecial,
    peso_paciente_kg: peso,
    tipo_vehiculo_especial:
      t.tipo_vehiculo_especial ||
      combinado.tipo_vehiculo_especial ||
      (Number(peso) >= 120 ? 'VEHICULO_AMPLIO_150KG' : reqEspecial ? 'UTILITARIO_RAMPA_ACCESO_BAJO' : 'ESTANDAR'),
    observaciones_traslado: t.observaciones_traslado ?? combinado.observaciones_traslado ?? '',
  };
};

// Resumen legible en texto de las condiciones del traslado (para WhatsApp, PDF y CSV)
const resumirCondicionesTexto = (t) => {
  const c = obtenerCondicionesTraslado(t);
  const partes = [];
  if (c.condicion_paciente && c.condicion_paciente !== 'AMBULATORIO') {
    partes.push(CONDICIONES_PACIENTE_LABELS[c.condicion_paciente] || c.condicion_paciente);
  }
  if (c.lleva_acompanante) {
    partes.push(`Con Acompañante${c.acompanante_detalle ? ` (${c.acompanante_detalle})` : ''}`);
  }
  if (c.lleva_silla_ruedas || (c.elemento_ortopedico && c.elemento_ortopedico !== 'NINGUNO')) {
    partes.push(ELEMENTOS_ORTOPEDICOS_LABELS[c.elemento_ortopedico] || 'Silla de Ruedas');
  }
  if (c.peso_paciente_kg) {
    partes.push(`Peso Paciente: ${c.peso_paciente_kg} kg`);
  }
  if (c.requiere_vehiculo_especial) {
    partes.push(TIPOS_VEHICULO_ESPECIAL_LABELS[c.tipo_vehiculo_especial] || 'Vehículo Especial');
  }
  if (c.observaciones_traslado) {
    partes.push(`Obs: ${c.observaciones_traslado}`);
  }
  return partes.length > 0 ? partes.join(' | ') : 'Ambulatorio estándar (sin requerimientos especiales)';
};

// ============================================================================
// GEOCODIFICACIÓN GRATUITA EN SAN RAFAEL / MENDOZA (OPENSTREETMAP NOMINATIM)
// ============================================================================
const buscarCoordenadasDireccion = async (direccion) => {
  try {
    const query = encodeURIComponent(`${direccion}, San Rafael, Mendoza, Argentina`);
    const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
    const data = await resp.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch (e) {
    console.warn('No se pudo geocodificar dirección:', e);
  }
  return null;
};

const calcularDistanciaKm = (lat1, lng1, lat2, lng2) => {
  if (!lat1 || !lng1 || !lat2 || !lng2) return 4.5;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return +(R * c * 1.25).toFixed(1);
};

// ============================================================================
// BADGES VISUALES DE CONDICIONES DEL TRASLADO
// ============================================================================
const BadgesCondicionesTraslado = ({ traslado, mostrarObservaciones = false }) => {
  const c = obtenerCondicionesTraslado(traslado);
  const tieneEspecial =
    c.lleva_acompanante ||
    c.lleva_silla_ruedas ||
    c.requiere_vehiculo_especial ||
    Number(c.peso_paciente_kg) > 0 ||
    (c.condicion_paciente && c.condicion_paciente !== 'AMBULATORIO') ||
    Boolean(c.observaciones_traslado);

  if (!tieneEspecial) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
        Ambulatorio Estándar
      </span>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {c.condicion_paciente && c.condicion_paciente !== 'AMBULATORIO' && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Activity className="w-3 h-3" />
            {CONDICIONES_PACIENTE_LABELS[c.condicion_paciente] || c.condicion_paciente}
          </span>
        )}
        {c.lleva_acompanante && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Users className="w-3 h-3" />
            Con Acompañante{c.acompanante_detalle ? `: ${c.acompanante_detalle}` : ''}
          </span>
        )}
        {(c.lleva_silla_ruedas || (c.elemento_ortopedico && c.elemento_ortopedico !== 'NINGUNO')) && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
            <Accessibility className="w-3 h-3" />
            {ELEMENTOS_ORTOPEDICOS_LABELS[c.elemento_ortopedico] || 'Silla de Ruedas'}
          </span>
        )}
        {(c.requiere_vehiculo_especial || Number(c.peso_paciente_kg) >= 100) && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-300">
            <Scale className="w-3 h-3" />
            {c.peso_paciente_kg ? `${c.peso_paciente_kg} kg • ` : ''}
            {TIPOS_VEHICULO_ESPECIAL_LABELS[c.tipo_vehiculo_especial] || 'Vehículo Especial'}
          </span>
        )}
      </div>
      {mostrarObservaciones && c.observaciones_traslado && (
        <div className="text-xs bg-amber-50/80 border border-amber-200 text-amber-900 px-3 py-1.5 rounded-lg flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <span><strong>Indicación Operativa / Médica:</strong> {c.observaciones_traslado}</span>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAPA INTERACTIVO GPS INDIVIDUAL (VISTA PACIENTE Y DETALLE)
// ============================================================================
const MapaSeguimientoGps = ({
  progreso,
  origenTexto,
  destinoTexto,
  origenCoordsProp,
  destinoCoordsProp,
  patente,
  choferNombre,
  coordsReales,
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerMovilRef = useRef(null);

  const origenCoords =
    origenCoordsProp?.lat && origenCoordsProp?.lng
      ? [origenCoordsProp.lat, origenCoordsProp.lng]
      : [-34.6245, -68.3480];
  const destinoCoords =
    destinoCoordsProp?.lat && destinoCoordsProp?.lng
      ? [destinoCoordsProp.lat, destinoCoordsProp.lng]
      : [-34.6148, -68.3265];

  const calcularPosicionActual = () => {
    if (coordsReales && coordsReales.lat && coordsReales.lng) {
      return [coordsReales.lat, coordsReales.lng];
    }
    const factor = Math.min(100, Math.max(0, progreso)) / 100;
    const lat = origenCoords[0] + (destinoCoords[0] - origenCoords[0]) * factor;
    const lng = origenCoords[1] + (destinoCoords[1] - origenCoords[1]) * factor;
    return [lat, lng];
  };

  useEffect(() => {
    if (!mapContainerRef.current || !window.L) return;

    if (!mapInstanceRef.current) {
      const L = window.L;
      const posInicial = calcularPosicionActual();
      const map = L.map(mapContainerRef.current, {
        center: posInicial,
        zoom: 14,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);

      L.polyline([origenCoords, destinoCoords], {
        color: '#1E588D',
        weight: 4,
        opacity: 0.65,
        dashArray: '8, 8',
      }).addTo(map);

      const iconOrigen = L.divIcon({
        className: 'custom-pin',
        html: `<div style="background:#34B37B;color:white;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">P</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
      L.marker(origenCoords, { icon: iconOrigen })
        .addTo(map)
        .bindPopup(`<b>Retiro Paciente:</b><br/>${origenTexto}`);

      const iconDestino = L.divIcon({
        className: 'custom-pin',
        html: `<div style="background:#1E588D;color:white;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">+</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
      L.marker(destinoCoords, { icon: iconDestino })
        .addTo(map)
        .bindPopup(`<b>Centro Médico:</b><br/>${destinoTexto}`);

      const iconMovil = L.divIcon({
        className: 'custom-car',
        html: `<div style="background:#0f172a;color:#34B37B;padding:4px 8px;border-radius:999px;font-weight:800;font-size:11px;border:2px solid #34B37B;white-space:nowrap;box-shadow:0 4px 10px rgba(0,0,0,0.35);">🚕 ${patente || 'MÓVIL'}</div>`,
        iconSize: [90, 28],
        iconAnchor: [45, 14],
      });
      markerMovilRef.current = L.marker(posInicial, { icon: iconMovil })
        .addTo(map)
        .bindPopup(`<b>Móvil ${patente}</b><br/>Chofer: ${choferNombre}`);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [origenTexto, destinoTexto]);

  useEffect(() => {
    if (mapInstanceRef.current && markerMovilRef.current) {
      const nuevaPos = calcularPosicionActual();
      markerMovilRef.current.setLatLng(nuevaPos);
      mapInstanceRef.current.panTo(nuevaPos, { animate: true });
    }
  }, [progreso, coordsReales]);

  return (
    <div className="relative w-full h-56 rounded-xl overflow-hidden border border-slate-200 z-10">
      <div ref={mapContainerRef} className="w-full h-full" />
      <div className="absolute bottom-2 left-2 z-[500] bg-white/95 backdrop-blur px-2.5 py-1 rounded-lg shadow text-[10px] font-bold text-slate-700 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        GPS Satelital Activo • San Rafael
      </div>
    </div>
  );
};

// ============================================================================
// MAPA GENERAL DE FLOTA EN VIVO (PARA TORRE DE CONTROL ART)
// ============================================================================
const MapaGeneralFlota = ({ trasladosActivos, vehiculos }) => {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || !window.L) return;
    const L = window.L;

    if (instanceRef.current) {
      instanceRef.current.remove();
    }

    const map = L.map(mapRef.current, {
      center: [-34.6177, -68.3301],
      zoom: 13,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    trasladosActivos.forEach((t) => {
      const veh = vehiculos.find((v) => v.id === t.vehiculo_id);
      const cond = obtenerCondicionesTraslado(t);
      const orig = t.origen_lat && t.origen_lng ? [t.origen_lat, t.origen_lng] : [-34.6245, -68.3480];
      const dest = t.destino_lat && t.destino_lng ? [t.destino_lat, t.destino_lng] : [-34.6148, -68.3265];
      const factor = Math.min(100, Math.max(0, t.gps_progreso || 20)) / 100;
      const pos = t.coords_reales?.lat
        ? [t.coords_reales.lat, t.coords_reales.lng]
        : [orig[0] + (dest[0] - orig[0]) * factor, orig[1] + (dest[1] - orig[1]) * factor];

      const badgeExtra = cond.lleva_silla_ruedas ? ' ♿' : cond.requiere_vehiculo_especial ? ' ⭐' : '';
      const icon = L.divIcon({
        className: 'fleet-pin',
        html: `<div style="background:${t.estado === 'ALERTA_DESPERFECTO' ? '#dc2626' : '#1E588D'};color:white;padding:3px 8px;border-radius:999px;font-weight:800;font-size:10px;border:2px solid #34B37B;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3);">🚕 ${veh?.patente || 'Móvil'} • ${(t.paciente_nombre || '').split(' ')[0]}${badgeExtra}</div>`,
        iconSize: [120, 24],
        iconAnchor: [60, 12],
      });

      L.marker(pos, { icon })
        .addTo(map)
        .bindPopup(
          `<b>${veh?.patente || 'Unidad'}</b> (${veh?.chofer_nombre || ''})<br/>Paciente: ${t.paciente_nombre}<br/>Condición: ${resumirCondicionesTexto(t)}<br/>Destino: ${t.destino_nombre}<br/>Estado: ${t.estado}`
        );
    });

    instanceRef.current = map;

    return () => {
      if (instanceRef.current) {
        instanceRef.current.remove();
        instanceRef.current = null;
      }
    };
  }, [trasladosActivos, vehiculos]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 bg-slate-900 text-white flex justify-between items-center text-xs">
        <span className="font-bold flex items-center gap-2">
          <Navigation className="w-4 h-4 text-[#34B37B]" /> Radar Satelital de Flota en Tiempo Real (San Rafael)
        </span>
        <span className="text-[11px] text-slate-300">{trasladosActivos.length} traslados en vista</span>
      </div>
      <div ref={mapRef} className="w-full h-64 z-10" />
    </div>
  );
};

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
  if (!fechaStr) return { estado: 'VIGENTE', dias: 99, badge: 'bg-emerald-100 text-emerald-700 border-emerald-300', bloqueado: false };
  const hoy = new Date();
  const venc = new Date(fechaStr + 'T00:00:00');
  const diffDias = Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24));
  if (diffDias < 0) return { estado: 'VENCIDO', dias: diffDias, badge: 'bg-red-100 text-red-700 border-red-300', bloqueado: true };
  if (diffDias <= 30) return { estado: 'POR VENCER', dias: diffDias, badge: 'bg-amber-100 text-amber-800 border-amber-300', bloqueado: false };
  return { estado: 'VIGENTE', dias: diffDias, badge: 'bg-emerald-100 text-emerald-700 border-emerald-300', bloqueado: false };
};

// ============================================================================
// BLOQUE REUTILIZABLE DE FORMULARIO DE CONDICIONES DEL TRASLADO
// ============================================================================
const FormularioCondicionesTraslado = ({ state, onChange }) => {
  const handlePesoChange = (val) => {
    const num = Number(val);
    const autoEspecial = num >= 120;
    onChange({
      ...state,
      peso_paciente_kg: val,
      requiere_vehiculo_especial: autoEspecial ? true : state.requiere_vehiculo_especial,
      condicion_paciente: autoEspecial ? 'BARIATRICO_PESO_ESPECIAL' : state.condicion_paciente,
      tipo_vehiculo_especial: autoEspecial ? 'VEHICULO_AMPLIO_150KG' : state.tipo_vehiculo_especial,
    });
  };

  const handleSillaChange = (checked) => {
    onChange({
      ...state,
      lleva_silla_ruedas: checked,
      condicion_paciente: checked && state.condicion_paciente === 'AMBULATORIO' ? 'SILLA_DE_RUEDAS' : state.condicion_paciente,
      elemento_ortopedico: checked
        ? state.elemento_ortopedico === 'NINGUNO'
          ? 'SILLA_RUEDAS_PLEGABLE'
          : state.elemento_ortopedico
        : 'NINGUNO',
      tipo_vehiculo_especial:
        checked && state.tipo_vehiculo_especial === 'ESTANDAR'
          ? 'BAUL_GRANDE_SILLA_RUEDAS'
          : state.tipo_vehiculo_especial,
    });
  };

  return (
    <div className="sm:col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#1E588D] flex items-center gap-1.5">
            <Accessibility className="w-4 h-4 text-[#34B37B]" />
            Condiciones Clínicas y Requerimientos del Traslado
          </h4>
          <p className="text-[11px] text-slate-500">
            Especificá si viaja con acompañante, silla de ruedas o requiere unidad amplia por peso (ej. 150 kg).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Condición General del Paciente</label>
          <select
            value={state.condicion_paciente || 'AMBULATORIO'}
            onChange={(e) => {
              const val = e.target.value;
              onChange({
                ...state,
                condicion_paciente: val,
                lleva_silla_ruedas: val === 'SILLA_DE_RUEDAS' ? true : state.lleva_silla_ruedas,
                requiere_vehiculo_especial:
                  val === 'BARIATRICO_PESO_ESPECIAL' ? true : state.requiere_vehiculo_especial,
                tipo_vehiculo_especial:
                  val === 'BARIATRICO_PESO_ESPECIAL'
                    ? 'VEHICULO_AMPLIO_150KG'
                    : val === 'SILLA_DE_RUEDAS'
                    ? 'BAUL_GRANDE_SILLA_RUEDAS'
                    : state.tipo_vehiculo_especial,
              });
            }}
            className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white font-medium"
          >
            {Object.entries(CONDICIONES_PACIENTE_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Peso Estimado del Paciente (kg) <span className="text-slate-400 font-normal">(Opcional)</span>
          </label>
          <div className="relative">
            <input
              type="number"
              min="1"
              max="350"
              value={state.peso_paciente_kg || ''}
              onChange={(e) => handlePesoChange(e.target.value)}
              placeholder="Ej: 150 (activa alerta vehículo amplio >= 120 kg)"
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white"
            />
          </div>
          {Number(state.peso_paciente_kg) >= 120 && (
            <p className="text-[11px] text-rose-600 font-bold mt-1 flex items-center gap-1">
              <Scale className="w-3.5 h-3.5" /> Paciente de {state.peso_paciente_kg} kg: se activó requerimiento de Vehículo Amplio / Especial.
            </p>
          )}
        </div>
      </div>

      {/* 3 Tarjetas de Switches: Acompañante, Silla de Ruedas, Vehículo Especial */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Acompañante */}
        <div
          className={`p-3 rounded-xl border transition ${
            state.lleva_acompanante ? 'bg-purple-50/70 border-purple-300' : 'bg-white border-slate-200'
          }`}
        >
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-purple-600" /> ¿Con Acompañante?
            </span>
            <input
              type="checkbox"
              checked={Boolean(state.lleva_acompanante)}
              onChange={(e) => onChange({ ...state, lleva_acompanante: e.target.checked })}
              className="w-4 h-4 accent-purple-600 rounded"
            />
          </label>
          {state.lleva_acompanante && (
            <input
              type="text"
              value={state.acompanante_detalle || ''}
              onChange={(e) => onChange({ ...state, acompanante_detalle: e.target.value })}
              placeholder="Nombre / Vínculo (ej: Esposa)"
              className="mt-2 w-full border border-purple-200 rounded-lg px-2.5 py-1.5 text-xs bg-white"
            />
          )}
        </div>

        {/* Silla de ruedas / Ortopedia */}
        <div
          className={`p-3 rounded-xl border transition ${
            state.lleva_silla_ruedas ? 'bg-amber-50/70 border-amber-300' : 'bg-white border-slate-200'
          }`}
        >
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Accessibility className="w-4 h-4 text-amber-600" /> ¿Silla de Ruedas?
            </span>
            <input
              type="checkbox"
              checked={Boolean(state.lleva_silla_ruedas)}
              onChange={(e) => handleSillaChange(e.target.checked)}
              className="w-4 h-4 accent-amber-600 rounded"
            />
          </label>
          {state.lleva_silla_ruedas && (
            <select
              value={state.elemento_ortopedico || 'SILLA_RUEDAS_PLEGABLE'}
              onChange={(e) => onChange({ ...state, elemento_ortopedico: e.target.value })}
              className="mt-2 w-full border border-amber-200 rounded-lg px-2 py-1.5 text-xs bg-white font-medium"
            >
              {Object.entries(ELEMENTOS_ORTOPEDICOS_LABELS)
                .filter(([k]) => k !== 'NINGUNO')
                .map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
            </select>
          )}
        </div>

        {/* Vehículo Especial */}
        <div
          className={`p-3 rounded-xl border transition ${
            state.requiere_vehiculo_especial ? 'bg-rose-50/70 border-rose-300' : 'bg-white border-slate-200'
          }`}
        >
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Car className="w-4 h-4 text-rose-600" /> ¿Vehículo Especial?
            </span>
            <input
              type="checkbox"
              checked={Boolean(state.requiere_vehiculo_especial)}
              onChange={(e) =>
                onChange({
                  ...state,
                  requiere_vehiculo_especial: e.target.checked,
                  tipo_vehiculo_especial: e.target.checked
                    ? state.tipo_vehiculo_especial === 'ESTANDAR'
                      ? 'VEHICULO_AMPLIO_150KG'
                      : state.tipo_vehiculo_especial
                    : 'ESTANDAR',
                })
              }
              className="w-4 h-4 accent-rose-600 rounded"
            />
          </label>
          {state.requiere_vehiculo_especial && (
            <select
              value={state.tipo_vehiculo_especial || 'VEHICULO_AMPLIO_150KG'}
              onChange={(e) => onChange({ ...state, tipo_vehiculo_especial: e.target.value })}
              className="mt-2 w-full border border-rose-200 rounded-lg px-2 py-1.5 text-xs bg-white font-medium"
            >
              {Object.entries(TIPOS_VEHICULO_ESPECIAL_LABELS)
                .filter(([k]) => k !== 'ESTANDAR')
                .map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
            </select>
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Observaciones Clínicas / Indicaciones para el Chofer
        </label>
        <input
          type="text"
          value={state.observaciones_traslado || ''}
          onChange={(e) => onChange({ ...state, observaciones_traslado: e.target.value })}
          placeholder="Ej: Paciente de 150 kg con rodilla inmovilizada, correr asiento delantero al máximo y asistir en escalón..."
          className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white"
        />
      </div>
    </div>
  );
};

// ============================================================================
// APLICACIÓN PRINCIPAL ERQUENCI ART SAAS
// ============================================================================
export default function App() {
  const params = new URLSearchParams(window.location.search);
  const pacienteTokenUrl = params.get('token');

  const [session, setSession] = useState(null);
  const [modoDemo, setModoDemo] = useState(true);
  const [rolActivo, setRolActivo] = useState(pacienteTokenUrl ? 'PACIENTE' : 'CENTRAL_ART');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [sincronizandoDb, setSincronizandoDb] = useState(false);

  // Estados principales (Hidratados desde Supabase)
  const [tarifasArt, setTarifasArt] = useState([
    { id: 't-1', nombre_art: 'Prevención ART', valor_km: 1350, valor_hora_espera: 9500, bajada_bandera: 4000 },
    { id: 't-2', nombre_art: 'Galeno ART', valor_km: 1400, valor_hora_espera: 9800, bajada_bandera: 4200 },
    { id: 't-3', nombre_art: 'Asociart ART', valor_km: 1280, valor_hora_espera: 9000, bajada_bandera: 3800 },
    { id: 't-4', nombre_art: 'La Segunda ART', valor_km: 1320, valor_hora_espera: 9200, bajada_bandera: 3900 },
    { id: 't-5', nombre_art: 'Provincia ART', valor_km: 1250, valor_hora_espera: 8800, bajada_bandera: 3600 },
  ]);

  const [centrosMedicos, setCentrosMedicos] = useState([
    { id: 'cm-1', nombre: 'Policlínica San Rafael', direccion: 'Av. Mitre 650, San Rafael', lat: -34.6148, lng: -68.3265 },
    { id: 'cm-2', nombre: 'Hospital Teodoro J. Schestakow', direccion: 'Emilio Civit 150, San Rafael', lat: -34.6112, lng: -68.3385 },
    { id: 'cm-3', nombre: 'Centro de Rehabilitación Cuyo', direccion: 'Av. H. Yrigoyen 1420, San Rafael', lat: -34.6179, lng: -68.3452 },
  ]);
  const [mostrarFormCentro, setMostrarFormCentro] = useState(false);
  const [nuevoCentro, setNuevoCentro] = useState({ nombre: '', direccion: '' });

  const [prestadores, setPrestadores] = useState([
    { id: '22222222-2222-2222-2222-222222222221', razon_social: 'Erquenci Flota San Rafael S.A.S.', cuit: '30-71792870-5', zona_cobertura: 'San Rafael, Mendoza', telefono_guardia: '2604017356', habilitado_operar: true },
  ]);

  const [vehiculos, setVehiculos] = useState([
    {
      id: '33333333-3333-3333-3333-333333333331',
      prestador_id: '22222222-2222-2222-2222-222222222221',
      patente: 'AB 635 BN',
      modelo: 'Peugeot 408 1.6 HDI Feline (Sedán Amplio)',
      tipo_movilidad: 'AMPLIO_150KG_SILLA',
      chofer_nombre: 'Matías Emanuel Gatica',
      chofer_foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      licencia_venc: '2027-08-15',
      docs: [
        { tipo: 'RTO', vencimiento: '2027-05-10' },
        { tipo: 'SEGURO', vencimiento: '2027-03-20' },
        { tipo: 'HABILITACION_TRANSPORTE', vencimiento: '2027-06-01' },
        { tipo: 'MATAFUEGOS', vencimiento: '2027-04-12' },
      ],
    },
  ]);

  const [traslados, setTraslados] = useState([]);
  const [viajeSeleccionadoId, setViajeSeleccionadoId] = useState(null);
  const [tabAdmin, setTabAdmin] = useState('TORRE'); // TORRE | NUEVO_VIAJE | HISTORIAL | LIQUIDACION | FLOTA | PRESTADORES
  const [filtroArtLiquidacion, setFiltroArtLiquidacion] = useState('TODAS');
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [modalDesperfecto, setModalDesperfecto] = useState(false);
  const [textoFalla, setTextoFalla] = useState('');
  const [gpsRealActivo, setGpsRealActivo] = useState(false);
  const [buscandoGeo, setBuscandoGeo] = useState(false);

  // ============================================================================
  // ESTADOS DE FILTROS AVANZADOS, EDICIÓN Y RECURRENCIA
  // ============================================================================
  const [busquedaTorre, setBusquedaTorre] = useState('');
  const [filtroArtTorre, setFiltroArtTorre] = useState('TODAS');
  const [filtroEstadoTorre, setFiltroEstadoTorre] = useState('TODOS');
  const [filtroFechaTorre, setFiltroFechaTorre] = useState('');
  const [filtroCondicionTorre, setFiltroCondicionTorre] = useState('TODAS');
  const [busquedaHistorial, setBusquedaHistorial] = useState('');
  const [pacienteHistorialExpandido, setPacienteHistorialExpandido] = useState(null);

  // Modal de Edición de Traslado
  const [trasladoEditando, setTrasladoEditando] = useState(null);

  // Recurrencia en Nuevo Traslado (FKT / Rehabilitación)
  const [esRecurrente, setEsRecurrente] = useState(false);
  const [cantidadSesiones, setCantidadSesiones] = useState(5);
  const [frecuenciaSesiones, setFrecuenciaSesiones] = useState('LUN_MIE_VIE'); // DIARIO_HABIL | LUN_MIE_VIE | MAR_JUE

  // Formulario de Nuevo Traslado
  const [nuevoViaje, setNuevoViaje] = useState({
    art_nombre: 'Prevención ART',
    modalidad_viaje: 'IDA_VUELTA',
    paciente_nombre: '',
    paciente_dni: '',
    paciente_telefono: '',
    numero_siniestro: '',
    origen_direccion: '',
    origen_lat: -34.6245,
    origen_lng: -68.3480,
    destino_nombre: 'Policlínica San Rafael (Av. Mitre 650, San Rafael)',
    destino_lat: -34.6148,
    destino_lng: -68.3265,
    orden_adjunta_url: '',
    prestador_id: '22222222-2222-2222-2222-222222222221',
    vehiculo_id: '33333333-3333-3333-3333-333333333331',
    fecha_programada: new Date().toISOString().split('T')[0],
    hora_programada: '11:30',
    // Condiciones Clínicas y Operativas del Traslado
    condicion_paciente: 'AMBULATORIO',
    lleva_acompanante: false,
    acompanante_detalle: '',
    lleva_silla_ruedas: false,
    elemento_ortopedico: 'NINGUNO',
    requiere_vehiculo_especial: false,
    peso_paciente_kg: '',
    tipo_vehiculo_especial: 'ESTANDAR',
    observaciones_traslado: '',
  });

  const [nuevoPrestador, setNuevoPrestador] = useState({ razon_social: '', cuit: '', zona_cobertura: 'San Rafael, Mendoza', telefono_guardia: '' });
  const [nuevoVehiculo, setNuevoVehiculo] = useState({
    prestador_id: '22222222-2222-2222-2222-222222222221',
    patente: '',
    modelo: '',
    tipo_movilidad: 'AMPLIO_150KG_SILLA',
    chofer_nombre: '',
    chofer_foto: '',
    licencia_venc: '2027-06-01',
    rto_venc: '2027-06-01',
    seguro_venc: '2027-06-01',
    hab_venc: '2027-06-01',
    matafuegos_venc: '2027-06-01',
  });

  // Calcular importe total de un traslado según tarifario de la ART
  const calcularImporteTraslado = (artNombre, km, horasEspera, modalidad) => {
    const tarifa = tarifasArt.find((t) => t.nombre_art === artNombre) || tarifasArt[0];
    if (!tarifa) return 0;
    const kmFacturables = modalidad === 'IDA_VUELTA' ? km * 2 : km;
    const total =
      Number(tarifa.bajada_bandera) +
      Number(kmFacturables) * Number(tarifa.valor_km) +
      Number(horasEspera || 0) * Number(tarifa.valor_hora_espera);
    return Math.round(total);
  };

  // Cargar todos los datos desde Supabase al iniciar
  const cargarDatosDesdeSupabase = async () => {
    setSincronizandoDb(true);
    try {
      const [resPrest, resVeh, resCentros, resTarifas, resTraslados] = await Promise.all([
        supabase.from('prestadores').select('*').order('created_at', { ascending: true }),
        supabase.from('vehiculos').select('*').order('created_at', { ascending: true }),
        supabase.from('centros_medicos').select('*').order('created_at', { ascending: true }),
        supabase.from('tarifas_art').select('*').order('nombre_art', { ascending: true }),
        supabase.from('traslados').select('*').order('created_at', { ascending: false }),
      ]);

      if (resPrest.data && resPrest.data.length > 0) setPrestadores(resPrest.data);
      if (resVeh.data && resVeh.data.length > 0) {
        setVehiculos(resVeh.data);
        setNuevoViaje((prev) => ({ ...prev, vehiculo_id: resVeh.data[0].id, prestador_id: resVeh.data[0].prestador_id }));
      }
      if (resCentros.data && resCentros.data.length > 0) setCentrosMedicos(resCentros.data);
      if (resTarifas.data && resTarifas.data.length > 0) setTarifasArt(resTarifas.data);

      if (resTraslados.data) {
        setTraslados(resTraslados.data);
        if (pacienteTokenUrl) {
          const encontrado = resTraslados.data.find((t) => t.token_paciente === pacienteTokenUrl);
          if (encontrado) setViajeSeleccionadoId(encontrado.id);
        } else if (resTraslados.data.length > 0 && !viajeSeleccionadoId) {
          setViajeSeleccionadoId(resTraslados.data[0].id);
        }
      }
    } catch (err) {
      console.error('Error sincronizando Supabase:', err);
    } finally {
      setSincronizandoDb(false);
    }
  };

  useEffect(() => {
    cargarDatosDesdeSupabase();

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

    const channel = supabase
      .channel('traslados-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'traslados' }, () => {
        cargarDatosDesdeSupabase();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  // Simulación suave de avance GPS si el viaje está activo y no hay GPS físico encendido
  useEffect(() => {
    if (gpsRealActivo) return;
    const interval = setInterval(() => {
      setTraslados((prev) =>
        prev.map((t) => {
          if (t.estado === 'EN_CAMINO_DOMICILIO' && (t.gps_progreso || 0) < 95) {
            return { ...t, gps_progreso: (t.gps_progreso || 10) + 3 };
          }
          if (t.estado === 'PACIENTE_A_BORDO' && (t.gps_progreso || 0) < 100) {
            return { ...t, gps_progreso: Math.min(100, (t.gps_progreso || 50) + 4) };
          }
          return t;
        })
      );
    }, 4000);
    return () => clearInterval(interval);
  }, [gpsRealActivo]);

  const activarGpsRealDispositivo = () => {
    if (!navigator.geolocation || !viajeActivo) {
      alert('Tu navegador no soporta geolocalización GPS.');
      return;
    }
    setGpsRealActivo(true);
    navigator.geolocation.watchPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setTraslados((prev) => prev.map((t) => (t.id === viajeActivo.id ? { ...t, coords_reales: coords } : t)));
        await supabase.from('traslados').update({ coords_reales: coords }).eq('id', viajeActivo.id);
      },
      () => setGpsRealActivo(false),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
  };

  const leerArchivoBase64 = (file, cb) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => cb(reader.result);
    reader.readAsDataURL(file);
  };

  // Geocodificar domicilio del paciente en San Rafael
  const ubicarDomicilioEnMapa = async () => {
    if (!nuevoViaje.origen_direccion.trim()) return;
    setBuscandoGeo(true);
    const coords = await buscarCoordenadasDireccion(nuevoViaje.origen_direccion);
    setBuscandoGeo(false);
    if (coords) {
      setNuevoViaje((prev) => ({ ...prev, origen_lat: coords.lat, origen_lng: coords.lng }));
      alert(`Ubicación encontrada en San Rafael:\nLat: ${coords.lat.toFixed(4)}, Lng: ${coords.lng.toFixed(4)}`);
    } else {
      alert('No se encontró la altura exacta, se usará la coordenada urbana base de San Rafael.');
    }
  };

  // Guardar nuevo centro médico en Supabase
  const guardarNuevoCentroMedico = async () => {
    if (!nuevoCentro.nombre.trim()) return;
    setBuscandoGeo(true);
    const coords = nuevoCentro.direccion ? await buscarCoordenadasDireccion(nuevoCentro.direccion) : null;
    setBuscandoGeo(false);

    const payload = {
      nombre: nuevoCentro.nombre.trim(),
      direccion: nuevoCentro.direccion.trim(),
      lat: coords?.lat || -34.616,
      lng: coords?.lng || -68.332,
    };

    const { data, error } = await supabase.from('centros_medicos').insert([payload]).select().single();
    const registro = data || { id: `cm-${Date.now()}`, ...payload };
    if (error) console.warn('Guardado local centro:', error.message);

    setCentrosMedicos([...centrosMedicos, registro]);
    const label = registro.direccion ? `${registro.nombre} (${registro.direccion})` : registro.nombre;
    setNuevoViaje({
      ...nuevoViaje,
      destino_nombre: label,
      destino_lat: registro.lat,
      destino_lng: registro.lng,
    });
    setNuevoCentro({ nombre: '', direccion: '' });
    setMostrarFormCentro(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError('Credenciales inválidas o usuario no registrado en Supabase Auth.');
  };

  const vehiculoEstaBloqueado = (v) => {
    const licVencida = evaluarVencimiento(v.licencia_venc).bloqueado;
    const docVencido = (v.docs || []).some((d) => evaluarVencimiento(d.vencimiento).bloqueado);
    return licVencida || docVencido;
  };

  // Filtrado de traslados en Torre de Control
  const trasladosFiltradosTorre = traslados.filter((t) => {
    const cond = obtenerCondicionesTraslado(t);
    const veh = vehiculos.find((v) => v.id === t.vehiculo_id);
    const texto = busquedaTorre.trim().toLowerCase();
    if (texto) {
      const matchTexto =
        (t.paciente_nombre || '').toLowerCase().includes(texto) ||
        (t.paciente_dni || '').toLowerCase().includes(texto) ||
        (t.numero_siniestro || '').toLowerCase().includes(texto) ||
        (t.origen_direccion || '').toLowerCase().includes(texto) ||
        (t.destino_nombre || '').toLowerCase().includes(texto) ||
        (veh?.patente || '').toLowerCase().includes(texto) ||
        (veh?.chofer_nombre || '').toLowerCase().includes(texto);
      if (!matchTexto) return false;
    }
    if (filtroArtTorre !== 'TODAS' && t.art_nombre !== filtroArtTorre) return false;
    if (filtroEstadoTorre === 'EN_CURSO') {
      if (t.estado === 'FINALIZADO' || t.estado === 'CANCELADO') return false;
    } else if (filtroEstadoTorre !== 'TODOS' && t.estado !== filtroEstadoTorre) {
      return false;
    }
    if (filtroFechaTorre && t.fecha_programada !== filtroFechaTorre) return false;
    if (filtroCondicionTorre === 'CON_ACOMPANANTE' && !cond.lleva_acompanante) return false;
    if (
      filtroCondicionTorre === 'CON_SILLA_RUEDAS' &&
      !cond.lleva_silla_ruedas &&
      cond.elemento_ortopedico === 'NINGUNO'
    )
      return false;
    if (
      filtroCondicionTorre === 'VEHICULO_ESPECIAL' &&
      !cond.requiere_vehiculo_especial &&
      Number(cond.peso_paciente_kg || 0) < 120
    )
      return false;

    return true;
  });

  const viajeActivo =
    (pacienteTokenUrl ? traslados.find((t) => t.token_paciente === pacienteTokenUrl) : null) ||
    traslados.find((t) => t.id === viajeSeleccionadoId) ||
    trasladosFiltradosTorre[0] ||
    traslados[0];

  const vehiculoAsignado = vehiculos.find((v) => v.id === viajeActivo?.vehiculo_id);
  const prestadorAsignado = prestadores.find((p) => p.id === viajeActivo?.prestador_id);

  // Cambiar estado del viaje y guardar en Supabase
  const cambiarEstadoViaje = async (id, nuevoEstado, extra = {}) => {
    const actual = traslados.find((t) => t.id === id);
    if (!actual) return;
    const ahora = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const nuevosEventos = [
      ...(actual.eventos || []),
      { hora: ahora, estado: nuevoEstado, detalle: `Actualizado a ${nuevoEstado.replace(/_/g, ' ')}` },
    ];

    const actualizacion = {
      estado: nuevoEstado,
      eventos: nuevosEventos,
      ...extra,
    };

    setTraslados((prev) => prev.map((t) => (t.id === id ? { ...t, ...actualizacion } : t)));
    await supabase.from('traslados').update(actualizacion).eq('id', id);
  };

  // Actualizar horas de espera y recalcular importe ART
  const actualizarEsperaYKm = async (id, kmNuevos, horasEsperaNuevas) => {
    const actual = traslados.find((t) => t.id === id);
    if (!actual) return;
    const nuevoImporte = calcularImporteTraslado(actual.art_nombre, kmNuevos, horasEsperaNuevas, actual.modalidad_viaje);
    const patch = {
      km_reales: Number(kmNuevos),
      horas_espera: Number(horasEsperaNuevas),
      importe_total: nuevoImporte,
    };
    setTraslados((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    await supabase.from('traslados').update(patch).eq('id', id);
  };

  // Eliminar un traslado con confirmación
  const eliminarTraslado = async (t, e) => {
    if (e) e.stopPropagation();
    const ok = window.confirm(
      `¿Confirmás eliminar el traslado de ${t.paciente_nombre} (Siniestro ${t.numero_siniestro} - ${t.fecha_programada})?`
    );
    if (!ok) return;

    const { error } = await supabase.from('traslados').delete().eq('id', t.id);
    if (error) {
      console.warn('Aviso al eliminar en Supabase:', error.message);
    }
    const restantes = traslados.filter((item) => item.id !== t.id);
    setTraslados(restantes);
    if (viajeSeleccionadoId === t.id) {
      setViajeSeleccionadoId(restantes[0]?.id || null);
    }
  };

  // Abrir modal de edición con datos y condiciones normalizadas
  const abrirModalEdicion = (t, e) => {
    if (e) e.stopPropagation();
    const cond = obtenerCondicionesTraslado(t);
    setTrasladoEditando({
      ...t,
      ...cond,
    });
  };

  // Guardar edición de un traslado en Supabase (con respaldo automático en eventos JSONB)
  const guardarEdicionTraslado = async (e) => {
    e.preventDefault();
    if (!trasladoEditando) return;

    const nuevoImporte = calcularImporteTraslado(
      trasladoEditando.art_nombre,
      trasladoEditando.km_reales || 4.5,
      trasladoEditando.horas_espera || 0,
      trasladoEditando.modalidad_viaje
    );

    const condicionesObj = {
      condicion_paciente: trasladoEditando.condicion_paciente || 'AMBULATORIO',
      lleva_acompanante: Boolean(trasladoEditando.lleva_acompanante),
      acompanante_detalle: trasladoEditando.acompanante_detalle || '',
      lleva_silla_ruedas: Boolean(trasladoEditando.lleva_silla_ruedas),
      elemento_ortopedico: trasladoEditando.elemento_ortopedico || 'NINGUNO',
      requiere_vehiculo_especial: Boolean(trasladoEditando.requiere_vehiculo_especial),
      peso_paciente_kg: trasladoEditando.peso_paciente_kg ? Number(trasladoEditando.peso_paciente_kg) : null,
      tipo_vehiculo_especial: trasladoEditando.tipo_vehiculo_especial || 'ESTANDAR',
      observaciones_traslado: trasladoEditando.observaciones_traslado || '',
    };

    const eventosPrevios = Array.isArray(trasladoEditando.eventos) ? [...trasladoEditando.eventos] : [];
    if (eventosPrevios.length > 0) {
      eventosPrevios[0] = { ...eventosPrevios[0], meta_condiciones: condicionesObj };
    } else {
      eventosPrevios.push({
        hora: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        estado: trasladoEditando.estado || 'ASIGNADO',
        detalle: 'Traslado actualizado',
        meta_condiciones: condicionesObj,
      });
    }

    const basePatch = {
      art_nombre: trasladoEditando.art_nombre,
      modalidad_viaje: trasladoEditando.modalidad_viaje,
      prestador_id: trasladoEditando.prestador_id,
      vehiculo_id: trasladoEditando.vehiculo_id,
      paciente_nombre: trasladoEditando.paciente_nombre,
      paciente_dni: trasladoEditando.paciente_dni,
      paciente_telefono: trasladoEditando.paciente_telefono,
      numero_siniestro: trasladoEditando.numero_siniestro,
      origen_direccion: trasladoEditando.origen_direccion,
      destino_nombre: trasladoEditando.destino_nombre,
      fecha_programada: trasladoEditando.fecha_programada,
      hora_programada: trasladoEditando.hora_programada,
      estado: trasladoEditando.estado,
      km_reales: Number(trasladoEditando.km_reales || 4.5),
      horas_espera: Number(trasladoEditando.horas_espera || 0),
      importe_total: nuevoImporte,
      eventos: eventosPrevios,
    };

    const fullPatch = {
      ...basePatch,
      ...condicionesObj,
      condiciones_traslado: condicionesObj,
    };

    let { error } = await supabase.from('traslados').update(fullPatch).eq('id', trasladoEditando.id);
    if (error) {
      // Fallback si aún no corrieron migracion_supabase.sql
      await supabase.from('traslados').update(basePatch).eq('id', trasladoEditando.id);
    }

    setTraslados((prev) =>
      prev.map((item) => (item.id === trasladoEditando.id ? { ...item, ...fullPatch } : item))
    );
    setTrasladoEditando(null);
  };

  // Precargar un nuevo traslado a partir de un paciente del historial o viaje previo
  const repetirTrasladoPaciente = (t, e) => {
    if (e) e.stopPropagation();
    const cond = obtenerCondicionesTraslado(t);
    setNuevoViaje({
      art_nombre: t.art_nombre || 'Prevención ART',
      modalidad_viaje: t.modalidad_viaje || 'IDA_VUELTA',
      paciente_nombre: t.paciente_nombre || '',
      paciente_dni: t.paciente_dni || '',
      paciente_telefono: t.paciente_telefono || '',
      numero_siniestro: t.numero_siniestro || '',
      origen_direccion: t.origen_direccion || '',
      origen_lat: t.origen_lat || -34.6245,
      origen_lng: t.origen_lng || -68.3480,
      destino_nombre: t.destino_nombre || 'Policlínica San Rafael (Av. Mitre 650, San Rafael)',
      destino_lat: t.destino_lat || -34.6148,
      destino_lng: t.destino_lng || -68.3265,
      orden_adjunta_url: t.orden_adjunta_url || '',
      prestador_id: t.prestador_id || prestadores[0]?.id,
      vehiculo_id: t.vehiculo_id || vehiculos[0]?.id,
      fecha_programada: new Date().toISOString().split('T')[0],
      hora_programada: t.hora_programada || '11:30',
      ...cond,
    });
    setTabAdmin('NUEVO_VIAJE');
  };

  const enviarReporteDesperfecto = () => {
    if (!textoFalla.trim() || !viajeActivo) return;
    cambiarEstadoViaje(viajeActivo.id, 'ALERTA_DESPERFECTO', { falla_reportada: textoFalla });
    setModalDesperfecto(false);
    setTextoFalla('');
  };

  const reasignarMovilAuxilio = (trasladoId, nuevoVehiculoId) => {
    const veh = vehiculos.find((v) => v.id === nuevoVehiculoId);
    if (!veh || vehiculoEstaBloqueado(veh)) return;
    cambiarEstadoViaje(trasladoId, 'ASIGNADO', {
      vehiculo_id: veh.id,
      prestador_id: veh.prestador_id,
      falla_reportada: null,
    });
  };

  // Calcular fechas para traslados recurrentes (FKT / Rehabilitación)
  const generarFechasRecurrentes = (fechaInicioStr, totalSesiones, patron) => {
    if (!esRecurrente || totalSesiones <= 1) return [fechaInicioStr];
    const fechas = [];
    const cursor = new Date(fechaInicioStr + 'T12:00:00');
    let guard = 0;
    while (fechas.length < totalSesiones && guard < 90) {
      const diaSemana = cursor.getDay(); // 0 Dom, 1 Lun, ..., 6 Sab
      const iso = cursor.toISOString().split('T')[0];
      if (fechas.length === 0) {
        fechas.push(iso);
      } else if (patron === 'DIARIO_HABIL' && diaSemana >= 1 && diaSemana <= 5) {
        fechas.push(iso);
      } else if (patron === 'LUN_MIE_VIE' && (diaSemana === 1 || diaSemana === 3 || diaSemana === 5)) {
        fechas.push(iso);
      } else if (patron === 'MAR_JUE' && (diaSemana === 2 || diaSemana === 4)) {
        fechas.push(iso);
      }
      cursor.setDate(cursor.getDate() + 1);
      guard++;
    }
    return fechas;
  };

  // Crear nuevo traslado (o lote recurrente FKT) y guardarlo en Supabase
  const crearNuevoTraslado = async (e) => {
    e.preventDefault();
    const veh = vehiculos.find((v) => v.id === nuevoViaje.vehiculo_id);
    if (veh && vehiculoEstaBloqueado(veh)) {
      alert('No se puede asignar un móvil con documentación o licencia vencida.');
      return;
    }

    const kmEstimados = calcularDistanciaKm(
      nuevoViaje.origen_lat,
      nuevoViaje.origen_lng,
      nuevoViaje.destino_lat,
      nuevoViaje.destino_lng
    );
    const importeInicial = calcularImporteTraslado(
      nuevoViaje.art_nombre,
      kmEstimados,
      0,
      nuevoViaje.modalidad_viaje
    );

    const condicionesObj = {
      condicion_paciente: nuevoViaje.condicion_paciente || 'AMBULATORIO',
      lleva_acompanante: Boolean(nuevoViaje.lleva_acompanante),
      acompanante_detalle: nuevoViaje.acompanante_detalle || '',
      lleva_silla_ruedas: Boolean(nuevoViaje.lleva_silla_ruedas),
      elemento_ortopedico: nuevoViaje.elemento_ortopedico || 'NINGUNO',
      requiere_vehiculo_especial: Boolean(nuevoViaje.requiere_vehiculo_especial),
      peso_paciente_kg: nuevoViaje.peso_paciente_kg ? Number(nuevoViaje.peso_paciente_kg) : null,
      tipo_vehiculo_especial: nuevoViaje.tipo_vehiculo_especial || 'ESTANDAR',
      observaciones_traslado: nuevoViaje.observaciones_traslado || '',
    };

    const fechasProgramadas = generarFechasRecurrentes(
      nuevoViaje.fecha_programada || new Date().toISOString().split('T')[0],
      Number(cantidadSesiones || 1),
      frecuenciaSesiones
    );

    const listaBase = fechasProgramadas.map((fechaStr, idx) => ({
      art_nombre: nuevoViaje.art_nombre,
      modalidad_viaje: nuevoViaje.modalidad_viaje,
      prestador_id: nuevoViaje.prestador_id,
      vehiculo_id: nuevoViaje.vehiculo_id,
      paciente_nombre: nuevoViaje.paciente_nombre,
      paciente_dni: nuevoViaje.paciente_dni,
      paciente_telefono: nuevoViaje.paciente_telefono,
      numero_siniestro:
        fechasProgramadas.length > 1
          ? `${nuevoViaje.numero_siniestro} (Sesión ${idx + 1}/${fechasProgramadas.length})`
          : nuevoViaje.numero_siniestro,
      origen_direccion: nuevoViaje.origen_direccion,
      origen_lat: nuevoViaje.origen_lat,
      origen_lng: nuevoViaje.origen_lng,
      destino_nombre: nuevoViaje.destino_nombre,
      destino_lat: nuevoViaje.destino_lat,
      destino_lng: nuevoViaje.destino_lng,
      orden_adjunta_url: nuevoViaje.orden_adjunta_url || null,
      fecha_programada: fechaStr,
      hora_programada: nuevoViaje.hora_programada,
      estado: 'ASIGNADO',
      km_reales: kmEstimados,
      horas_espera: 0,
      importe_total: importeInicial,
      gps_progreso: 10,
      eventos: [
        {
          hora: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
          estado: 'ASIGNADO',
          detalle: `Orden emitida (${nuevoViaje.art_nombre}) — ${resumirCondicionesTexto(nuevoViaje)}`,
          meta_condiciones: condicionesObj,
        },
      ],
      chat_mensajes: [],
    }));

    const listaExtendida = listaBase.map((item) => ({
      ...item,
      ...condicionesObj,
      condiciones_traslado: condicionesObj,
    }));

    let { data, error } = await supabase.from('traslados').insert(listaExtendida).select();
    if (error) {
      // Fallback automático si las columnas nuevas aún no fueron creadas con migracion_supabase.sql
      const retry = await supabase.from('traslados').insert(listaBase).select();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      alert('Error al guardar traslado en Supabase: ' + error.message);
      return;
    }

    const insertados = (data || []).map((row) => ({
      ...row,
      ...condicionesObj,
      condiciones_traslado: condicionesObj,
    }));

    setTraslados([...insertados, ...traslados]);
    if (insertados[0]) setViajeSeleccionadoId(insertados[0].id);
    setNuevoViaje({
      ...nuevoViaje,
      paciente_nombre: '',
      paciente_dni: '',
      paciente_telefono: '',
      numero_siniestro: '',
      origen_direccion: '',
      orden_adjunta_url: '',
      condicion_paciente: 'AMBULATORIO',
      lleva_acompanante: false,
      acompanante_detalle: '',
      lleva_silla_ruedas: false,
      elemento_ortopedico: 'NINGUNO',
      requiere_vehiculo_especial: false,
      peso_paciente_kg: '',
      tipo_vehiculo_especial: 'ESTANDAR',
      observaciones_traslado: '',
    });
    setEsRecurrente(false);
    setTabAdmin('TORRE');
  };

  // Enviar link directo por WhatsApp al paciente (incluyendo condiciones autorizadas)
  const enviarWhatsAppPaciente = (t) => {
    const veh = vehiculos.find((v) => v.id === t.vehiculo_id);
    const urlSeguimiento = `${window.location.origin}/?token=${t.token_paciente}`;
    const telLimpio = (t.paciente_telefono || '').replace(/\D/g, '');
    const telArg = telLimpio.startsWith('54') ? telLimpio : `549${telLimpio}`;
    const resumenCond = resumirCondicionesTexto(t);
    const mensaje = encodeURIComponent(
      `Hola ${t.paciente_nombre}, te saludamos de *Erquenci Traslados ART*.\n\n` +
        `Tu traslado (${t.numero_siniestro}) para el *${t.fecha_programada} a las ${t.hora_programada || ''} hs* hacia *${t.destino_nombre}* ya está asignado:\n` +
        `• *Chofer:* ${veh?.chofer_nombre || 'Asignado'}\n` +
        `• *Vehículo:* ${veh?.modelo || ''} (Patente *${veh?.patente || ''}*)\n` +
        `• *Condiciones autorizadas:* ${resumenCond}\n\n` +
        `Seguí el móvil en tiempo real por GPS desde este enlace seguro:\n${urlSeguimiento}`
    );
    window.open(`https://wa.me/${telArg}?text=${mensaje}`, '_blank');
  };

  // Exportar planilla CSV para Excel de liquidación mensual ART (con columnas de condiciones)
  const exportarExcelLiquidacion = () => {
    const filtrados =
      filtroArtLiquidacion === 'TODAS'
        ? traslados
        : traslados.filter((t) => t.art_nombre === filtroArtLiquidacion);

    const encabezados = [
      'Fecha',
      'Hora',
      'ART',
      'Siniestro',
      'Paciente',
      'DNI',
      'Condicion Paciente',
      'Acompanante',
      'Silla de Ruedas / Ortopedia',
      'Peso (kg)',
      'Vehiculo Especial Requerido',
      'Observaciones Clinicas',
      'Origen',
      'Destino',
      'Modalidad',
      'Patente',
      'Chofer',
      'KM Facturados',
      'Horas Espera',
      'Estado',
      'Importe Total ($)',
    ];

    const filas = filtrados.map((t) => {
      const veh = vehiculos.find((v) => v.id === t.vehiculo_id);
      const cond = obtenerCondicionesTraslado(t);
      const kmFact = t.modalidad_viaje === 'IDA_VUELTA' ? (t.km_reales || 0) * 2 : t.km_reales || 0;
      return [
        t.fecha_programada,
        t.hora_programada || '',
        t.art_nombre,
        `"${t.numero_siniestro || ''}"`,
        `"${t.paciente_nombre || ''}"`,
        t.paciente_dni,
        `"${CONDICIONES_PACIENTE_LABELS[cond.condicion_paciente] || cond.condicion_paciente}"`,
        `"${cond.lleva_acompanante ? `SI (${cond.acompanante_detalle || 'Autorizado'})` : 'NO'}"`,
        `"${cond.lleva_silla_ruedas ? ELEMENTOS_ORTOPEDICOS_LABELS[cond.elemento_ortopedico] || 'SI' : 'NO'}"`,
        cond.peso_paciente_kg || '',
        `"${cond.requiere_vehiculo_especial ? TIPOS_VEHICULO_ESPECIAL_LABELS[cond.tipo_vehiculo_especial] || 'SI' : 'Estándar'}"`,
        `"${(cond.observaciones_traslado || '').replace(/"/g, "'")}"`,
        `"${t.origen_direccion || ''}"`,
        `"${t.destino_nombre || ''}"`,
        t.modalidad_viaje,
        veh?.patente || '',
        `"${veh?.chofer_nombre || ''}"`,
        kmFact,
        t.horas_espera || 0,
        t.estado,
        t.importe_total || 0,
      ].join(';');
    });

    const csv = '\uFEFF' + [encabezados.join(';'), ...filas].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Liquidacion_Erquenci_${filtroArtLiquidacion}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // PDF oficial auditado para ART (incluyendo bloque de condiciones clínicas del traslado)
  const descargarPdfLiquidacion = (t) => {
    const doc = new jsPDF();
    const veh = vehiculos.find((v) => v.id === t.vehiculo_id);
    const prest = prestadores.find((p) => p.id === t.prestador_id);
    const cond = obtenerCondicionesTraslado(t);
    const kmFact = t.modalidad_viaje === 'IDA_VUELTA' ? (t.km_reales || 0) * 2 : t.km_reales || 0;

    doc.setFillColor(30, 88, 141);
    doc.rect(0, 0, 210, 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('ERQUENCI ART — COMPROBANTE DE TRASLADO AUDITADO', 14, 18);
    doc.setFontSize(10);
    doc.text(`Aseguradora: ${t.art_nombre} | Modalidad: ${t.modalidad_viaje}`, 14, 26);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.text(`N° Siniestro ART: ${t.numero_siniestro}`, 14, 42);
    doc.text(`Fecha y Hora: ${t.fecha_programada} - ${t.hora_programada || ''} hs`, 14, 49);
    doc.text(`Paciente: ${t.paciente_nombre} (DNI: ${t.paciente_dni})`, 14, 56);
    doc.text(`Origen: ${t.origen_direccion}`, 14, 63);
    doc.text(`Destino Médico: ${t.destino_nombre}`, 14, 70);

    // Bloque de Condiciones Clínicas y Operativas del Traslado
    doc.setFillColor(241, 245, 249);
    doc.rect(14, 75, 182, 26, 'F');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 88, 141);
    doc.text('CONDICIONES CLÍNICAS Y REQUERIMIENTOS DEL TRASLADO:', 17, 81);
    doc.setTextColor(30, 41, 59);
    doc.text(
      `• Condición: ${CONDICIONES_PACIENTE_LABELS[cond.condicion_paciente] || cond.condicion_paciente} | Acompañante: ${
        cond.lleva_acompanante ? `SÍ (${cond.acompanante_detalle || 'Autorizado'})` : 'NO'
      }`,
      17,
      87
    );
    doc.text(
      `• Silla de Ruedas / Ortopedia: ${
        cond.lleva_silla_ruedas ? ELEMENTOS_ORTOPEDICOS_LABELS[cond.elemento_ortopedico] || 'SÍ' : 'NO'
      } | Peso: ${cond.peso_paciente_kg ? `${cond.peso_paciente_kg} kg` : 'Estándar'} | Unidad: ${
        TIPOS_VEHICULO_ESPECIAL_LABELS[cond.tipo_vehiculo_especial] || 'Estándar'
      }`,
      17,
      93
    );
    if (cond.observaciones_traslado) {
      doc.text(`• Observaciones: ${cond.observaciones_traslado.slice(0, 95)}`, 17, 99);
    }

    doc.line(14, 105, 196, 105);
    doc.setFontSize(10.5);
    doc.text(`Prestador Ejecutor: ${prest?.razon_social || 'Erquenci S.A.S.'}`, 14, 112);
    doc.text(`Móvil y Chofer: ${veh?.modelo || ''} (${veh?.patente || ''}) — ${veh?.chofer_nombre || ''}`, 14, 119);
    doc.text(`Kilómetros Facturables: ${kmFact} km | Horas de Espera: ${t.horas_espera || 0} hs`, 14, 126);
    doc.setFontSize(12);
    doc.text(`IMPORTE LIQUIDACIÓN ART: $${(t.importe_total || 0).toLocaleString('es-AR')}`, 14, 134);

    doc.setFontSize(10);
    doc.text('Trazabilidad Horaria:', 14, 144);
    (t.eventos || []).forEach((ev, idx) => {
      doc.setFontSize(8.5);
      doc.text(`• [${ev.hora}] ${ev.estado}: ${(ev.detalle || '').slice(0, 90)}`, 16, 150 + idx * 5.5);
    });

    if (t.firma_url) {
      doc.setFontSize(10);
      doc.text('Conformidad Digital del Paciente:', 14, 185);
      doc.addImage(t.firma_url, 'PNG', 14, 190, 70, 28);
    }

    doc.save(`Liquidacion_${t.art_nombre}_${t.numero_siniestro}.pdf`);
  };

  // Chat persistente por traslado en Supabase
  const enviarMensajeChat = async (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || !viajeActivo) return;
    const remitente =
      rolActivo === 'PACIENTE' ? viajeActivo.paciente_nombre : vehiculoAsignado?.chofer_nombre || 'Central ART';
    const msg = {
      id: Date.now(),
      rol: rolActivo,
      nombre: remitente,
      texto: nuevoMensaje,
      hora: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    };
    const listaActualizada = [...(viajeActivo.chat_mensajes || []), msg];
    setTraslados((prev) =>
      prev.map((t) => (t.id === viajeActivo.id ? { ...t, chat_mensajes: listaActualizada } : t))
    );
    setNuevoMensaje('');
    await supabase.from('traslados').update({ chat_mensajes: listaActualizada }).eq('id', viajeActivo.id);
  };

  // Agrupación de Historial por Paciente (DNI / Nombre)
  const historialPacientes = Object.values(
    traslados.reduce((acc, t) => {
      const clave = (t.paciente_dni || t.paciente_nombre || 'SIN-DNI').trim();
      if (!acc[clave]) {
        acc[clave] = {
          clave,
          paciente_nombre: t.paciente_nombre,
          paciente_dni: t.paciente_dni,
          paciente_telefono: t.paciente_telefono,
          art_nombre: t.art_nombre,
          ultimo_siniestro: t.numero_siniestro,
          origen_direccion: t.origen_direccion,
          ultimo_traslado: t,
          viajes: [],
          total_km: 0,
          total_importe: 0,
        };
      }
      const kmFact = t.modalidad_viaje === 'IDA_VUELTA' ? (t.km_reales || 0) * 2 : t.km_reales || 0;
      acc[clave].viajes.push(t);
      acc[clave].total_km = +(acc[clave].total_km + Number(kmFact)).toFixed(1);
      acc[clave].total_importe += Number(t.importe_total || 0);
      return acc;
    }, {})
  ).filter((p) => {
    const q = busquedaHistorial.trim().toLowerCase();
    if (!q) return true;
    return (
      (p.paciente_nombre || '').toLowerCase().includes(q) ||
      (p.paciente_dni || '').toLowerCase().includes(q) ||
      (p.ultimo_siniestro || '').toLowerCase().includes(q) ||
      (p.art_nombre || '').toLowerCase().includes(q)
    );
  });

  // PANTALLA DE LOGIN REAL
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

  const trasladosLiquidacion =
    filtroArtLiquidacion === 'TODAS'
      ? traslados
      : traslados.filter((t) => t.art_nombre === filtroArtLiquidacion);
  const totalFacturarFiltrado = trasladosLiquidacion.reduce((acc, t) => acc + Number(t.importe_total || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* BARRA SUPERIOR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <ErquenciLogo
            subtitle={
              rolActivo === 'CENTRAL_ART'
                ? 'Torre de Control ART — Conectada a Supabase'
                : rolActivo === 'CHOFER'
                ? 'Terminal Móvil Chofer en Ruta'
                : 'Portal Seguro del Paciente'
            }
          />

          {modoDemo && !pacienteTokenUrl && (
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
            <div className="flex items-center gap-3">
              <button
                onClick={cargarDatosDesdeSupabase}
                className="text-xs font-medium text-slate-500 hover:text-[#1E588D] flex items-center gap-1"
                title="Sincronizar datos con Supabase"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${sincronizandoDb ? 'animate-spin text-[#34B37B]' : ''}`} />
              </button>
              <button
                onClick={() => {
                  supabase.auth.signOut();
                  setModoDemo(false);
                }}
                className="text-xs font-medium text-slate-500 hover:text-red-600 flex items-center gap-1"
              >
                <Lock className="w-3.5 h-3.5" /> {session ? 'Cerrar Sesión' : 'Login Real'}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ==================================================================== */}
      {/* VISTA 1: TORRE DE CONTROL ART                                        */}
      {/* ==================================================================== */}
      {rolActivo === 'CENTRAL_ART' && (
        <main className="max-w-7xl w-full mx-auto px-4 py-6 space-y-6">
          {/* ALERTA DESPERFECTO */}
          {traslados.some((t) => t.estado === 'ALERTA_DESPERFECTO') && (
            <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-md animate-pulse">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-red-600 shrink-0" />
                <div>
                  <h3 className="font-bold text-red-900 text-sm">¡ALERTA DE DESPERFECTO MECÁNICO EN RUTA!</h3>
                  <p className="text-xs text-red-700">Reasigná inmediatamente una unidad habilitada.</p>
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

          {/* SUB-NAVEGACIÓN */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
            <button
              onClick={() => setTabAdmin('TORRE')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
                tabAdmin === 'TORRE' ? 'bg-[#1E588D] text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              <Activity className="w-4 h-4" /> Monitoreo y Radar ({traslados.length})
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
              onClick={() => setTabAdmin('HISTORIAL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
                tabAdmin === 'HISTORIAL' ? 'bg-[#1E588D] text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              <History className="w-4 h-4" /> Historial por Paciente ({historialPacientes.length})
            </button>
            <button
              onClick={() => setTabAdmin('LIQUIDACION')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
                tabAdmin === 'LIQUIDACION' ? 'bg-[#1E588D] text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              <DollarSign className="w-4 h-4" /> Liquidación y Tarifas ART
            </button>
            <button
              onClick={() => setTabAdmin('FLOTA')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
                tabAdmin === 'FLOTA' ? 'bg-[#1E588D] text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              <Truck className="w-4 h-4" /> Flota y Vencimientos ({vehiculos.length})
            </button>
            <button
              onClick={() => setTabAdmin('PRESTADORES')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
                tabAdmin === 'PRESTADORES' ? 'bg-[#1E588D] text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4" /> Prestadores ({prestadores.length})
            </button>
          </div>

          {/* PESTAÑA 1: MONITOREO + FILTROS + RADAR GENERAL DE FLOTA */}
          {tabAdmin === 'TORRE' && (
            <div className="space-y-5">
              <MapaGeneralFlota trasladosActivos={trasladosFiltradosTorre} vehiculos={vehiculos} />

              {/* BARRA DE BUSCADOR Y FILTROS AVANZADOS */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-[#1E588D]" />
                    Filtros Operativos y Búsqueda Rápida ({trasladosFiltradosTorre.length} de {traslados.length} traslados)
                  </span>
                  {(busquedaTorre ||
                    filtroArtTorre !== 'TODAS' ||
                    filtroEstadoTorre !== 'TODOS' ||
                    filtroFechaTorre ||
                    filtroCondicionTorre !== 'TODAS') && (
                    <button
                      type="button"
                      onClick={() => {
                        setBusquedaTorre('');
                        setFiltroArtTorre('TODAS');
                        setFiltroEstadoTorre('TODOS');
                        setFiltroFechaTorre('');
                        setFiltroCondicionTorre('TODAS');
                      }}
                      className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> Limpiar filtros
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={busquedaTorre}
                      onChange={(e) => setBusquedaTorre(e.target.value)}
                      placeholder="Buscar paciente, DNI, siniestro, patente..."
                      className="w-full border border-slate-200 rounded-xl pl-8 pr-3 py-2 bg-slate-50 focus:bg-white outline-none"
                    />
                  </div>

                  <select
                    value={filtroArtTorre}
                    onChange={(e) => setFiltroArtTorre(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 font-medium"
                  >
                    <option value="TODAS">Todas las ART</option>
                    {tarifasArt.map((t) => (
                      <option key={t.nombre_art} value={t.nombre_art}>
                        {t.nombre_art}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filtroEstadoTorre}
                    onChange={(e) => setFiltroEstadoTorre(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 font-medium"
                  >
                    <option value="TODOS">Todos los Estados</option>
                    <option value="EN_CURSO">⚡ Solo Activos / En Curso</option>
                    <option value="ASIGNADO">Asignado</option>
                    <option value="EN_CAMINO_DOMICILIO">En Camino a Domicilio</option>
                    <option value="EN_DOMICILIO">En Puerta / Domicilio</option>
                    <option value="PACIENTE_A_BORDO">Paciente a Bordo</option>
                    <option value="FINALIZADO">Finalizado</option>
                    <option value="ALERTA_DESPERFECTO">Alerta Desperfecto</option>
                  </select>

                  <select
                    value={filtroCondicionTorre}
                    onChange={(e) => setFiltroCondicionTorre(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 font-medium"
                  >
                    <option value="TODAS">Todas las Condiciones</option>
                    <option value="CON_ACOMPANANTE">👥 Con Acompañante</option>
                    <option value="CON_SILLA_RUEDAS">♿ Con Silla de Ruedas / Ortopedia</option>
                    <option value="VEHICULO_ESPECIAL">⚖️ Vehículo Especial / +120-150 kg</option>
                  </select>

                  <div className="flex gap-1.5">
                    <input
                      type="date"
                      value={filtroFechaTorre}
                      onChange={(e) => setFiltroFechaTorre(e.target.value)}
                      className="flex-1 border border-slate-200 rounded-xl px-2.5 py-2 bg-slate-50"
                    />
                    {filtroFechaTorre && (
                      <button
                        type="button"
                        onClick={() => setFiltroFechaTorre('')}
                        className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 font-bold"
                        title="Ver todas las fechas"
                      >
                        Todas
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  {trasladosFiltradosTorre.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
                      <p className="text-sm font-semibold text-slate-700">
                        No hay traslados que coincidan con los filtros seleccionados.
                      </p>
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => {
                            setBusquedaTorre('');
                            setFiltroArtTorre('TODAS');
                            setFiltroEstadoTorre('TODOS');
                            setFiltroFechaTorre('');
                            setFiltroCondicionTorre('TODAS');
                          }}
                          className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                        >
                          Ver Todos
                        </button>
                        <button
                          onClick={() => setTabAdmin('NUEVO_VIAJE')}
                          className="px-4 py-2 bg-[#34B37B] text-white text-xs font-bold rounded-xl"
                        >
                          + Crear Nuevo Traslado ART
                        </button>
                      </div>
                    </div>
                  ) : (
                    trasladosFiltradosTorre.map((t) => {
                      const veh = vehiculos.find((v) => v.id === t.vehiculo_id);
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
                          <div className="flex flex-wrap justify-between items-start gap-2 mb-2.5">
                            <div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1E588D] bg-blue-50 px-2.5 py-0.5 rounded-full">
                                  {t.numero_siniestro}
                                </span>
                                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                                  {t.art_nombre}
                                </span>
                                <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                  <Calendar className="w-3 h-3" /> {t.fecha_programada} • {t.hora_programada || 'S/H'} hs
                                </span>
                              </div>
                              <h3 className="text-base font-bold text-slate-900 mt-1.5">{t.paciente_nombre}</h3>
                              <p className="text-xs text-slate-500">
                                DNI: {t.paciente_dni} • Tel: {t.paciente_telefono} •{' '}
                                <strong>${(t.importe_total || 0).toLocaleString('es-AR')}</strong>
                              </p>
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

                          {/* BADGES DE CONDICIÓN DEL TRASLADO (Acompañante, Silla de Ruedas, Peso 150 kg / Vehículo Especial) */}
                          <div className="mb-3">
                            <BadgesCondicionesTraslado traslado={t} mostrarObservaciones={true} />
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
                                  <strong>{veh?.patente}</strong> • {t.km_reales} km ({t.modalidad_viaje === 'IDA_VUELTA' ? 'Ida y Vuelta' : 'Solo Ida'})
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => abrirModalEdicion(t, e)}
                                className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-[#1E588D] rounded-lg flex items-center gap-1"
                                title="Editar traslado y condiciones"
                              >
                                <Edit3 className="w-3.5 h-3.5" /> Editar
                              </button>
                              <button
                                type="button"
                                onClick={(e) => repetirTrasladoPaciente(t, e)}
                                className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg flex items-center gap-1"
                                title="Clonar / Repetir traslado para este paciente"
                              >
                                <Repeat className="w-3.5 h-3.5" /> Repetir
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  enviarWhatsAppPaciente(t);
                                }}
                                className="px-2.5 py-1.5 text-xs font-bold text-white bg-[#25D366] hover:bg-[#1ebe5d] rounded-lg flex items-center gap-1 shadow-sm"
                              >
                                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  descargarPdfLiquidacion(t);
                                }}
                                className="px-2.5 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg flex items-center gap-1"
                              >
                                <Download className="w-3.5 h-3.5" /> PDF
                              </button>
                              <button
                                type="button"
                                onClick={(e) => eliminarTraslado(t, e)}
                                className="p-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg"
                                title="Eliminar traslado"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* PANEL DERECHO: AUDITORÍA + CONDICIONES + HORAS DE ESPERA + ORDEN MÉDICA */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 h-fit">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#1E588D]" /> Auditoría y Ficha del Viaje
                    </h3>
                    {viajeActivo && (
                      <button
                        type="button"
                        onClick={() => abrirModalEdicion(viajeActivo)}
                        className="text-xs font-bold text-[#1E588D] hover:underline flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Editar
                      </button>
                    )}
                  </div>

                  {viajeActivo ? (
                    <>
                      {/* Ficha rápida de condiciones del paciente */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <div className="text-[11px] font-bold uppercase text-slate-500">
                          Requerimientos del Paciente ({viajeActivo.paciente_nombre})
                        </div>
                        <BadgesCondicionesTraslado traslado={viajeActivo} mostrarObservaciones={true} />
                      </div>

                      {/* Ajuste rápido de KM y Horas de Espera */}
                      <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl space-y-2.5">
                        <div className="text-xs font-bold text-[#1E588D]">Parámetros de Facturación ({viajeActivo.art_nombre})</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500">KM Tramo Base</label>
                            <input
                              type="number"
                              step="0.1"
                              value={viajeActivo.km_reales || 0}
                              onChange={(e) => actualizarEsperaYKm(viajeActivo.id, e.target.value, viajeActivo.horas_espera || 0)}
                              className="w-full border bg-white rounded-lg px-2 py-1 mt-0.5"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500">Horas de Espera</label>
                            <input
                              type="number"
                              step="0.5"
                              value={viajeActivo.horas_espera || 0}
                              onChange={(e) => actualizarEsperaYKm(viajeActivo.id, viajeActivo.km_reales || 0, e.target.value)}
                              className="w-full border bg-white rounded-lg px-2 py-1 mt-0.5"
                            />
                          </div>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-blue-200/60 text-xs">
                          <span className="font-semibold text-slate-600">Total a liquidar:</span>
                          <span className="text-sm font-extrabold text-[#1E588D]">
                            ${(viajeActivo.importe_total || 0).toLocaleString('es-AR')}
                          </span>
                        </div>
                      </div>

                      {viajeActivo.orden_adjunta_url && (
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                            <Paperclip className="w-3.5 h-3.5 text-[#34B37B]" /> Orden Médica ART Adjunta
                          </span>
                          <a
                            href={viajeActivo.orden_adjunta_url}
                            download={`Orden_${viajeActivo.numero_siniestro}`}
                            className="text-xs font-bold text-[#1E588D] hover:underline flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> Descargar
                          </a>
                        </div>
                      )}

                      <div className="space-y-2 border-l-2 border-[#34B37B] pl-3 ml-1">
                        {(viajeActivo.eventos || []).map((ev, i) => (
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
                  ) : (
                    <p className="text-xs text-slate-500">Seleccioná un traslado para ver su auditoría.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA 2: DERIVAR NUEVO TRASLADO (CON CONDICIONES Y RECURRENCIA FKT) */}
          {tabAdmin === 'NUEVO_VIAJE' && (
            <form onSubmit={crearNuevoTraslado} className="bg-white rounded-2xl border border-slate-200 p-6 max-w-3xl space-y-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Emitir Orden de Traslado ART</h3>
                  <p className="text-xs text-slate-500">
                    Completá los datos del paciente, condiciones clínicas (acompañante, silla de ruedas, peso/vehículo especial) y móvil.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Aseguradora / ART</label>
                  <select
                    value={nuevoViaje.art_nombre}
                    onChange={(e) => setNuevoViaje({ ...nuevoViaje, art_nombre: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 text-sm bg-white"
                  >
                    {tarifasArt.map((t) => (
                      <option key={t.nombre_art} value={t.nombre_art}>
                        {t.nombre_art} (${t.valor_km}/km)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Modalidad del Servicio</label>
                  <select
                    value={nuevoViaje.modalidad_viaje}
                    onChange={(e) => setNuevoViaje({ ...nuevoViaje, modalidad_viaje: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 text-sm bg-white"
                  >
                    <option value="IDA_VUELTA">Ida y Vuelta (Con regreso a domicilio)</option>
                    <option value="SOLO_IDA">Solo Ida (Tramo único)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha Programada</label>
                  <input
                    type="date"
                    required
                    value={nuevoViaje.fecha_programada}
                    onChange={(e) => setNuevoViaje({ ...nuevoViaje, fecha_programada: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Hora de Retiro</label>
                  <input
                    type="time"
                    required
                    value={nuevoViaje.hora_programada}
                    onChange={(e) => setNuevoViaje({ ...nuevoViaje, hora_programada: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 text-sm"
                  />
                </div>

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

                {/* BLOQUE DE CONDICIONES DEL TRASLADO (Acompañante, Silla de Ruedas, Peso 150 kg / Vehículo Especial) */}
                <FormularioCondicionesTraslado state={nuevoViaje} onChange={setNuevoViaje} />

                {/* Domicilio con Geocodificación real */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-semibold text-slate-600">Domicilio de Retiro (San Rafael)</label>
                  <div className="flex gap-2">
                    <input
                      required
                      value={nuevoViaje.origen_direccion}
                      onChange={(e) => setNuevoViaje({ ...nuevoViaje, origen_direccion: e.target.value })}
                      className="flex-1 border rounded-xl px-3 py-2 text-sm"
                      placeholder="Ej: Av. Balloffet 1120"
                    />
                    <button
                      type="button"
                      onClick={ubicarDomicilioEnMapa}
                      disabled={buscandoGeo}
                      className="px-3 py-2 bg-slate-100 hover:bg-blue-50 text-[#1E588D] border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0"
                    >
                      <Search className="w-3.5 h-3.5" /> {buscandoGeo ? 'Buscando...' : 'Ubicar GPS'}
                    </button>
                  </div>
                </div>

                {/* Centro Médico + Alta Dinámica */}
                <div className="sm:col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-600">Centro Médico de Destino</label>
                    <button
                      type="button"
                      onClick={() => setMostrarFormCentro(!mostrarFormCentro)}
                      className="text-xs font-bold text-[#1E588D] hover:text-[#34B37B] flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> {mostrarFormCentro ? 'Cerrar alta de centro' : 'Agregar nuevo centro médico'}
                    </button>
                  </div>

                  <select
                    value={nuevoViaje.destino_nombre}
                    onChange={(e) => {
                      const seleccionado = centrosMedicos.find(
                        (cm) => (cm.direccion ? `${cm.nombre} (${cm.direccion})` : cm.nombre) === e.target.value
                      );
                      setNuevoViaje({
                        ...nuevoViaje,
                        destino_nombre: e.target.value,
                        destino_lat: seleccionado?.lat || -34.6148,
                        destino_lng: seleccionado?.lng || -68.3265,
                      });
                    }}
                    className="w-full border rounded-xl px-3 py-2 text-sm bg-white"
                  >
                    {centrosMedicos.map((cm) => {
                      const label = cm.direccion ? `${cm.nombre} (${cm.direccion})` : cm.nombre;
                      return (
                        <option key={cm.id} value={label}>
                          {label}
                        </option>
                      );
                    })}
                  </select>

                  {mostrarFormCentro && (
                    <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2.5">
                      <div className="text-xs font-bold text-[#1E588D]">Nuevo Centro Médico / Clínica</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={nuevoCentro.nombre}
                          onChange={(e) => setNuevoCentro({ ...nuevoCentro, nombre: e.target.value })}
                          placeholder="Nombre (ej: Clínica Ciudad)"
                          className="border border-slate-300 bg-white rounded-lg px-2.5 py-1.5 text-xs"
                        />
                        <input
                          type="text"
                          value={nuevoCentro.direccion}
                          onChange={(e) => setNuevoCentro({ ...nuevoCentro, direccion: e.target.value })}
                          placeholder="Dirección (ej: Av. San Martín 340)"
                          className="border border-slate-300 bg-white rounded-lg px-2.5 py-1.5 text-xs"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={guardarNuevoCentroMedico}
                          className="px-3 py-1.5 bg-[#1E588D] text-white font-semibold rounded-lg text-xs flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Guardar y Seleccionar Centro
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Programación Recurrente (Sesiones FKT / Rehabilitación) */}
                <div className="sm:col-span-2 p-3.5 rounded-xl bg-blue-50/50 border border-blue-200 space-y-2.5">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-bold text-[#1E588D] flex items-center gap-1.5">
                      <Repeat className="w-4 h-4 text-[#34B37B]" />
                      ¿Programar múltiples sesiones recurrentes (Rehabilitación / FKT)?
                    </span>
                    <input
                      type="checkbox"
                      checked={esRecurrente}
                      onChange={(e) => setEsRecurrente(e.target.checked)}
                      className="w-4 h-4 accent-[#1E588D] rounded"
                    />
                  </label>
                  {esRecurrente && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Cantidad de Sesiones a Generar</label>
                        <input
                          type="number"
                          min="2"
                          max="20"
                          value={cantidadSesiones}
                          onChange={(e) => setCantidadSesiones(e.target.value)}
                          className="w-full border border-blue-200 rounded-lg px-2.5 py-1.5 bg-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Días de Cursado / Frecuencia</label>
                        <select
                          value={frecuenciaSesiones}
                          onChange={(e) => setFrecuenciaSesiones(e.target.value)}
                          className="w-full border border-blue-200 rounded-lg px-2.5 py-1.5 bg-white font-medium"
                        >
                          <option value="LUN_MIE_VIE">Lunes, Miércoles y Viernes</option>
                          <option value="MAR_JUE">Martes y Jueves</option>
                          <option value="DIARIO_HABIL">Todos los días hábiles (Lun a Vie)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Adjuntar Orden Médica / Autorización ART */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Orden Médica / Autorización ART (Opcional — Foto o PDF)
                  </label>
                  <label className="cursor-pointer flex items-center justify-between border border-dashed border-slate-300 rounded-xl px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-xs">
                    <span className="font-medium text-slate-700 flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-[#1E588D]" />
                      {nuevoViaje.orden_adjunta_url ? '✓ Orden médica adjuntada correctamente' : 'Seleccionar archivo de derivación...'}
                    </span>
                    <span className="text-[#1E588D] font-bold">Subir</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) =>
                        leerArchivoBase64(e.target.files?.[0], (url) =>
                          setNuevoViaje((prev) => ({ ...prev, orden_adjunta_url: url }))
                        )
                      }
                    />
                  </label>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Asignar Móvil Habilitado{' '}
                    {(nuevoViaje.requiere_vehiculo_especial || nuevoViaje.lleva_silla_ruedas) && (
                      <span className="text-rose-600 font-bold ml-1">
                        (Requiere unidad apta para {nuevoViaje.lleva_silla_ruedas ? 'Silla de Ruedas ' : ''}
                        {nuevoViaje.requiere_vehiculo_especial ? 'Peso / Vehículo Especial' : ''})
                      </span>
                    )}
                  </label>
                  <select
                    value={nuevoViaje.vehiculo_id}
                    onChange={(e) => {
                      const v = vehiculos.find((item) => item.id === e.target.value);
                      setNuevoViaje({ ...nuevoViaje, vehiculo_id: e.target.value, prestador_id: v?.prestador_id || nuevoViaje.prestador_id });
                    }}
                    className="w-full border rounded-xl px-3 py-2 text-sm bg-white"
                  >
                    {vehiculos.map((v) => {
                      const bloqueado = vehiculoEstaBloqueado(v);
                      const tagCapacidad =
                        v.tipo_movilidad === 'AMPLIO_150KG_SILLA' || v.tipo_movilidad === 'UTILITARIO_ADAPTADO'
                          ? '★ Apto Silla Ruedas / +150kg'
                          : 'Estándar';
                      return (
                        <option key={v.id} value={v.id} disabled={bloqueado}>
                          {bloqueado ? '⛔ BLOQUEADO — ' : '✅ HABILITADO — '}
                          {v.patente} | {v.modelo} ({tagCapacidad}) | Chofer: {v.chofer_nombre}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <button type="submit" className="px-5 py-2.5 bg-[#34B37B] hover:bg-[#2a9666] text-white font-bold rounded-xl text-sm shadow">
                {esRecurrente
                  ? `Confirmar y Generar ${cantidadSesiones} Traslados Recurrentes`
                  : 'Confirmar y Guardar Traslado en Base de Datos'}
              </button>
            </form>
          )}

          {/* PESTAÑA 3: HISTORIAL CLÍNICO Y OPERATIVO POR PACIENTE */}
          {tabAdmin === 'HISTORIAL' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <History className="w-4 h-4 text-[#1E588D]" />
                    Historial Consolidado por Paciente ART
                  </h3>
                  <p className="text-xs text-slate-500">
                    Consultá todos los viajes realizados por cada paciente, sus condiciones de traslado habituales y repetí una orden en 1 clic.
                  </p>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={busquedaHistorial}
                    onChange={(e) => setBusquedaHistorial(e.target.value)}
                    placeholder="Buscar paciente por nombre, DNI o ART..."
                    className="w-full border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs bg-slate-50 focus:bg-white outline-none"
                  />
                </div>
              </div>

              {historialPacientes.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
                  No se encontraron pacientes registrados en el historial.
                </div>
              ) : (
                <div className="space-y-3">
                  {historialPacientes.map((p) => {
                    const abierto = pacienteHistorialExpandido === p.clave;
                    return (
                      <div key={p.clave} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="p-4 flex flex-wrap items-center justify-between gap-4">
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-extrabold text-slate-900">{p.paciente_nombre}</span>
                              <span className="text-xs font-semibold text-slate-500">DNI: {p.paciente_dni}</span>
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                                {p.art_nombre}
                              </span>
                              <span className="text-[11px] font-bold text-[#1E588D] bg-blue-50 px-2.5 py-0.5 rounded-full">
                                {p.ultimo_siniestro}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500">
                              Domicilio habitual: <strong>{p.origen_direccion}</strong> • Tel: {p.paciente_telefono}
                            </div>
                            <BadgesCondicionesTraslado traslado={p.ultimo_traslado} mostrarObservaciones={true} />
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <div className="text-right bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                              <div className="text-[10px] font-bold uppercase text-slate-400">
                                {p.viajes.length} traslados • {p.total_km} km
                              </div>
                              <div className="text-sm font-extrabold text-[#1E588D]">
                                ${p.total_importe.toLocaleString('es-AR')}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => repetirTrasladoPaciente(p.ultimo_traslado)}
                              className="px-3 py-2 bg-[#34B37B] hover:bg-[#2a9666] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
                            >
                              <Repeat className="w-3.5 h-3.5" /> Nuevo Viaje
                            </button>
                            <button
                              type="button"
                              onClick={() => setPacienteHistorialExpandido(abierto ? null : p.clave)}
                              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                            >
                              {abierto ? 'Ocultar Viajes' : `Ver Historial (${p.viajes.length})`}
                            </button>
                          </div>
                        </div>

                        {abierto && (
                          <div className="border-t border-slate-100 bg-slate-50/70 p-4 overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                                  <th className="py-2 px-2">Fecha / Hora</th>
                                  <th className="py-2 px-2">Siniestro</th>
                                  <th className="py-2 px-2">Destino</th>
                                  <th className="py-2 px-2">Condición del Traslado</th>
                                  <th className="py-2 px-2">Estado</th>
                                  <th className="py-2 px-2 text-right">Importe</th>
                                  <th className="py-2 px-2 text-right">Acciones</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200/60">
                                {p.viajes.map((v) => (
                                  <tr key={v.id} className="hover:bg-white">
                                    <td className="py-2 px-2 font-semibold">
                                      {v.fecha_programada} • {v.hora_programada || ''} hs
                                    </td>
                                    <td className="py-2 px-2">{v.numero_siniestro}</td>
                                    <td className="py-2 px-2">{v.destino_nombre}</td>
                                    <td className="py-2 px-2 text-[11px] text-slate-600">{resumirCondicionesTexto(v)}</td>
                                    <td className="py-2 px-2 font-bold text-[#1E588D]">{v.estado}</td>
                                    <td className="py-2 px-2 text-right font-bold">
                                      ${(v.importe_total || 0).toLocaleString('es-AR')}
                                    </td>
                                    <td className="py-2 px-2 text-right space-x-1">
                                      <button
                                        type="button"
                                        onClick={() => abrirModalEdicion(v)}
                                        className="px-2 py-1 bg-white border rounded text-[11px] font-semibold text-slate-700 hover:text-[#1E588D]"
                                      >
                                        Editar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => descargarPdfLiquidacion(v)}
                                        className="px-2 py-1 bg-slate-800 text-white rounded text-[11px] font-semibold"
                                      >
                                        PDF
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* PESTAÑA 4: LIQUIDACIÓN Y TARIFAS POR ART */}
          {tabAdmin === 'LIQUIDACION' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <h3 className="font-bold text-sm text-slate-900">Cuadro Tarifario Vigente por Aseguradora (ART)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {tarifasArt.map((tar) => (
                    <div key={tar.nombre_art} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                      <div className="font-bold text-[#1E588D]">{tar.nombre_art}</div>
                      <div>
                        <label className="text-[10px] text-slate-500">Valor KM ($)</label>
                        <input
                          type="number"
                          value={tar.valor_km}
                          onChange={async (e) => {
                            const val = Number(e.target.value);
                            setTarifasArt((prev) =>
                              prev.map((item) => (item.nombre_art === tar.nombre_art ? { ...item, valor_km: val } : item))
                            );
                            await supabase.from('tarifas_art').update({ valor_km: val }).eq('nombre_art', tar.nombre_art);
                          }}
                          className="w-full border bg-white rounded-lg px-2 py-1 font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500">Hora Espera ($)</label>
                        <input
                          type="number"
                          value={tar.valor_hora_espera}
                          onChange={async (e) => {
                            const val = Number(e.target.value);
                            setTarifasArt((prev) =>
                              prev.map((item) =>
                                item.nombre_art === tar.nombre_art ? { ...item, valor_hora_espera: val } : item
                              )
                            );
                            await supabase
                              .from('tarifas_art')
                              .update({ valor_hora_espera: val })
                              .eq('nombre_art', tar.nombre_art);
                          }}
                          className="w-full border bg-white rounded-lg px-2 py-1 font-semibold"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-sm text-slate-900">Planilla de Facturación Mensual</h3>
                    <select
                      value={filtroArtLiquidacion}
                      onChange={(e) => setFiltroArtLiquidacion(e.target.value)}
                      className="border rounded-xl px-3 py-1.5 text-xs font-semibold bg-slate-50"
                    >
                      <option value="TODAS">Todas las ART ({traslados.length})</option>
                      {tarifasArt.map((t) => (
                        <option key={t.nombre_art} value={t.nombre_art}>
                          {t.nombre_art}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Total a Facturar</div>
                      <div className="text-lg font-extrabold text-[#34B37B]">
                        ${totalFacturarFiltrado.toLocaleString('es-AR')}
                      </div>
                    </div>
                    <button
                      onClick={exportarExcelLiquidacion}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
                    >
                      <FileSpreadsheet className="w-4 h-4" /> Exportar Excel (.CSV)
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                        <th className="py-2.5 px-2">Fecha</th>
                        <th className="py-2.5 px-2">ART</th>
                        <th className="py-2.5 px-2">Siniestro / Paciente</th>
                        <th className="py-2.5 px-2">Condiciones Especiales</th>
                        <th className="py-2.5 px-2">Modalidad</th>
                        <th className="py-2.5 px-2">KM / Espera</th>
                        <th className="py-2.5 px-2">Estado</th>
                        <th className="py-2.5 px-2 text-right">Importe ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {trasladosLiquidacion.map((t) => {
                        const kmFact = t.modalidad_viaje === 'IDA_VUELTA' ? (t.km_reales || 0) * 2 : t.km_reales || 0;
                        return (
                          <tr key={t.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-2">{t.fecha_programada}</td>
                            <td className="py-2.5 px-2 font-semibold text-[#1E588D]">{t.art_nombre}</td>
                            <td className="py-2.5 px-2">
                              <div className="font-bold text-slate-800">{t.paciente_nombre}</div>
                              <div className="text-[11px] text-slate-500">{t.numero_siniestro}</div>
                            </td>
                            <td className="py-2.5 px-2">
                              <BadgesCondicionesTraslado traslado={t} />
                            </td>
                            <td className="py-2.5 px-2">{t.modalidad_viaje === 'IDA_VUELTA' ? 'Ida y Vuelta' : 'Solo Ida'}</td>
                            <td className="py-2.5 px-2">
                              {kmFact} km • {t.horas_espera || 0} hs
                            </td>
                            <td className="py-2.5 px-2">{t.estado}</td>
                            <td className="py-2.5 px-2 text-right font-bold text-slate-900">
                              ${(t.importe_total || 0).toLocaleString('es-AR')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA 5: FLOTA Y VENCIMIENTOS */}
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
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-blue-50 text-[#1E588D] text-[10px] font-bold">
                          Categoría: {v.tipo_movilidad === 'AMPLIO_150KG_SILLA' ? 'Amplio (+150 kg / Silla de Ruedas)' : v.tipo_movilidad === 'UTILITARIO_ADAPTADO' ? 'Utilitario / Rampa Especial' : 'Ambulatorio Estándar'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={v.chofer_foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face'}
                            alt={v.chofer_nombre}
                            className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div className="text-xs">
                            <div className="font-bold text-slate-800">{v.chofer_nombre}</div>
                            <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-semibold mt-0.5 ${evalLic.badge}`}>
                              Licencia: {v.licencia_venc} ({evalLic.estado})
                            </span>
                          </div>
                        </div>

                        <label className="cursor-pointer p-2 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-[#1E588D] rounded-lg transition" title="Cambiar foto">
                          <Camera className="w-4 h-4" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              leerArchivoBase64(e.target.files?.[0], async (nuevaFotoUrl) => {
                                setVehiculos((prev) =>
                                  prev.map((item) => (item.id === v.id ? { ...item, chofer_foto: nuevaFotoUrl } : item))
                                );
                                await supabase.from('vehiculos').update({ chofer_foto: nuevaFotoUrl }).eq('id', v.id);
                              });
                            }}
                          />
                        </label>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        {(v.docs || []).map((d, idx) => {
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

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const payload = {
                    prestador_id: nuevoVehiculo.prestador_id,
                    patente: nuevoVehiculo.patente.toUpperCase(),
                    modelo: nuevoVehiculo.modelo,
                    tipo_movilidad: nuevoVehiculo.tipo_movilidad,
                    chofer_nombre: nuevoVehiculo.chofer_nombre,
                    chofer_foto:
                      nuevoVehiculo.chofer_foto ||
                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
                    licencia_venc: nuevoVehiculo.licencia_venc,
                    docs: [
                      { tipo: 'RTO', vencimiento: nuevoVehiculo.rto_venc },
                      { tipo: 'SEGURO', vencimiento: nuevoVehiculo.seguro_venc },
                      { tipo: 'HABILITACION_TRANSPORTE', vencimiento: nuevoVehiculo.hab_venc },
                      { tipo: 'MATAFUEGOS', vencimiento: nuevoVehiculo.matafuegos_venc },
                    ],
                  };
                  const { data, error } = await supabase.from('vehiculos').insert([payload]).select().single();
                  if (error) {
                    alert('Error guardando unidad: ' + error.message);
                    return;
                  }
                  setVehiculos([...vehiculos, data]);
                  setNuevoVehiculo({ ...nuevoVehiculo, patente: '', modelo: '', chofer_nombre: '', chofer_foto: '' });
                }}
                className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4"
              >
                <h4 className="font-bold text-sm text-slate-900">Registrar Nuevo Móvil, Capacidad Especial y Vencimientos Legales</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <select value={nuevoVehiculo.prestador_id} onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, prestador_id: e.target.value })} className="border rounded-xl px-3 py-2">
                    {prestadores.map((p) => <option key={p.id} value={p.id}>{p.razon_social}</option>)}
                  </select>
                  <input required placeholder="Patente (ej: AG 123 ZZ)" value={nuevoVehiculo.patente} onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, patente: e.target.value })} className="border rounded-xl px-3 py-2" />
                  <input required placeholder="Modelo vehículo" value={nuevoVehiculo.modelo} onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, modelo: e.target.value })} className="border rounded-xl px-3 py-2" />
                  <input required placeholder="Nombre del Chofer" value={nuevoVehiculo.chofer_nombre} onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, chofer_nombre: e.target.value })} className="border rounded-xl px-3 py-2" />

                  <select
                    value={nuevoVehiculo.tipo_movilidad}
                    onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, tipo_movilidad: e.target.value })}
                    className="border rounded-xl px-3 py-2 bg-white font-semibold text-[#1E588D]"
                  >
                    <option value="AMPLIO_150KG_SILLA">Sedán Amplio (Apto +150 kg y Silla en Baúl)</option>
                    <option value="UTILITARIO_ADAPTADO">Utilitario / SUV Adaptado (Silla Ruedas / Rampa)</option>
                    <option value="AMBULATORIO">Ambulatorio Estándar</option>
                  </select>

                  <div className="flex items-center gap-3 border rounded-xl px-3 py-1.5 bg-slate-50">
                    {nuevoVehiculo.chofer_foto ? (
                      <img src={nuevoVehiculo.chofer_foto} alt="Vista previa" className="w-8 h-8 rounded-full object-cover border" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                        <Camera className="w-4 h-4" />
                      </div>
                    )}
                    <label className="cursor-pointer text-xs font-semibold text-[#1E588D] hover:underline flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" />
                      {nuevoVehiculo.chofer_foto ? 'Foto cargada (Cambiar)' : 'Subir foto del chofer'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          leerArchivoBase64(e.target.files?.[0], (url) =>
                            setNuevoVehiculo((prev) => ({ ...prev, chofer_foto: url }))
                          )
                        }
                      />
                    </label>
                  </div>

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
                  Guardar Unidad en Supabase
                </button>
              </form>
            </div>
          )}

          {/* PESTAÑA 6: PRESTADORES */}
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
                onSubmit={async (e) => {
                  e.preventDefault();
                  const { data, error } = await supabase
                    .from('prestadores')
                    .insert([{ ...nuevoPrestador, habilitado_operar: true }])
                    .select()
                    .single();
                  if (error) {
                    alert('Error guardando prestador: ' + error.message);
                    return;
                  }
                  setPrestadores([...prestadores, data]);
                  setNuevoPrestador({ razon_social: '', cuit: '', zona_cobertura: 'San Rafael, Mendoza', telefono_guardia: '' });
                }}
                className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3"
              >
                <h4 className="font-bold text-sm text-slate-900">Dar de Alta Nuevo Prestador</h4>
                <input required placeholder="Razón Social" value={nuevoPrestador.razon_social} onChange={(e) => setNuevoPrestador({ ...nuevoPrestador, razon_social: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-xs" />
                <input required placeholder="CUIT" value={nuevoPrestador.cuit} onChange={(e) => setNuevoPrestador({ ...nuevoPrestador, cuit: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-xs" />
                <input required placeholder="Zona de Cobertura" value={nuevoPrestador.zona_cobertura} onChange={(e) => setNuevoPrestador({ ...nuevoPrestador, zona_cobertura: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-xs" />
                <input required placeholder="Teléfono de Guardia" value={nuevoPrestador.telefono_guardia} onChange={(e) => setNuevoPrestador({ ...nuevoPrestador, telefono_guardia: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-xs" />
                <button type="submit" className="px-4 py-2 bg-[#34B37B] text-white font-bold rounded-xl text-xs">
                  Homologar Prestador en Supabase
                </button>
              </form>
            </div>
          )}
        </main>
      )}

      {/* ==================================================================== */}
      {/* MODAL DE EDICIÓN COMPLETA DE TRASLADO Y CONDICIONES                  */}
      {/* ==================================================================== */}
      {trasladoEditando && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 my-8 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-[#1E588D]" /> Editar Traslado y Condiciones Clínicas
                </h3>
                <p className="text-xs text-slate-500">
                  Siniestro: {trasladoEditando.numero_siniestro} • Paciente: {trasladoEditando.paciente_nombre}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTrasladoEditando(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={guardarEdicionTraslado} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Aseguradora / ART</label>
                  <select
                    value={trasladoEditando.art_nombre}
                    onChange={(e) => setTrasladoEditando({ ...trasladoEditando, art_nombre: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 bg-white"
                  >
                    {tarifasArt.map((t) => (
                      <option key={t.nombre_art} value={t.nombre_art}>
                        {t.nombre_art}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Estado del Traslado</label>
                  <select
                    value={trasladoEditando.estado}
                    onChange={(e) => setTrasladoEditando({ ...trasladoEditando, estado: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 bg-white font-bold text-[#1E588D]"
                  >
                    <option value="ASIGNADO">ASIGNADO</option>
                    <option value="EN_CAMINO_DOMICILIO">EN CAMINO A DOMICILIO</option>
                    <option value="EN_DOMICILIO">EN DOMICILIO</option>
                    <option value="PACIENTE_A_BORDO">PACIENTE A BORDO</option>
                    <option value="FINALIZADO">FINALIZADO</option>
                    <option value="ALERTA_DESPERFECTO">ALERTA DESPERFECTO</option>
                    <option value="CANCELADO">CANCELADO</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Paciente</label>
                  <input
                    required
                    value={trasladoEditando.paciente_nombre}
                    onChange={(e) => setTrasladoEditando({ ...trasladoEditando, paciente_nombre: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">DNI</label>
                  <input
                    required
                    value={trasladoEditando.paciente_dni}
                    onChange={(e) => setTrasladoEditando({ ...trasladoEditando, paciente_dni: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">N° Siniestro</label>
                  <input
                    required
                    value={trasladoEditando.numero_siniestro}
                    onChange={(e) => setTrasladoEditando({ ...trasladoEditando, numero_siniestro: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Teléfono WhatsApp</label>
                  <input
                    required
                    value={trasladoEditando.paciente_telefono}
                    onChange={(e) => setTrasladoEditando({ ...trasladoEditando, paciente_telefono: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Fecha Programada</label>
                  <input
                    type="date"
                    value={trasladoEditando.fecha_programada}
                    onChange={(e) => setTrasladoEditando({ ...trasladoEditando, fecha_programada: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Hora Programada</label>
                  <input
                    type="time"
                    value={trasladoEditando.hora_programada || '11:30'}
                    onChange={(e) => setTrasladoEditando({ ...trasladoEditando, hora_programada: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Domicilio Origen</label>
                  <input
                    required
                    value={trasladoEditando.origen_direccion}
                    onChange={(e) => setTrasladoEditando({ ...trasladoEditando, origen_direccion: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Centro Médico Destino</label>
                  <input
                    required
                    value={trasladoEditando.destino_nombre}
                    onChange={(e) => setTrasladoEditando({ ...trasladoEditando, destino_nombre: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Modalidad</label>
                  <select
                    value={trasladoEditando.modalidad_viaje}
                    onChange={(e) => setTrasladoEditando({ ...trasladoEditando, modalidad_viaje: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 bg-white"
                  >
                    <option value="IDA_VUELTA">Ida y Vuelta</option>
                    <option value="SOLO_IDA">Solo Ida</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Móvil Asignado</label>
                  <select
                    value={trasladoEditando.vehiculo_id}
                    onChange={(e) => {
                      const v = vehiculos.find((item) => item.id === e.target.value);
                      setTrasladoEditando({
                        ...trasladoEditando,
                        vehiculo_id: e.target.value,
                        prestador_id: v?.prestador_id || trasladoEditando.prestador_id,
                      });
                    }}
                    className="w-full border rounded-xl px-3 py-2 bg-white"
                  >
                    {vehiculos.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.patente} — {v.modelo} ({v.chofer_nombre})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Condiciones Clínicas en Modal de Edición */}
                <FormularioCondicionesTraslado state={trasladoEditando} onChange={setTrasladoEditando} />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setTrasladoEditando(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#1E588D] hover:bg-[#16436b] rounded-xl flex items-center gap-1.5 shadow"
                >
                  <Check className="w-4 h-4" /> Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VISTA 2: TERMINAL MÓVIL DEL CHOFER                                   */}
      {/* ==================================================================== */}
      {rolActivo === 'CHOFER' && (
        <main className="max-w-xl w-full mx-auto px-4 py-6 space-y-5">
          {!viajeActivo ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-600">
              No hay traslados activos asignados en este momento.
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <img src={vehiculoAsignado?.chofer_foto} alt="Chofer" className="w-12 h-12 rounded-full object-cover border-2 border-[#34B37B]" />
                  <div>
                    <h2 className="font-bold text-sm text-slate-900">{vehiculoAsignado?.chofer_nombre}</h2>
                    <p className="text-xs text-slate-500">{vehiculoAsignado?.modelo} • <strong>{vehiculoAsignado?.patente}</strong></p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={activarGpsRealDispositivo}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 border ${
                      gpsRealActivo ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <Navigation className="w-3.5 h-3.5" /> {gpsRealActivo ? 'GPS Vivo' : 'Usar GPS'}
                  </button>
                  <button
                    onClick={() => setModalDesperfecto(true)}
                    className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <Wrench className="w-4 h-4" /> Falla
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-bold text-[#1E588D] bg-blue-50 px-2.5 py-0.5 rounded-full">
                      {viajeActivo.numero_siniestro} • {viajeActivo.art_nombre}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">{viajeActivo.paciente_nombre}</h3>
                    <p className="text-xs text-slate-500">DNI: {viajeActivo.paciente_dni}</p>
                  </div>
                  <a href={`tel:${viajeActivo.paciente_telefono}`} className="p-2.5 bg-emerald-50 text-[#34B37B] rounded-full">
                    <Phone className="w-5 h-5" />
                  </a>
                </div>

                {/* ALERTA DE CONDICIONES ESPECIALES PARA EL CHOFER */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="text-[11px] font-extrabold uppercase text-[#1E588D] flex items-center gap-1.5">
                    <Accessibility className="w-4 h-4 text-[#34B37B]" />
                    Condiciones del Traslado a Preparar en el Móvil:
                  </div>
                  <BadgesCondicionesTraslado traslado={viajeActivo} mostrarObservaciones={true} />
                </div>

                <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl text-xs">
                  <div><strong>Retirar en:</strong> {viajeActivo.origen_direccion}</div>
                  <div><strong>Llevar a:</strong> {viajeActivo.destino_nombre}</div>
                  <div><strong>Modalidad:</strong> {viajeActivo.modalidad_viaje === 'IDA_VUELTA' ? 'Ida y Vuelta' : 'Solo Ida'} ({viajeActivo.km_reales} km base)</div>
                </div>

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
                    3. Paciente a Bordo — Iniciar Traslado
                  </button>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Firma Digital del Paciente al Finalizar:
                  </label>
                  <SignaturePad
                    disabled={viajeActivo.estado === 'FINALIZADO'}
                    onSave={(dataUrl) => cambiarEstadoViaje(viajeActivo.id, 'FINALIZADO', { firma_url: dataUrl })}
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                <h4 className="font-bold text-xs text-slate-700 uppercase">Chat Directo con el Paciente</h4>
                <div className="max-h-40 overflow-y-auto space-y-2 bg-slate-50 p-3 rounded-xl">
                  {(viajeActivo.chat_mensajes || []).map((m) => (
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
            </>
          )}

          {modalDesperfecto && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
                <div className="flex items-center gap-2 text-red-600 font-bold text-base">
                  <AlertTriangle className="w-6 h-6" /> Reportar Desperfecto Mecánico
                </div>
                <textarea
                  rows={3}
                  value={textoFalla}
                  onChange={(e) => setTextoFalla(e.target.value)}
                  placeholder="Describí la falla..."
                  className="w-full border rounded-xl p-3 text-xs"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setModalDesperfecto(false)} className="px-4 py-2 text-xs font-semibold text-slate-600">Cancelar</button>
                  <button onClick={enviarReporteDesperfecto} className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl text-xs">
                    Enviar Alerta Urgente
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      )}

      {/* ==================================================================== */}
      {/* VISTA 3: PORTAL SEGURO DEL PACIENTE CON MAPA GPS INTERACTIVO         */}
      {/* ==================================================================== */}
      {rolActivo === 'PACIENTE' && (
        <main className="max-w-lg w-full mx-auto px-4 py-6 space-y-5">
          {!viajeActivo ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-600">
              No se encontró un traslado activo asociado a este enlace.
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-[#1E588D] to-[#268786] p-5 text-white">
                  <div className="flex justify-between items-center text-xs opacity-90 mb-1">
                    <span>Traslado Autorizado {viajeActivo.art_nombre}</span>
                    <span>{viajeActivo.numero_siniestro}</span>
                  </div>
                  <h2 className="text-lg font-bold">Hola, {viajeActivo.paciente_nombre}</h2>
                  <p className="text-xs text-blue-100 mt-0.5">Estado actual: <strong>{viajeActivo.estado.replace(/_/g, ' ')}</strong></p>

                  <div className="mt-4 bg-white/20 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-[#34B37B] h-full transition-all duration-700"
                      style={{ width: `${viajeActivo.gps_progreso || 15}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] mt-1.5 text-blue-100">
                    <span>Tu Domicilio</span>
                    <span>Móvil al {viajeActivo.gps_progreso || 15}%</span>
                    <span>Clínica Destino</span>
                  </div>
                </div>

                <div className="p-4 pb-0">
                  <MapaSeguimientoGps
                    progreso={viajeActivo.gps_progreso || 15}
                    origenTexto={viajeActivo.origen_direccion}
                    destinoTexto={viajeActivo.destino_nombre}
                    origenCoordsProp={{ lat: viajeActivo.origen_lat, lng: viajeActivo.origen_lng }}
                    destinoCoordsProp={{ lat: viajeActivo.destino_lat, lng: viajeActivo.destino_lng }}
                    patente={vehiculoAsignado?.patente}
                    choferNombre={vehiculoAsignado?.chofer_nombre}
                    coordsReales={viajeActivo.coords_reales}
                  />
                </div>

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

                  <div className="bg-slate-50 p-3.5 rounded-xl text-xs space-y-2 text-slate-700">
                    <div><strong>Punto de retiro:</strong> {viajeActivo.origen_direccion}</div>
                    <div><strong>Destino médico:</strong> {viajeActivo.destino_nombre}</div>
                    <div className="pt-1.5 border-t border-slate-200">
                      <div className="text-[11px] font-bold text-slate-500 mb-1">Condiciones Autorizadas para tu Viaje:</div>
                      <BadgesCondicionesTraslado traslado={viajeActivo} mostrarObservaciones={true} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                <h4 className="font-bold text-xs text-slate-700 uppercase">Chat con tu Chofer</h4>
                <div className="max-h-40 overflow-y-auto space-y-2 bg-slate-50 p-3 rounded-xl">
                  {(viajeActivo.chat_mensajes || []).map((m) => (
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
            </>
          )}
        </main>
      )}
    </div>
  );
}
