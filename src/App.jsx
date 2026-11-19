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
  History, Repeat, Calendar, X, Check, Info, Copy, Compass
} from 'lucide-react';
// Formateador de moneda con soporte exacto para centavos ($5.630,04 / $11.260,08 / $656,85)
const formatearMoneda = (valor) => {
  const num = Number(valor || 0);
  const tieneCentavos = Math.abs(num - Math.round(num)) > 0.001;
  return num.toLocaleString('es-AR', {
    minimumFractionDigits: tieneCentavos ? 2 : 0,
    maximumFractionDigits: 2,
  });
};
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
// CATÁLOGOS DE CONDICIONES CLÍNICAS, VEHÍCULOS Y REGLAS DE LIQUIDACIÓN ART
// ============================================================================
const CONDICIONES_PACIENTE_LABELS = {
  AMBULATORIO: 'Ambulatorio (Camina por sus medios)',
  MOVILIDAD_REDUCIDA: 'Movilidad Reducida (Muletas / Asistencia)',
  SILLA_DE_RUEDAS: 'En Silla de Ruedas',
  BARIATRICO_PESO_ESPECIAL: 'Bariátrico / Peso Especial (+120-150 kg)',
  POST_QUIRURGICO: 'Post-Quirúrgico / Férula o Yeso',
};
const ELEMENTOS_ORTOPEDICOS_LABELS = {
  NINGUNO: 'Ninguno',
  MULETAS_ANDADOR: 'Muletas / Andador / Bastón',
  SILLA_RUEDAS_PLEGABLE: 'Silla de Ruedas Plegable (Baúl)',
  SILLA_RUEDAS_RIGIDA: 'Silla de Ruedas Ortopédica / Rígida',
  FERULA_PIERNA_EXTENDIDA: 'Férula / Yeso (Pierna extendida atrás)',
};
const TIPOS_VEHICULO_ESPECIAL_LABELS = {
  ESTANDAR: 'Sedán Estándar',
  VEHICULO_AMPLIO_150KG: 'Vehículo Amplio / Reforzado (Paciente +120/150 kg)',
  BAUL_GRANDE_SILLA_RUEDAS: 'Sedán Baúl Grande / Rural (Silla de Ruedas)',
  UTILITARIO_RAMPA_ACCESO_BAJO: 'Utilitario / SUV Acceso Cómodo',
  ASIENTO_TRASERO_LIBRE_FKT: 'Habitáculo Trasero Despejado (Inmovilización)',
};
const ESQUEMAS_LIQUIDACION_LABELS = {
  TRAMO_1_URBANO: 'Radio Céntrico — Tramo 1 Solo Ida ($5.630,04)',
  TRAMO_2_URBANO: 'Radio Céntrico — Ida y Vuelta Tramo 1 + 2 ($11.260,08)',
  KM_SOLO_IDA_PACIENTE: 'Por KM (Cambia CP) — Solo Ida ($656,85 / km)',
  KM_BASE_DOM_DEST_VUELTA_SC: 'Por KM (Cambia CP) — Base → Domicilio → Destino (Vuelta S/Cargo)',
  KM_BASE_CIRCUITO_COMPLETO: 'Por KM (Cambia CP) — Base → Domicilio → Destino → Base (Circuito completo)',
  KM_IDA_VUELTA_PACIENTE: 'Por KM (Cambia CP) — Ida y Vuelta (Domicilio ↔ Destino × 2)',
};
const REGLAS_KM_ART_LABELS = {
  SOLO_IDA_PACIENTE: 'KM Solo de Ida (Domicilio → Destino)',
  BASE_DOMICILIO_DESTINO_VUELTA_SC: 'Base → Domicilio → Destino (Vuelta S/Cargo)',
  BASE_CIRCUITO_COMPLETO: 'Base → Domicilio → Destino → Base (Suma Ida y Vuelta a Base)',
  IDA_VUELTA_PACIENTE: 'Ida y Vuelta (Domicilio ↔ Destino × 2)',
};
const MODOS_FACTURACION_ART_LABELS = {
  URBANO_TRAMOS_Y_KM_CP: 'Mixto ART: Radio Céntrico por Tramo 1/2 Fijo • Fuera de CP suma KM',
  SOLO_TRAMOS_URBANOS: 'Siempre por Valor Fijo Urbano (Tramo 1 / Tramo 2)',
  SIEMPRE_POR_KM: 'Siempre por Kilómetros según regla pactada',
};
const TIPOS_DOC_VEHICULO = [
  { tipo: 'SEGURO', label: 'Seguro Automotor' },
  { tipo: 'HABILITACION_TRANSPORTE', label: 'Habilitación Transporte' },
  { tipo: 'RTO', label: 'RTO (Revisión Técnica)' },
  { tipo: 'MATAFUEGOS', label: 'Matafuegos' },
  { tipo: 'DESINFECCION', label: 'Cert. Desinfección' },
];
// ============================================================================
// HOJA DE RUTA REAL MAÑANA 19/11/2026 (PREVENCIÓN ART - 3 PACIENTES / 6 TRAMOS)
// ============================================================================
const HOJA_RUTA_REAL_19_11_2026 = [
  {
    id: 'real-20261119-1',
    token_paciente: 'tok-scheidegger-20261119',
    art_nombre: 'Prevención ART',
    modalidad_viaje: 'IDA_VUELTA',
    prestador_id: '22222222-2222-2222-2222-222222222221',
    vehiculo_id: '33333333-3333-3333-3333-333333333331',
    chofer_id: '44444444-4444-4444-4444-444444444441',
    chofer_nombre_snap: 'Matías Emanuel Gatica',
    paciente_nombre: 'SCHEIDEGGER, MARIA ROMINA',
    paciente_dni: '36788321',
    paciente_telefono: '2604060615',
    numero_siniestro: '3066182 (Aut. 5032787/7)',
    origen_direccion: 'Av. Moreno 2870, San Rafael, Mendoza',
    origen_lat: -34.6025,
    origen_lng: -68.3495,
    destino_nombre: 'Bernardino Rivadavia 340, San Rafael, Mendoza',
    destino_lat: -34.6152,
    destino_lng: -68.3342,
    fecha_programada: '2026-11-19',
    hora_programada: '08:30',
    estado: 'ASIGNADO',
    km_reales: 3.2,
    horas_espera: 0,
    importe_total: 11260.08,
    gps_progreso: 10,
    condicion_paciente: 'AMBULATORIO',
    lleva_acompanante: false,
    acompanante_detalle: '',
    lleva_silla_ruedas: false,
    elemento_ortopedico: 'NINGUNO',
    requiere_vehiculo_especial: false,
    peso_paciente_kg: null,
    tipo_vehiculo_especial: 'ESTANDAR',
    observaciones_traslado:
      'Fisiokinesio Terapia • Ida 08:30 hs (Tramo 05032787/07) / Regreso 09:30 hs (Tramo 05032787/08) • Solicitado por: Díaz Gastón Facundo • Cel: 0260-154060615 acc / 0260-154096925',
    cp_base: '5600',
    cp_origen: '5600',
    cp_destino: '5600',
    cambia_codigo_postal: false,
    esquema_liquidacion: 'TRAMO_2_URBANO',
    km_base_a_origen: 2.8,
    km_origen_a_destino: 3.2,
    km_destino_a_base: 0.9,
    horas_espera_facturables: 0,
    eventos: [
      {
        hora: '08:00',
        estado: 'ASIGNADO',
        detalle: 'Reporte Prevención ART 19/11/2026 • Ida 08:30 hs / Regreso 09:30 hs • Radio Céntrico Ida y Vuelta ($11.260,08)',
        meta_condiciones: {
          condicion_paciente: 'AMBULATORIO',
          lleva_acompanante: false,
          acompanante_detalle: '',
          lleva_silla_ruedas: false,
          elemento_ortopedico: 'NINGUNO',
          requiere_vehiculo_especial: false,
          peso_paciente_kg: null,
          tipo_vehiculo_especial: 'ESTANDAR',
          observaciones_traslado:
            'Fisiokinesio Terapia • Ida 08:30 hs (Tramo 05032787/07) / Regreso 09:30 hs (Tramo 05032787/08) • Solicitado por: Díaz Gastón Facundo • Cel: 0260-154060615 acc / 0260-154096925',
          chofer_id: '44444444-4444-4444-4444-444444444441',
          chofer_nombre_snap: 'Matías Emanuel Gatica',
          cp_base: '5600',
          cp_origen: '5600',
          cp_destino: '5600',
          cambia_codigo_postal: false,
          esquema_liquidacion: 'TRAMO_2_URBANO',
          km_base_a_origen: 2.8,
          km_origen_a_destino: 3.2,
          km_destino_a_base: 0.9,
          horas_espera_facturables: 0,
        },
      },
    ],
    chat_mensajes: [],
  },
  {
    id: 'real-20261119-2',
    token_paciente: 'tok-casado-20261119',
    art_nombre: 'Prevención ART',
    modalidad_viaje: 'IDA_VUELTA',
    prestador_id: '22222222-2222-2222-2222-222222222221',
    vehiculo_id: '33333333-3333-3333-3333-333333333331',
    chofer_id: '44444444-4444-4444-4444-444444444441',
    chofer_nombre_snap: 'Matías Emanuel Gatica',
    paciente_nombre: 'CASADO, JOSE MARIA',
    paciente_dni: '35908887',
    paciente_telefono: '2625446715',
    numero_siniestro: '3050702 (Aut. 5031009/9)',
    origen_direccion: 'Ruta 165 S/N° 165, Cañada Seca, San Rafael, Mendoza',
    origen_lat: -34.6780,
    origen_lng: -68.2320,
    destino_nombre: 'Bernardino Rivadavia 340 (985), San Rafael, Mendoza',
    destino_lat: -34.6152,
    destino_lng: -68.3342,
    fecha_programada: '2026-11-19',
    hora_programada: '11:00',
    estado: 'ASIGNADO',
    km_reales: 16.5,
    horas_espera: 0,
    importe_total: 10838.03,
    gps_progreso: 10,
    condicion_paciente: 'MOVILIDAD_REDUCIDA',
    lleva_acompanante: false,
    acompanante_detalle: '',
    lleva_silla_ruedas: true,
    elemento_ortopedico: 'MULETAS_ANDADOR',
    requiere_vehiculo_especial: false,
    peso_paciente_kg: null,
    tipo_vehiculo_especial: 'ESTANDAR',
    observaciones_traslado:
      'Fisiokinesio Terapia • Especificaciones: MULETAS (solicita paciente 5 días MULETAS) • Ida 11:00 hs (Tramo 05031009/09) / Regreso 12:00 hs (Tramo 05031009/10) • Solicitado por: Villalba Vanesa • Tel: 5492625446715 / 0260-154310456',
    cp_base: '5600',
    cp_origen: '5603',
    cp_destino: '5600',
    cambia_codigo_postal: true,
    esquema_liquidacion: 'KM_SOLO_IDA_PACIENTE',
    km_base_a_origen: 16.0,
    km_origen_a_destino: 16.5,
    km_destino_a_base: 0.9,
    horas_espera_facturables: 0,
    eventos: [
      {
        hora: '08:00',
        estado: 'ASIGNADO',
        detalle: 'Reporte Prevención ART 19/11/2026 • Cañada Seca ↔ Rivadavia 340 • Especificaciones: MULETAS (Ida 11:00 / Vuelta 12:00)',
        meta_condiciones: {
          condicion_paciente: 'MOVILIDAD_REDUCIDA',
          lleva_acompanante: false,
          acompanante_detalle: '',
          lleva_silla_ruedas: true,
          elemento_ortopedico: 'MULETAS_ANDADOR',
          requiere_vehiculo_especial: false,
          peso_paciente_kg: null,
          tipo_vehiculo_especial: 'ESTANDAR',
          observaciones_traslado:
            'Fisiokinesio Terapia • Especificaciones: MULETAS (solicita paciente 5 días MULETAS) • Ida 11:00 hs (Tramo 05031009/09) / Regreso 12:00 hs (Tramo 05031009/10) • Solicitado por: Villalba Vanesa • Tel: 5492625446715 / 0260-154310456',
          chofer_id: '44444444-4444-4444-4444-444444444441',
          chofer_nombre_snap: 'Matías Emanuel Gatica',
          cp_base: '5600',
          cp_origen: '5603',
          cp_destino: '5600',
          cambia_codigo_postal: true,
          esquema_liquidacion: 'KM_SOLO_IDA_PACIENTE',
          km_base_a_origen: 16.0,
          km_origen_a_destino: 16.5,
          km_destino_a_base: 0.9,
          horas_espera_facturables: 0,
        },
      },
    ],
    chat_mensajes: [],
  },
  {
    id: 'real-20261119-3',
    token_paciente: 'tok-velazquez-20261119',
    art_nombre: 'Prevención ART',
    modalidad_viaje: 'IDA_VUELTA',
    prestador_id: '22222222-2222-2222-2222-222222222221',
    vehiculo_id: '33333333-3333-3333-3333-333333333331',
    chofer_id: '44444444-4444-4444-4444-444444444441',
    chofer_nombre_snap: 'Matías Emanuel Gatica',
    paciente_nombre: 'VELAZQUEZ, GRACIELA ISABEL',
    paciente_dni: '24667007',
    paciente_telefono: '2604010228',
    numero_siniestro: '3060912 (Aut. 5032266/7)',
    origen_direccion: 'Bolívar 285, San Rafael, Mendoza',
    origen_lat: -34.6215,
    origen_lng: -68.3315,
    destino_nombre: 'Bernardino Rivadavia 340, San Rafael, Mendoza',
    destino_lat: -34.6152,
    destino_lng: -68.3342,
    fecha_programada: '2026-11-19',
    hora_programada: '11:30',
    estado: 'ASIGNADO',
    km_reales: 1.4,
    horas_espera: 0,
    importe_total: 11260.08,
    gps_progreso: 10,
    condicion_paciente: 'AMBULATORIO',
    lleva_acompanante: false,
    acompanante_detalle: '',
    lleva_silla_ruedas: false,
    elemento_ortopedico: 'NINGUNO',
    requiere_vehiculo_especial: false,
    peso_paciente_kg: null,
    tipo_vehiculo_especial: 'ESTANDAR',
    observaciones_traslado:
      'Fisiokinesio Terapia • Ida 11:30 hs (Tramo 05032266/07) / Regreso 12:30 hs (Tramo 05032266/08) • Solicitado por: Bogado Alicia • Cel: 0260-154010228 / por paciente',
    cp_base: '5600',
    cp_origen: '5600',
    cp_destino: '5600',
    cambia_codigo_postal: false,
    esquema_liquidacion: 'TRAMO_2_URBANO',
    km_base_a_origen: 1.1,
    km_origen_a_destino: 1.4,
    km_destino_a_base: 0.9,
    horas_espera_facturables: 0,
    eventos: [
      {
        hora: '08:00',
        estado: 'ASIGNADO',
        detalle: 'Reporte Prevención ART 19/11/2026 • Ida 11:30 hs / Regreso 12:30 hs • Radio Céntrico Ida y Vuelta ($11.260,08)',
        meta_condiciones: {
          condicion_paciente: 'AMBULATORIO',
          lleva_acompanante: false,
          acompanante_detalle: '',
          lleva_silla_ruedas: false,
          elemento_ortopedico: 'NINGUNO',
          requiere_vehiculo_especial: false,
          peso_paciente_kg: null,
          tipo_vehiculo_especial: 'ESTANDAR',
          observaciones_traslado:
            'Fisiokinesio Terapia • Ida 11:30 hs (Tramo 05032266/07) / Regreso 12:30 hs (Tramo 05032266/08) • Solicitado por: Bogado Alicia • Cel: 0260-154010228 / por paciente',
          chofer_id: '44444444-4444-4444-4444-444444444441',
          chofer_nombre_snap: 'Matías Emanuel Gatica',
          cp_base: '5600',
          cp_origen: '5600',
          cp_destino: '5600',
          cambia_codigo_postal: false,
          esquema_liquidacion: 'TRAMO_2_URBANO',
          km_base_a_origen: 1.1,
          km_origen_a_destino: 1.4,
          km_destino_a_base: 0.9,
          horas_espera_facturables: 0,
        },
      },
    ],
    chat_mensajes: [],
  },
];
// Normaliza los 5 documentos obligatorios de cualquier vehículo
const normalizarDocsVehiculo = (docs = []) => {
  const mapa = {};
  (docs || []).forEach((d) => {
    if (d && d.tipo) mapa[d.tipo] = d.vencimiento;
  });
  return TIPOS_DOC_VEHICULO.map((item) => ({
    tipo: item.tipo,
    vencimiento: mapa[item.tipo] || '2027-06-01',
  }));
};
// Extrae las condiciones y metadatos extendidos del traslado
const obtenerMetaTraslado = (t) => {
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
      chofer_id: null,
      chofer_nombre_snap: '',
      cp_base: '5600',
      cp_origen: '5600',
      cp_destino: '5600',
      cambia_codigo_postal: false,
      esquema_liquidacion: 'TRAMO_2_URBANO',
      km_base_a_origen: 2.0,
      km_origen_a_destino: 4.5,
      km_destino_a_base: 3.5,
      horas_espera_facturables: 0,
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
  const cpBase = String(t.cp_base ?? combinado.cp_base ?? '5600').trim();
  const cpOrigen = String(t.cp_origen ?? combinado.cp_origen ?? '5600').trim();
  const cpDestino = String(t.cp_destino ?? combinado.cp_destino ?? '5600').trim();
  const cambiaCp = Boolean(
    t.cambia_codigo_postal ??
      combinado.cambia_codigo_postal ??
      (cpOrigen !== cpBase || cpDestino !== cpBase)
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
    chofer_id: t.chofer_id ?? combinado.chofer_id ?? null,
    chofer_nombre_snap: t.chofer_nombre_snap ?? combinado.chofer_nombre_snap ?? '',
    cp_base: cpBase,
    cp_origen: cpOrigen,
    cp_destino: cpDestino,
    cambia_codigo_postal: cambiaCp,
    esquema_liquidacion:
      t.esquema_liquidacion ||
      combinado.esquema_liquidacion ||
      (cambiaCp
        ? 'KM_SOLO_IDA_PACIENTE'
        : t.modalidad_viaje === 'SOLO_IDA'
        ? 'TRAMO_1_URBANO'
        : 'TRAMO_2_URBANO'),
    km_base_a_origen: Number(t.km_base_a_origen ?? combinado.km_base_a_origen ?? 2.0),
    km_origen_a_destino: Number(t.km_origen_a_destino ?? combinado.km_origen_a_destino ?? t.km_reales ?? 4.5),
    km_destino_a_base: Number(t.km_destino_a_base ?? combinado.km_destino_a_base ?? 3.5),
    horas_espera_facturables: Number(t.horas_espera_facturables ?? combinado.horas_espera_facturables ?? 0),
  };
};
// Resumen legible en texto de las condiciones del traslado
const resumirCondicionesTexto = (t) => {
  const c = obtenerMetaTraslado(t);
  const partes = [];
  if (c.condicion_paciente && c.condicion_paciente !== 'AMBULATORIO') {
    partes.push(CONDICIONES_PACIENTE_LABELS[c.condicion_paciente] || c.condicion_paciente);
  }
  if (c.lleva_acompanante) {
    partes.push(`Con Acompañante${c.acompanante_detalle ? ` (${c.acompanante_detalle})` : ''}`);
  }
  if (c.lleva_silla_ruedas || (c.elemento_ortopedico && c.elemento_ortopedico !== 'NINGUNO')) {
    partes.push(ELEMENTOS_ORTOPEDICOS_LABELS[c.elemento_ortopedico] || 'Muletas / Silla');
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
const buscarCoordenadasDireccion = async (direccion, localidadDefault = 'San Rafael, Mendoza, Argentina') => {
  try {
    const texto = direccion.toLowerCase().includes('mendoza')
      ? `${direccion}, Argentina`
      : `${direccion}, ${localidadDefault}`;
    const query = encodeURIComponent(texto);
    const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${query}&limit=1`);
    const data = await resp.json();
    if (data && data.length > 0) {
      const postcode = data[0].address?.postcode
        ? String(data[0].address.postcode).replace(/\D/g, '').slice(0, 4) || '5600'
        : null;
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        cp: postcode,
      };
    }
  } catch (e) {
    console.warn('No se pudo geocodificar dirección:', e);
  }
  return null;
};
const calcularDistanciaKm = (lat1, lng1, lat2, lng2) => {
  if (!lat1 || !lng1 || !lat2 || !lng2) return 4.2;
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
  return Math.max(1.2, +(R * c * 1.25).toFixed(1));
};
// ============================================================================
// BADGES VISUALES DE CONDICIONES DEL TRASLADO
// ============================================================================
const BadgesCondicionesTraslado = ({ traslado, mostrarObservaciones = false }) => {
  const c = obtenerMetaTraslado(traslado);
  const tieneEspecial =
    c.lleva_acompanante ||
    c.lleva_silla_ruedas ||
    c.requiere_vehiculo_especial ||
    Number(c.peso_paciente_kg) > 0 ||
    (c.condicion_paciente && c.condicion_paciente !== 'AMBULATORIO') ||
    Boolean(c.observaciones_traslado);
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {!tieneEspecial && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
            Ambulatorio Estándar
          </span>
        )}
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
            {ELEMENTOS_ORTOPEDICOS_LABELS[c.elemento_ortopedico] || 'Muletas / Silla'}
          </span>
        )}
        {(c.requiere_vehiculo_especial || Number(c.peso_paciente_kg) >= 100) && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-300">
            <Scale className="w-3 h-3" />
            {c.peso_paciente_kg ? `${c.peso_paciente_kg} kg • ` : ''}
            {TIPOS_VEHICULO_ESPECIAL_LABELS[c.tipo_vehiculo_especial] || 'Vehículo Especial'}
          </span>
        )}
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
            c.cambia_codigo_postal
              ? 'bg-blue-50 text-[#1E588D] border-blue-200'
              : 'bg-teal-50 text-teal-800 border-teal-200'
          }`}
        >
          {c.cambia_codigo_postal
            ? `Interurbano (CP Base ${c.cp_base} → ${c.cp_origen}/${c.cp_destino})`
            : `Radio Céntrico CP ${c.cp_base} (${c.esquema_liquidacion === 'TRAMO_1_URBANO' ? 'Tramo 1 Ida' : 'Ida y Vuelta Tramo 1+2'})`}
        </span>
      </div>
      {mostrarObservaciones && c.observaciones_traslado && (
        <div className="text-xs bg-amber-50/80 border border-amber-200 text-amber-900 px-3 py-1.5 rounded-lg flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <span><strong>Detalle / Especificaciones:</strong> {c.observaciones_traslado}</span>
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
      : [-34.6152, -68.3342];
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
        zoom: 13,
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
        <span className={`w-2 h-2 rounded-full animate-ping ${coordsReales?.lat ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        {coordsReales?.lat
          ? '📡 GPS Real del Chofer en Vivo • Tiempo Real'
          : 'GPS Estimado de Ruta • Esperando señal del chofer'}
      </div>
    </div>
  );
};
// ============================================================================
// MAPA GENERAL DE FLOTA EN VIVO (PARA TORRE DE CONTROL ART)
// ============================================================================
const MapaGeneralFlota = ({ trasladosActivos, vehiculos, obtenerNombreChofer }) => {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);
  const markersRef = useRef({});
  // Inicializar el mapa una sola vez para no perder zoom ni parpadear con el GPS en vivo
  useEffect(() => {
    if (!mapRef.current || !window.L || instanceRef.current) return;
    const L = window.L;
    const map = L.map(mapRef.current, {
      center: [-34.6177, -68.3301],
      zoom: 12,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);
    instanceRef.current = map;
    return () => {
      if (instanceRef.current) {
        instanceRef.current.remove();
        instanceRef.current = null;
        markersRef.current = {};
      }
    };
  }, []);
  // Actualizar posiciones y estados de cada unidad en tiempo real sin reconstruir el mapa
  useEffect(() => {
    if (!instanceRef.current || !window.L) return;
    const L = window.L;
    const map = instanceRef.current;
    const idsPresentes = new Set();
    trasladosActivos.forEach((t) => {
      const idStr = String(t.id);
      idsPresentes.add(idStr);
      const veh = vehiculos.find((v) => v.id === t.vehiculo_id);
      const nombreChofer = obtenerNombreChofer ? obtenerNombreChofer(t) : veh?.chofer_nombre || '';
      const cond = obtenerMetaTraslado(t);
      const orig = t.origen_lat && t.origen_lng ? [t.origen_lat, t.origen_lng] : [-34.6245, -68.3480];
      const dest = t.destino_lat && t.destino_lng ? [t.destino_lat, t.destino_lng] : [-34.6152, -68.3342];
      const factor = Math.min(100, Math.max(0, t.gps_progreso || 20)) / 100;
      const tieneGpsReal = Boolean(t.coords_reales?.lat && t.coords_reales?.lng);
      const pos = tieneGpsReal
        ? [t.coords_reales.lat, t.coords_reales.lng]
        : [orig[0] + (dest[0] - orig[0]) * factor, orig[1] + (dest[1] - orig[1]) * factor];
      const badgeExtra = cond.lleva_silla_ruedas ? ' ♿' : cond.requiere_vehiculo_especial ? ' ⭐' : '';
      const badgeGps = tieneGpsReal ? '📡 ' : '🚕 ';
      const bg = t.estado === 'ALERTA_DESPERFECTO' ? '#dc2626' : tieneGpsReal ? '#0f766e' : '#1E588D';
      const icon = L.divIcon({
        className: 'fleet-pin',
        html: `<div style="background:${bg};color:white;padding:3px 8px;border-radius:999px;font-weight:800;font-size:10px;border:2px solid #34B37B;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3);">${badgeGps}${veh?.patente || 'Móvil'} • ${(t.paciente_nombre || '').split(',')[0]}${badgeExtra}</div>`,
        iconSize: [135, 24],
        iconAnchor: [67, 12],
      });
      const popupHtml = `<b>${veh?.patente || 'Unidad'}</b> (${nombreChofer})<br/>${tieneGpsReal ? '<span style="color:#059669;font-weight:bold;">📡 GPS Real del Chofer</span>' : 'Ruta estimada'}<br/>Paciente: ${t.paciente_nombre}<br/>Hora: ${t.hora_programada} hs<br/>Estado: ${t.estado}<br/>Destino: ${t.destino_nombre}`;
      if (markersRef.current[idStr]) {
        markersRef.current[idStr].setLatLng(pos);
        markersRef.current[idStr].setIcon(icon);
        markersRef.current[idStr].setPopupContent(popupHtml);
      } else {
        markersRef.current[idStr] = L.marker(pos, { icon }).addTo(map).bindPopup(popupHtml);
      }
    });
    Object.keys(markersRef.current).forEach((idKey) => {
      if (!idsPresentes.has(idKey)) {
        map.removeLayer(markersRef.current[idKey]);
        delete markersRef.current[idKey];
      }
    });
  }, [trasladosActivos, vehiculos]);
  const cantidadGpsReal = trasladosActivos.filter((t) => t.coords_reales?.lat).length;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 bg-slate-900 text-white flex flex-wrap justify-between items-center gap-2 text-xs">
        <span className="font-bold flex items-center gap-2">
          <Navigation className="w-4 h-4 text-[#34B37B]" /> Radar Satelital de Flota en Tiempo Real (San Rafael y Distritos)
        </span>
        <div className="flex items-center gap-3 text-[11px] text-slate-300">
          {cantidadGpsReal > 0 && (
            <span className="text-emerald-300 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              {cantidadGpsReal} con GPS real en vivo
            </span>
          )}
          <span>{trasladosActivos.length} traslados en vista</span>
        </div>
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
      condicion_paciente: checked && state.condicion_paciente === 'AMBULATORIO' ? 'MOVILIDAD_REDUCIDA' : state.condicion_paciente,
      elemento_ortopedico: checked
        ? state.elemento_ortopedico === 'NINGUNO'
          ? 'MULETAS_ANDADOR'
          : state.elemento_ortopedico
        : 'NINGUNO',
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
            Especificá si viaja con acompañante, muletas/silla de ruedas o requiere unidad amplia por peso (ej. 150 kg).
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
                lleva_silla_ruedas: val === 'SILLA_DE_RUEDAS' || val === 'MOVILIDAD_REDUCIDA' ? true : state.lleva_silla_ruedas,
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
          <input
            type="number"
            min="1"
            max="350"
            value={state.peso_paciente_kg || ''}
            onChange={(e) => handlePesoChange(e.target.value)}
            placeholder="Ej: 150 (activa alerta vehículo amplio >= 120 kg)"
            className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white"
          />
          {Number(state.peso_paciente_kg) >= 120 && (
            <p className="text-[11px] text-rose-600 font-bold mt-1 flex items-center gap-1">
              <Scale className="w-3.5 h-3.5" /> Paciente de {state.peso_paciente_kg} kg: se activó requerimiento de Vehículo Amplio / Especial.
            </p>
          )}
        </div>
      </div>
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
        {/* Silla de ruedas / Muletas */}
        <div
          className={`p-3 rounded-xl border transition ${
            state.lleva_silla_ruedas ? 'bg-amber-50/70 border-amber-300' : 'bg-white border-slate-200'
          }`}
        >
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Accessibility className="w-4 h-4 text-amber-600" /> ¿Muletas / Silla?
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
              value={state.elemento_ortopedico || 'MULETAS_ANDADOR'}
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
          placeholder="Ej: Solicita paciente 5 días MULETAS • Ida 11:00 / Regreso 12:00..."
          className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white"
        />
      </div>
    </div>
  );
};
// ============================================================================
// APLICACIÓN PRINCIPAL ERQUENCI ART SAAS (CON PRUEBA REAL 19/11/2026)
// ============================================================================
export default function App() {
  const params = new URLSearchParams(window.location.search);
  const pacienteTokenUrl = params.get('token');
  const choferIdUrl = params.get('chofer');
  const trasladoIdUrl = params.get('traslado');
  const modoUrl = params.get('modo');
  const esAccesoExclusivoPaciente = Boolean(pacienteTokenUrl || modoUrl === 'paciente');
  const esAccesoExclusivoChofer = Boolean(choferIdUrl || modoUrl === 'chofer');
  const [session, setSession] = useState(null);
  const [modoDemo, setModoDemo] = useState(true);
  const [rolActivo, setRolActivo] = useState(
    esAccesoExclusivoPaciente ? 'PACIENTE' : esAccesoExclusivoChofer ? 'CHOFER' : 'CENTRAL_ART'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [sincronizandoDb, setSincronizandoDb] = useState(false);
  // ============================================================================
  // TARIFAS CONVENIDAS REALES (PREVENCIÓN ART: TRAMO 1 $5.630,04 | IDA Y VUELTA $11.260,08 | ESPERA $5.630,04 | KM SOLO IDA $656,85)
  // ============================================================================
  const [tarifasArt, setTarifasArt] = useState([
    {
      id: 't-1',
      nombre_art: 'Prevención ART',
      valor_km: 656.85,
      bajada_bandera: 0,
      valor_hora_espera: 5630.04,
      espera_desde_hora: 1,
      modo_facturacion_default: 'URBANO_TRAMOS_Y_KM_CP',
      regla_km: 'SOLO_IDA_PACIENTE',
      valor_tramo_1: 5630.04,
      valor_tramo_2: 11260.08,
    },
    {
      id: 't-2',
      nombre_art: 'Galeno ART',
      valor_km: 656.85,
      bajada_bandera: 0,
      valor_hora_espera: 5630.04,
      espera_desde_hora: 1,
      modo_facturacion_default: 'URBANO_TRAMOS_Y_KM_CP',
      regla_km: 'SOLO_IDA_PACIENTE',
      valor_tramo_1: 5630.04,
      valor_tramo_2: 11260.08,
    },
    {
      id: 't-3',
      nombre_art: 'Asociart ART',
      valor_km: 656.85,
      bajada_bandera: 0,
      valor_hora_espera: 5630.04,
      espera_desde_hora: 1,
      modo_facturacion_default: 'URBANO_TRAMOS_Y_KM_CP',
      regla_km: 'SOLO_IDA_PACIENTE',
      valor_tramo_1: 5630.04,
      valor_tramo_2: 11260.08,
    },
    {
      id: 't-4',
      nombre_art: 'La Segunda ART',
      valor_km: 656.85,
      bajada_bandera: 0,
      valor_hora_espera: 5630.04,
      espera_desde_hora: 1,
      modo_facturacion_default: 'URBANO_TRAMOS_Y_KM_CP',
      regla_km: 'SOLO_IDA_PACIENTE',
      valor_tramo_1: 5630.04,
      valor_tramo_2: 11260.08,
    },
    {
      id: 't-5',
      nombre_art: 'Provincia ART',
      valor_km: 656.85,
      bajada_bandera: 0,
      valor_hora_espera: 5630.04,
      espera_desde_hora: 1,
      modo_facturacion_default: 'URBANO_TRAMOS_Y_KM_CP',
      regla_km: 'SOLO_IDA_PACIENTE',
      valor_tramo_1: 5630.04,
      valor_tramo_2: 11260.08,
    },
  ]);
  const [mostrarFormArt, setMostrarFormArt] = useState(false);
  const [artEditandoNombre, setArtEditandoNombre] = useState(null);
  const [formArt, setFormArt] = useState({
    nombre_art: '',
    valor_tramo_1: 5630.04,
    valor_tramo_2: 11260.08,
    valor_km: 656.85,
    bajada_bandera: 0,
    valor_hora_espera: 5630.04,
    espera_desde_hora: 1,
    modo_facturacion_default: 'URBANO_TRAMOS_Y_KM_CP',
    regla_km: 'SOLO_IDA_PACIENTE',
  });
  const [centrosMedicos, setCentrosMedicos] = useState([
    { id: 'cm-riv340', nombre: 'Fisiokinesio Terapia / Consultorios Rivadavia', direccion: 'Bernardino Rivadavia 340, San Rafael, Mendoza', codigo_postal: '5600', lat: -34.6152, lng: -68.3342 },
    { id: 'cm-1', nombre: 'Policlínica San Rafael', direccion: 'Av. Mitre 650, San Rafael', codigo_postal: '5600', lat: -34.6148, lng: -68.3265 },
    { id: 'cm-2', nombre: 'Hospital Teodoro J. Schestakow', direccion: 'Emilio Civit 150, San Rafael', codigo_postal: '5600', lat: -34.6112, lng: -68.3385 },
    { id: 'cm-3', nombre: 'Centro de Rehabilitación Cuyo', direccion: 'Av. H. Yrigoyen 1420, San Rafael', codigo_postal: '5600', lat: -34.6179, lng: -68.3452 },
  ]);
  const [mostrarFormCentro, setMostrarFormCentro] = useState(false);
  const [mostrarGestorCentros, setMostrarGestorCentros] = useState(false);
  const [nuevoCentro, setNuevoCentro] = useState({ nombre: '', direccion: '', codigo_postal: '5600' });
  const [centroEditando, setCentroEditando] = useState(null);
  const [prestadores, setPrestadores] = useState([
    {
      id: '22222222-2222-2222-2222-222222222221',
      razon_social: 'Erquenci S.A.S.',
      cuit: '30-71792870-5',
      domicilio_base: 'Av. Moreno 37, San Rafael, Mendoza',
      codigo_postal_base: '5600',
      base_lat: -34.6158,
      base_lng: -68.3285,
      zona_cobertura: 'San Rafael, Cañada Seca, Gral. Alvear y Malargüe',
      telefono_guardia: '2604017356',
      habilitado_operar: true,
    },
  ]);
  const [prestadorEditando, setPrestadorEditando] = useState(null);
  const [choferes, setChoferes] = useState([
    {
      id: '44444444-4444-4444-4444-444444444441',
      prestador_id: '22222222-2222-2222-2222-222222222221',
      vehiculo_habitual_id: '33333333-3333-3333-3333-333333333331',
      nombre: 'Matías Emanuel Gatica',
      dni: '43.750.257',
      telefono: '2604017356',
      foto_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      licencia_venc: '2027-08-15',
    },
  ]);
  const [choferEditando, setChoferEditando] = useState(null);
  const [nuevoChofer, setNuevoChofer] = useState({
    prestador_id: '22222222-2222-2222-2222-222222222221',
    vehiculo_habitual_id: '33333333-3333-3333-3333-333333333331',
    nombre: '',
    dni: '',
    telefono: '',
    foto_url: '',
    licencia_venc: '2027-08-15',
  });
  const [vehiculos, setVehiculos] = useState([
    {
      id: '33333333-3333-3333-3333-333333333331',
      prestador_id: '22222222-2222-2222-2222-222222222221',
      chofer_id: '44444444-4444-4444-4444-444444444441',
      patente: 'AB 635 BN',
      modelo: 'Peugeot 408 1.6 HDI Feline',
      tipo_movilidad: 'AMPLIO_150KG_SILLA',
      chofer_nombre: 'Matías Emanuel Gatica',
      chofer_foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      licencia_venc: '2027-08-15',
      docs: [
        { tipo: 'SEGURO', vencimiento: '2027-03-20' },
        { tipo: 'HABILITACION_TRANSPORTE', vencimiento: '2027-06-01' },
        { tipo: 'RTO', vencimiento: '2027-05-10' },
        { tipo: 'MATAFUEGOS', vencimiento: '2027-04-12' },
        { tipo: 'DESINFECCION', vencimiento: '2027-04-30' },
      ],
    },
  ]);
  const [vehiculoEditando, setVehiculoEditando] = useState(null);
  // 100% hidratado desde Supabase (sin re-inyectar viajes hardcodeados)
  const [traslados, setTraslados] = useState([]);
  const [viajeSeleccionadoId, setViajeSeleccionadoId] = useState(null);
  const [tabAdmin, setTabAdmin] = useState('TORRE');
  const [splashEstado, setSplashEstado] = useState('VISIBLE'); // 'VISIBLE' | 'SALIENDO' | 'OCULTO'
  const [barraCargaTab, setBarraCargaTab] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setSplashEstado('SALIENDO'), 780);
    const t2 = setTimeout(() => setSplashEstado('OCULTO'), 1200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);
  const dispararBarraTransicion = () => {
    setBarraCargaTab(false);
    requestAnimationFrame(() => setBarraCargaTab(true));
  };
  useEffect(() => {
    if (!barraCargaTab) return;
    const t = setTimeout(() => setBarraCargaTab(false), 450);
    return () => clearTimeout(t);
  }, [barraCargaTab]);
  const cambiarTabAdmin = (nuevoTab) => {
    if (nuevoTab === tabAdmin) return;
    dispararBarraTransicion();
    setTabAdmin(nuevoTab);
  };
  const cambiarRolConTransicion = (nuevoRol) => {
    if (nuevoRol === rolActivo) return;
    dispararBarraTransicion();
    setRolActivo(nuevoRol);
  };
  const [filtroArtLiquidacion, setFiltroArtLiquidacion] = useState('TODAS');
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [modalDesperfecto, setModalDesperfecto] = useState(false);
  const [textoFalla, setTextoFalla] = useState('');
  const [gpsRealActivo, setGpsRealActivo] = useState(false);
  const [ultimaSyncVivo, setUltimaSyncVivo] = useState('');
  const [buscandoGeo, setBuscandoGeo] = useState(false);
  const liveChannelRef = useRef(null);
  const gpsWatchIdRef = useRef(null);
  const ultimoEnvioGpsRef = useRef(0);
  const viajeActivoIdRef = useRef(null);
  const wakeLockRef = useRef(null);
  const bgWatcherIdRef = useRef(null);
  const [linkCopiadoMsg, setLinkCopiadoMsg] = useState('');
  const [guardandoHojaReal, setGuardandoHojaReal] = useState(false);
  // Filtros avanzados en Torre de Control
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
  const [frecuenciaSesiones, setFrecuenciaSesiones] = useState('DIARIO_HABIL');
  // Formulario de Nuevo Traslado
  const [nuevoViaje, setNuevoViaje] = useState({
    art_nombre: 'Prevención ART',
    modalidad_viaje: 'IDA_VUELTA',
    paciente_nombre: '',
    paciente_dni: '',
    paciente_telefono: '',
    numero_siniestro: '',
    origen_direccion: '',
    cp_origen: '5600',
    origen_lat: -34.6245,
    origen_lng: -68.3480,
    destino_nombre: 'Fisiokinesio Terapia / Consultorios Rivadavia (Bernardino Rivadavia 340, San Rafael, Mendoza)',
    cp_destino: '5600',
    destino_lat: -34.6152,
    destino_lng: -68.3342,
    orden_adjunta_url: '',
    prestador_id: '22222222-2222-2222-2222-222222222221',
    vehiculo_id: '33333333-3333-3333-3333-333333333331',
    chofer_id: '44444444-4444-4444-4444-444444444441',
    fecha_programada: '2026-11-19',
    hora_programada: '08:30',
    esquema_liquidacion: 'AUTO',
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
  const [nuevoPrestador, setNuevoPrestador] = useState({
    razon_social: '',
    cuit: '',
    domicilio_base: 'Av. Moreno 37, San Rafael, Mendoza',
    codigo_postal_base: '5600',
    base_lat: -34.6158,
    base_lng: -68.3285,
    zona_cobertura: 'San Rafael, Mendoza',
    telefono_guardia: '',
  });
  const [nuevoVehiculo, setNuevoVehiculo] = useState({
    prestador_id: '22222222-2222-2222-2222-222222222221',
    chofer_id: '44444444-4444-4444-4444-444444444441',
    patente: '',
    modelo: '',
    tipo_movilidad: 'AMPLIO_150KG_SILLA',
    seguro_venc: '2027-06-01',
    hab_venc: '2027-06-01',
    rto_venc: '2027-06-01',
    matafuegos_venc: '2027-06-01',
    desinfeccion_venc: '2027-06-01',
  });
  // ============================================================================
  // RESOLUCIÓN DE CHOFER INDEPENDIENTE POR TRASLADO O VEHÍCULO
  // ============================================================================
  const obtenerChoferDeVehiculo = (v) => {
    if (!v) return choferes[0] || null;
    const porId = choferes.find((c) => c.id === v.chofer_id);
    if (porId) return porId;
    const porNombre = choferes.find((c) => c.nombre === v.chofer_nombre);
    if (porNombre) return porNombre;
    return {
      id: v.chofer_id || `ch-${v.id}`,
      prestador_id: v.prestador_id,
      nombre: v.chofer_nombre || 'Matías Emanuel Gatica',
      foto_url: v.chofer_foto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      licencia_venc: v.licencia_venc || '2027-08-15',
      telefono: '2604017356',
    };
  };
  const obtenerChoferDeTraslado = (t) => {
    if (!t) return null;
    const meta = obtenerMetaTraslado(t);
    if (meta.chofer_id) {
      const ch = choferes.find((c) => c.id === meta.chofer_id);
      if (ch) return ch;
    }
    const veh = vehiculos.find((v) => v.id === t.vehiculo_id);
    const chVeh = obtenerChoferDeVehiculo(veh);
    if (meta.chofer_nombre_snap && chVeh) {
      return { ...chVeh, nombre: meta.chofer_nombre_snap };
    }
    return chVeh;
  };
  // ============================================================================
  // MOTOR DE LIQUIDACIÓN Y TARIFAS ART CON PRECISIÓN DECIMAL ($5.630,04 / $11.260,08 / $656,85)
  // ============================================================================
  const obtenerTarifaArt = (artNombre) => {
    const base = tarifasArt.find((t) => t.nombre_art === artNombre) || tarifasArt[0];
    return {
      valor_km: Number(base?.valor_km ?? 656.85),
      bajada_bandera: Number(base?.bajada_bandera ?? 0),
      valor_hora_espera: Number(base?.valor_hora_espera ?? 5630.04),
      espera_desde_hora: Number(base?.espera_desde_hora ?? 1),
      modo_facturacion_default: base?.modo_facturacion_default || 'URBANO_TRAMOS_Y_KM_CP',
      regla_km: base?.regla_km || 'SOLO_IDA_PACIENTE',
      valor_tramo_1: Number(base?.valor_tramo_1 ?? 5630.04),
      valor_tramo_2: Number(base?.valor_tramo_2 ?? 11260.08),
    };
  };
  const resolverEsquemaAutomatico = (artNombre, modalidadViaje, cpBase, cpOrigen, cpDestino) => {
    const tarifa = obtenerTarifaArt(artNombre);
    const cambiaCp =
      String(cpOrigen || '5600').trim() !== String(cpBase || '5600').trim() ||
      String(cpDestino || '5600').trim() !== String(cpBase || '5600').trim();
    if (tarifa.modo_facturacion_default === 'SOLO_TRAMOS_URBANOS') {
      return modalidadViaje === 'SOLO_IDA' ? 'TRAMO_1_URBANO' : 'TRAMO_2_URBANO';
    }
    if (tarifa.modo_facturacion_default === 'URBANO_TRAMOS_Y_KM_CP' && !cambiaCp) {
      return modalidadViaje === 'SOLO_IDA' ? 'TRAMO_1_URBANO' : 'TRAMO_2_URBANO';
    }
    if (tarifa.regla_km === 'BASE_CIRCUITO_COMPLETO') return 'KM_BASE_CIRCUITO_COMPLETO';
    if (tarifa.regla_km === 'IDA_VUELTA_PACIENTE') return 'KM_IDA_VUELTA_PACIENTE';
    if (tarifa.regla_km === 'BASE_DOMICILIO_DESTINO_VUELTA_SC') return 'KM_BASE_DOM_DEST_VUELTA_SC';
    return 'KM_SOLO_IDA_PACIENTE';
  };
  // Cálculo con precisión de 2 decimales exactos
  const calcularDesgloseLiquidacion = ({
    artNombre,
    esquema,
    modalidadViaje,
    kmBaseAOrigen,
    kmOrigenADestino,
    kmDestinoABase,
    horasEsperaTotal,
  }) => {
    const tarifa = obtenerTarifaArt(artNombre);
    const b2o = Number(kmBaseAOrigen || 0);
    const o2d = Number(kmOrigenADestino || 0);
    const d2b = Number(kmDestinoABase || 0);
    const esperaTotal = Number(horasEsperaTotal || 0);
    const franquicia = Number(tarifa.espera_desde_hora || 0);
    const horasEsperaFacturables = Math.max(0, +(esperaTotal - franquicia).toFixed(2));
    const importeEspera = +(horasEsperaFacturables * tarifa.valor_hora_espera).toFixed(2);
    let kmFacturables = 0;
    let importeRecorrido = 0;
    let descripcionCalculo = '';
    if (esquema === 'TRAMO_1_URBANO') {
      kmFacturables = o2d;
      importeRecorrido = +tarifa.valor_tramo_1.toFixed(2);
      descripcionCalculo = `Radio Céntrico Tramo 1 Solo Ida ($${formatearMoneda(tarifa.valor_tramo_1)})`;
    } else if (esquema === 'TRAMO_2_URBANO') {
      kmFacturables = +(o2d * 2).toFixed(1);
      importeRecorrido = +tarifa.valor_tramo_2.toFixed(2);
      descripcionCalculo = `Radio Céntrico Ida y Vuelta (Tramo 1 $${formatearMoneda(tarifa.valor_tramo_1)} + Tramo 2 $${formatearMoneda(tarifa.valor_tramo_2 - tarifa.valor_tramo_1)} = $${formatearMoneda(tarifa.valor_tramo_2)})`;
    } else if (esquema === 'KM_BASE_DOM_DEST_VUELTA_SC') {
      kmFacturables = +(b2o + o2d).toFixed(1);
      importeRecorrido = +(tarifa.bajada_bandera + kmFacturables * tarifa.valor_km).toFixed(2);
      descripcionCalculo = `Base→Dom (${b2o} km) + Dom→Dest (${o2d} km) = ${kmFacturables} km × $${formatearMoneda(tarifa.valor_km)} (Vuelta S/Cargo)`;
    } else if (esquema === 'KM_BASE_CIRCUITO_COMPLETO') {
      const circuito = +(b2o + o2d + d2b).toFixed(1);
      kmFacturables = modalidadViaje === 'IDA_VUELTA' ? +(circuito * 2).toFixed(1) : circuito;
      importeRecorrido = +(tarifa.bajada_bandera + kmFacturables * tarifa.valor_km).toFixed(2);
      descripcionCalculo = `Circuito Base→Dom→Dest→Base (${kmFacturables} km × $${formatearMoneda(tarifa.valor_km)})`;
    } else if (esquema === 'KM_IDA_VUELTA_PACIENTE') {
      kmFacturables = +(o2d * 2).toFixed(1);
      importeRecorrido = +(tarifa.bajada_bandera + kmFacturables * tarifa.valor_km).toFixed(2);
      descripcionCalculo = `Ida y Vuelta (${o2d} km × 2 = ${kmFacturables} km × $${formatearMoneda(tarifa.valor_km)})`;
    } else {
      // KM_SOLO_IDA_PACIENTE
      kmFacturables = o2d;
      importeRecorrido = +(tarifa.bajada_bandera + kmFacturables * tarifa.valor_km).toFixed(2);
      descripcionCalculo = `KM Solo de Ida (${kmFacturables} km × $${formatearMoneda(tarifa.valor_km)})`;
    }
    const importeTotal = +(importeRecorrido + importeEspera).toFixed(2);
    return {
      kmFacturables,
      horasEsperaFacturables,
      franquiciaEspera: franquicia,
      importeRecorrido,
      importeEspera,
      importeTotal,
      descripcionCalculo,
    };
  };
  // ============================================================================
  // BOTÓN 1-CLIC PARA IMPACTAR LOS 3 TRASLADOS REALES DEL 19/11/2026 EN SUPABASE
  // ============================================================================
  const impactarHojaRutaRealEnSupabase = async () => {
    setGuardandoHojaReal(true);
    try {
      // 1. Actualizar tarifas reales de Prevención ART en Supabase
      await supabase
        .from('tarifas_art')
        .update({
          valor_km: 656.85,
          valor_hora_espera: 5630.04,
          bajada_bandera: 0,
        })
        .eq('nombre_art', 'Prevención ART');
      // 2. Verificar cuáles de los 3 pacientes del 19/11/2026 aún no están en Supabase
      const { data: existentes } = await supabase
        .from('traslados')
        .select('id, paciente_dni, fecha_programada')
        .eq('fecha_programada', '2026-11-19');
      const dnisExistentes = new Set((existentes || []).map((x) => String(x.paciente_dni).trim()));
      const pendientes = HOJA_RUTA_REAL_19_11_2026.filter((item) => !dnisExistentes.has(item.paciente_dni));
      if (pendientes.length > 0) {
        const vehIdReal = vehiculos[0]?.id || '33333333-3333-3333-3333-333333333331';
        const prestIdReal = prestadores[0]?.id || '22222222-2222-2222-2222-222222222221';
        const payloadsBase = pendientes.map((item) => ({
          art_nombre: item.art_nombre,
          modalidad_viaje: item.modalidad_viaje,
          prestador_id: prestIdReal,
          vehiculo_id: vehIdReal,
          paciente_nombre: item.paciente_nombre,
          paciente_dni: item.paciente_dni,
          paciente_telefono: item.paciente_telefono,
          numero_siniestro: item.numero_siniestro,
          origen_direccion: item.origen_direccion,
          origen_lat: item.origen_lat,
          origen_lng: item.origen_lng,
          destino_nombre: item.destino_nombre,
          destino_lat: item.destino_lat,
          destino_lng: item.destino_lng,
          fecha_programada: item.fecha_programada,
          hora_programada: item.hora_programada,
          estado: 'ASIGNADO',
          km_reales: item.km_reales,
          horas_espera: 0,
          importe_total: Math.round(item.importe_total), // Si la columna en DB aún es integer, luego actualizamos con decimal
          gps_progreso: 10,
          eventos: item.eventos,
          chat_mensajes: [],
        }));
        const { data: insertados, error } = await supabase.from('traslados').insert(payloadsBase).select();
        if (error) {
          alert('Aviso al sincronizar con Supabase: ' + error.message);
        } else if (insertados) {
          // Intentar actualizar importe_total con los centavos exactos si ya corrieron migracion_supabase.sql
          for (const row of insertados) {
            const orig = pendientes.find((p) => p.paciente_dni === row.paciente_dni);
            if (orig) {
              await supabase.from('traslados').update({ importe_total: orig.importe_total }).eq('id', row.id);
            }
          }
        }
      }
      await cargarDatosDesdeSupabase();
      alert('¡Los 3 traslados reales del 19/11/2026 y las tarifas de Prevención ART quedaron sincronizados en Supabase!');
    } catch (e) {
      console.error(e);
    } finally {
      setGuardandoHojaReal(false);
    }
  };
  // ============================================================================
  // SINCRONIZACIÓN CON SUPABASE + RESPALDO LOCAL
  // ============================================================================
  const cargarDatosDesdeSupabase = async () => {
    setSincronizandoDb(true);
    try {
      const choferesLocal = localStorage.getItem('erquenci_choferes_v3');
      if (choferesLocal) {
        try {
          const parsed = JSON.parse(choferesLocal);
          if (Array.isArray(parsed) && parsed.length > 0) setChoferes(parsed);
        } catch (e) {
          console.warn(e);
        }
      }
      const [resPrest, resVeh, resCentros, resTarifas, resTraslados, resChoferes] = await Promise.all([
        supabase.from('prestadores').select('*').order('created_at', { ascending: true }),
        supabase.from('vehiculos').select('*').order('created_at', { ascending: true }),
        supabase.from('centros_medicos').select('*').order('created_at', { ascending: true }),
        supabase.from('tarifas_art').select('*').order('nombre_art', { ascending: true }),
        supabase.from('traslados').select('*').order('created_at', { ascending: false }),
        supabase.from('choferes').select('*').order('created_at', { ascending: true }),
      ]);
      if (resPrest.data && resPrest.data.length > 0) {
        const prestNorm = resPrest.data.map((p) => ({
          domicilio_base: 'Av. Moreno 37, San Rafael, Mendoza',
          codigo_postal_base: '5600',
          base_lat: -34.6158,
          base_lng: -68.3285,
          ...p,
        }));
        setPrestadores(prestNorm);
      }
      if (resChoferes && !resChoferes.error && Array.isArray(resChoferes.data) && resChoferes.data.length > 0) {
        setChoferes(resChoferes.data);
        localStorage.setItem('erquenci_choferes_v3', JSON.stringify(resChoferes.data));
      }
      if (resVeh.data && resVeh.data.length > 0) {
        const vehNorm = resVeh.data.map((v) => ({
          ...v,
          patente: v.patente === 'AE 842 KL' ? 'AB 635 BN' : v.patente,
          chofer_nombre: v.chofer_nombre === 'Martín Rodríguez' ? 'Matías Emanuel Gatica' : v.chofer_nombre,
          docs: normalizarDocsVehiculo(v.docs),
        }));
        setVehiculos(vehNorm);
        if (!resChoferes || resChoferes.error || !resChoferes.data || resChoferes.data.length === 0) {
          setChoferes((prev) =>
            prev.map((c, idx) =>
              idx === 0 && vehNorm[0]?.chofer_foto
                ? {
                    ...c,
                    nombre: vehNorm[0].chofer_nombre || c.nombre,
                    foto_url: vehNorm[0].chofer_foto,
                    licencia_venc: vehNorm[0].licencia_venc || c.licencia_venc,
                  }
                : c
            )
          );
        }
        setNuevoViaje((prev) => ({
          ...prev,
          vehiculo_id: vehNorm[0].id,
          prestador_id: vehNorm[0].prestador_id,
          chofer_id: vehNorm[0].chofer_id || prev.chofer_id,
        }));
      }
      if (resCentros.data && resCentros.data.length > 0) {
        const tieneRivadavia = resCentros.data.some((c) => (c.direccion || '').includes('340') || (c.nombre || '').includes('Rivadavia'));
        const listaCentros = resCentros.data.map((cm) => ({
          codigo_postal: '5600',
          ...cm,
        }));
        if (!tieneRivadavia) {
          listaCentros.unshift({
            id: 'cm-riv340',
            nombre: 'Fisiokinesio Terapia / Consultorios Rivadavia',
            direccion: 'Bernardino Rivadavia 340, San Rafael, Mendoza',
            codigo_postal: '5600',
            lat: -34.6152,
            lng: -68.3342,
          });
        }
        setCentrosMedicos(listaCentros);
      }
      if (resTarifas.data && resTarifas.data.length > 0) {
        setTarifasArt(
          resTarifas.data.map((t) => {
            if (t.nombre_art === 'Prevención ART') {
              return {
                valor_km: 656.85,
                valor_hora_espera: 5630.04,
                espera_desde_hora: 1,
                modo_facturacion_default: 'URBANO_TRAMOS_Y_KM_CP',
                regla_km: 'SOLO_IDA_PACIENTE',
                valor_tramo_1: 5630.04,
                valor_tramo_2: 11260.08,
                ...t,
              };
            }
            return {
              espera_desde_hora: 1,
              modo_facturacion_default: 'URBANO_TRAMOS_Y_KM_CP',
              regla_km: 'SOLO_IDA_PACIENTE',
              valor_tramo_1: 5630.04,
              valor_tramo_2: 11260.08,
              ...t,
            };
          })
        );
      }
      if (resTraslados.data) {
        const lista = resTraslados.data;
        setTraslados(lista);
        if (pacienteTokenUrl) {
          const encontrado = lista.find((t) => t.token_paciente === pacienteTokenUrl);
          if (encontrado) setViajeSeleccionadoId(encontrado.id);
        } else if (trasladoIdUrl) {
          const encontrado = lista.find((t) => String(t.id) === String(trasladoIdUrl));
          if (encontrado) setViajeSeleccionadoId(encontrado.id);
        } else if (choferIdUrl) {
          const delChofer = lista.find((t) => obtenerMetaTraslado(t).chofer_id === choferIdUrl);
          if (delChofer) setViajeSeleccionadoId(delChofer.id);
        } else if (lista.length > 0 && !viajeSeleccionadoId) {
          setViajeSeleccionadoId(lista[0].id);
        }
      }
    } catch (err) {
      console.error('Error sincronizando Supabase:', err);
    } finally {
      setSincronizandoDb(false);
    }
  };
  // Fusión silenciosa de cambios de traslados (sin parpadeo ni spinner)
  const aplicarCambioTrasladoEnEstado = (registro) => {
    if (!registro || !registro.id) return;
    setTraslados((prev) => {
      const existe = prev.some((t) => String(t.id) === String(registro.id));
      if (existe) {
        return prev.map((t) => (String(t.id) === String(registro.id) ? { ...t, ...registro } : t));
      }
      return [registro, ...prev];
    });
    setUltimaSyncVivo(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  };
  // Emitir evento instantáneo por Supabase Broadcast (<100ms entre Central, Chofer y Paciente)
  const emitirCambioEnVivo = (id, patch) => {
    if (liveChannelRef.current) {
      liveChannelRef.current.send({
        type: 'broadcast',
        event: 'traslado_sync',
        payload: { id, ...patch },
      });
    }
  };
  // Sincronización silenciosa de respaldo cada 3.5 segundos (ideal si falla el WebSocket en 4G)
  const sincronizarTrasladosSilencioso = async () => {
    try {
      const { data } = await supabase.from('traslados').select('*').order('created_at', { ascending: false });
      if (data) {
        setTraslados(data);
        setUltimaSyncVivo(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch (e) {
      console.warn('Sync silencioso:', e);
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
    // Canal 1: Postgres Changes (BD -> todos los clientes)
    const dbChannel = supabase
      .channel('traslados-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'traslados' }, (payload) => {
        if (payload.eventType === 'DELETE' && payload.old?.id) {
          setTraslados((prev) => prev.filter((t) => String(t.id) !== String(payload.old.id)));
        } else if (payload.new) {
          aplicarCambioTrasladoEnEstado(payload.new);
        } else {
          sincronizarTrasladosSilencioso();
        }
      })
      .subscribe();
    // Canal 2: Broadcast instantáneo (GPS en vivo, chat, firma y estados sin esperar refresh)
    const liveChannel = supabase
      .channel('erquenci-live-sync', { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'traslado_sync' }, ({ payload }) => {
        aplicarCambioTrasladoEnEstado(payload);
      })
      .subscribe();
    liveChannelRef.current = liveChannel;
    // Respaldo automático cada 3.5s
    const pollInterval = setInterval(() => {
      sincronizarTrasladosSilencioso();
    }, 3500);
    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(dbChannel);
      supabase.removeChannel(liveChannel);
      clearInterval(pollInterval);
      if (gpsWatchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(gpsWatchIdRef.current);
      }
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
  const copiarEnlacePortapapeles = (url, etiqueta) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    setLinkCopiadoMsg(`✓ Link de ${etiqueta} copiado: ${url}`);
    setTimeout(() => setLinkCopiadoMsg(''), 4500);
  };
  const procesarNuevaCoordenadaGps = async (lat, lng) => {
    const idActual = viajeActivoIdRef.current;
    if (!idActual) return;
    const ahoraMs = Date.now();
    if (ahoraMs - ultimoEnvioGpsRef.current < 2500) return;
    ultimoEnvioGpsRef.current = ahoraMs;
    const coords = {
      lat: +Number(lat).toFixed(6),
      lng: +Number(lng).toFixed(6),
      ts: ahoraMs,
    };
    setTraslados((prev) =>
      prev.map((t) => (t.id === idActual ? { ...t, coords_reales: coords } : t))
    );
    emitirCambioEnVivo(idActual, { coords_reales: coords });
    if (!String(idActual).startsWith('real-')) {
      await supabase.from('traslados').update({ coords_reales: coords }).eq('id', idActual);
    }
  };
  const detenerGpsRealDispositivo = async () => {
    const BgGeo = window.Capacitor?.Plugins?.BackgroundGeolocation;
    if (bgWatcherIdRef.current && BgGeo) {
      try {
        await BgGeo.removeWatcher({ id: bgWatcherIdRef.current });
      } catch (e) {}
      bgWatcherIdRef.current = null;
    }
    if (gpsWatchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(gpsWatchIdRef.current);
      gpsWatchIdRef.current = null;
    }
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch (e) {}
      wakeLockRef.current = null;
    }
    setGpsRealActivo(false);
  };
  const activarGpsRealDispositivo = async (silencioso = false) => {
    // 1. Si corre dentro del APK Android (Capacitor), usar GPS nativo en segundo plano (funciona con pantalla bloqueada)
    const BgGeo = window.Capacitor?.Plugins?.BackgroundGeolocation;
    if (BgGeo) {
      if (bgWatcherIdRef.current) {
        setGpsRealActivo(true);
        return;
      }
      try {
        setGpsRealActivo(true);
        const watcherId = await BgGeo.addWatcher(
          {
            backgroundTitle: 'Erquenci ART — Traslado en Curso',
            backgroundMessage: 'Transmitiendo ubicación GPS en tiempo real (podés bloquear la pantalla).',
            requestPermissions: true,
            stale: false,
            distanceFilter: 10,
          },
          (location, error) => {
            if (error) {
              if (error.code === 'NOT_AUTHORIZED' && !silencioso) {
                alert('Habilitá el permiso de ubicación "Permitir todo el tiempo" en Ajustes para usar con pantalla bloqueada.');
                BgGeo.openSettings?.();
              }
              return;
            }
            if (location) {
              procesarNuevaCoordenadaGps(location.latitude, location.longitude);
            }
          }
        );
        bgWatcherIdRef.current = watcherId;
        return;
      } catch (e) {
        console.warn('Fallback a GPS web:', e);
      }
    }
    // 2. Modo Navegador Web: Geolocation + Wake Lock (mantiene pantalla encendida)
    if (!navigator.geolocation) {
      if (!silencioso) alert('Tu navegador no soporta geolocalización GPS.');
      return;
    }
    if (gpsWatchIdRef.current !== null) {
      setGpsRealActivo(true);
      return;
    }
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      } catch (e) {
        console.warn('WakeLock no disponible:', e);
      }
    }
    setGpsRealActivo(true);
    gpsWatchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => procesarNuevaCoordenadaGps(pos.coords.latitude, pos.coords.longitude),
      (err) => {
        console.warn('Error GPS:', err);
        setGpsRealActivo(false);
        gpsWatchIdRef.current = null;
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
  };
  const leerArchivoBase64 = (file, cb) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const resultado = reader.result;
      if (file.type && file.type.startsWith('image/') && typeof resultado === 'string') {
        const img = new Image();
        img.onload = () => {
          const maxDim = 280;
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          cb(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.onerror = () => cb(resultado);
        img.src = resultado;
      } else {
        cb(resultado);
      }
    };
    reader.readAsDataURL(file);
  };
  const ubicarDomicilioEnMapa = async () => {
    if (!nuevoViaje.origen_direccion.trim()) return;
    setBuscandoGeo(true);
    const coords = await buscarCoordenadasDireccion(nuevoViaje.origen_direccion);
    setBuscandoGeo(false);
    if (coords) {
      setNuevoViaje((prev) => ({
        ...prev,
        origen_lat: coords.lat,
        origen_lng: coords.lng,
        cp_origen: coords.cp || prev.cp_origen,
      }));
      alert(
        `Ubicación encontrada:\nLat: ${coords.lat.toFixed(4)}, Lng: ${coords.lng.toFixed(4)}${
          coords.cp ? ` (CP: ${coords.cp})` : ''
        }`
      );
    } else {
      alert('No se encontró la altura exacta, se usará la coordenada urbana base.');
    }
  };
  // ============================================================================
  // ABM COMPLETO DE CENTROS MÉDICOS (AGREGAR, MODIFICAR Y ELIMINAR)
  // ============================================================================
  const guardarNuevoCentroMedico = async () => {
    if (!nuevoCentro.nombre.trim()) return;
    setBuscandoGeo(true);
    const coords = nuevoCentro.direccion ? await buscarCoordenadasDireccion(nuevoCentro.direccion) : null;
    setBuscandoGeo(false);
    const payloadBase = {
      nombre: nuevoCentro.nombre.trim(),
      direccion: nuevoCentro.direccion.trim(),
      lat: coords?.lat || -34.6152,
      lng: coords?.lng || -68.3342,
    };
    const payloadExt = {
      ...payloadBase,
      codigo_postal: nuevoCentro.codigo_postal || coords?.cp || '5600',
    };
    let { data, error } = await supabase.from('centros_medicos').insert([payloadExt]).select().single();
    if (error) {
      const retry = await supabase.from('centros_medicos').insert([payloadBase]).select().single();
      data = retry.data;
    }
    const registro = {
      id: data?.id || `cm-${Date.now()}`,
      ...payloadExt,
      ...(data || {}),
      codigo_postal: payloadExt.codigo_postal,
    };
    setCentrosMedicos([...centrosMedicos, registro]);
    const label = registro.direccion ? `${registro.nombre} (${registro.direccion})` : registro.nombre;
    setNuevoViaje({
      ...nuevoViaje,
      destino_nombre: label,
      cp_destino: registro.codigo_postal || '5600',
      destino_lat: registro.lat,
      destino_lng: registro.lng,
    });
    setNuevoCentro({ nombre: '', direccion: '', codigo_postal: '5600' });
    setMostrarFormCentro(false);
  };
  const guardarEdicionCentroMedico = async () => {
    if (!centroEditando || !centroEditando.nombre.trim()) return;
    setBuscandoGeo(true);
    const coords = centroEditando.direccion ? await buscarCoordenadasDireccion(centroEditando.direccion) : null;
    setBuscandoGeo(false);
    const patchBase = {
      nombre: centroEditando.nombre.trim(),
      direccion: (centroEditando.direccion || '').trim(),
      lat: coords?.lat || centroEditando.lat || -34.6152,
      lng: coords?.lng || centroEditando.lng || -68.3342,
    };
    const patchExt = {
      ...patchBase,
      codigo_postal: centroEditando.codigo_postal || '5600',
    };
    let { error } = await supabase.from('centros_medicos').update(patchExt).eq('id', centroEditando.id);
    if (error) {
      await supabase.from('centros_medicos').update(patchBase).eq('id', centroEditando.id);
    }
    setCentrosMedicos((prev) =>
      prev.map((cm) => (cm.id === centroEditando.id ? { ...cm, ...patchExt } : cm))
    );
    setCentroEditando(null);
  };
  const eliminarCentroMedico = async (cm) => {
    if (!window.confirm(`¿Confirmás eliminar el centro médico "${cm.nombre}"?`)) return;
    await supabase.from('centros_medicos').delete().eq('id', cm.id);
    setCentrosMedicos((prev) => prev.filter((item) => item.id !== cm.id));
  };
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError('Credenciales inválidas o usuario no registrado en Supabase Auth.');
  };
  const vehiculoEstaBloqueado = (v) => {
    const ch = obtenerChoferDeVehiculo(v);
    const licVencida = evaluarVencimiento(ch?.licencia_venc || v.licencia_venc).bloqueado;
    const docVencido = normalizarDocsVehiculo(v.docs).some((d) => evaluarVencimiento(d.vencimiento).bloqueado);
    return licVencida || docVencido;
  };
  // Filtrado de traslados en Torre de Control
  const trasladosFiltradosTorre = traslados.filter((t) => {
    const cond = obtenerMetaTraslado(t);
    const veh = vehiculos.find((v) => v.id === t.vehiculo_id);
    const ch = obtenerChoferDeTraslado(t);
    const texto = busquedaTorre.trim().toLowerCase();
    if (texto) {
      const matchTexto =
        (t.paciente_nombre || '').toLowerCase().includes(texto) ||
        (t.paciente_dni || '').toLowerCase().includes(texto) ||
        (t.numero_siniestro || '').toLowerCase().includes(texto) ||
        (t.origen_direccion || '').toLowerCase().includes(texto) ||
        (t.destino_nombre || '').toLowerCase().includes(texto) ||
        (veh?.patente || '').toLowerCase().includes(texto) ||
        (ch?.nombre || '').toLowerCase().includes(texto);
      if (!matchTexto) return false;
    }
    if (filtroArtTorre !== 'TODAS' && t.art_nombre !== filtroArtTorre) return false;
    if (filtroEstadoTorre === 'EN_CURSO') {
      if (t.estado === 'REALIZADO' || t.estado === 'FINALIZADO' || t.estado === 'CANCELADO') return false;
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
  const trasladosDelChoferActivo = choferIdUrl
    ? traslados.filter((t) => {
        const meta = obtenerMetaTraslado(t);
        const veh = vehiculos.find((v) => v.id === t.vehiculo_id);
        return meta.chofer_id === choferIdUrl || veh?.chofer_id === choferIdUrl;
      })
    : traslados;
  const viajeActivo =
    (pacienteTokenUrl ? traslados.find((t) => t.token_paciente === pacienteTokenUrl) : null) ||
    (trasladoIdUrl ? traslados.find((t) => String(t.id) === String(trasladoIdUrl)) : null) ||
    traslados.find((t) => t.id === viajeSeleccionadoId) ||
    (rolActivo === 'CHOFER' ? trasladosDelChoferActivo[0] : null) ||
    trasladosFiltradosTorre[0] ||
    traslados[0];
  viajeActivoIdRef.current = viajeActivo?.id || null;
  const vehiculoAsignado = vehiculos.find((v) => v.id === viajeActivo?.vehiculo_id) || vehiculos[0];
  const choferAsignadoViaje = obtenerChoferDeTraslado(viajeActivo);
  const prestadorAsignado = prestadores.find((p) => p.id === viajeActivo?.prestador_id) || prestadores[0];
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
    emitirCambioEnVivo(id, actualizacion);
    if (
      rolActivo === 'CHOFER' &&
      ['EN_CAMINO_DOMICILIO', 'EN_DOMICILIO', 'PACIENTE_A_BORDO'].includes(nuevoEstado) &&
      !gpsRealActivo
    ) {
      activarGpsRealDispositivo(true);
    }
    if (!String(id).startsWith('real-')) {
      await supabase.from('traslados').update(actualizacion).eq('id', id);
    }
  };
  // Recalcular liquidación en vivo con centavos exactos
  const actualizarLiquidacionViaje = async (id, cambios = {}) => {
    const actual = traslados.find((t) => t.id === id);
    if (!actual) return;
    const meta = obtenerMetaTraslado(actual);
    const esquemaNuevo = cambios.esquema_liquidacion ?? meta.esquema_liquidacion;
    const kmBaseOrig = Number(cambios.km_base_a_origen ?? meta.km_base_a_origen ?? 2.0);
    const kmOrigDest = Number(cambios.km_origen_a_destino ?? cambios.km_reales ?? actual.km_reales ?? 4.5);
    const kmDestBase = Number(cambios.km_destino_a_base ?? meta.km_destino_a_base ?? 3.5);
    const esperaTotal = Number(cambios.horas_espera ?? actual.horas_espera ?? 0);
    const desglose = calcularDesgloseLiquidacion({
      artNombre: actual.art_nombre,
      esquema: esquemaNuevo,
      modalidadViaje: actual.modalidad_viaje,
      kmBaseAOrigen: kmBaseOrig,
      kmOrigenADestino: kmOrigDest,
      kmDestinoABase: kmDestBase,
      horasEsperaTotal: esperaTotal,
    });
    const nuevoMeta = {
      ...meta,
      esquema_liquidacion: esquemaNuevo,
      km_base_a_origen: kmBaseOrig,
      km_origen_a_destino: kmOrigDest,
      km_destino_a_base: kmDestBase,
      horas_espera_facturables: desglose.horasEsperaFacturables,
    };
    const eventosActualizados = Array.isArray(actual.eventos) ? [...actual.eventos] : [];
    if (eventosActualizados.length > 0) {
      eventosActualizados[0] = { ...eventosActualizados[0], meta_condiciones: nuevoMeta };
    }
    const basePatch = {
      km_reales: kmOrigDest,
      horas_espera: esperaTotal,
      importe_total: desglose.importeTotal,
      eventos: eventosActualizados,
    };
    const extPatch = {
      ...basePatch,
      esquema_liquidacion: esquemaNuevo,
      km_base_a_origen: kmBaseOrig,
      km_origen_a_destino: kmOrigDest,
      km_destino_a_base: kmDestBase,
      horas_espera_facturables: desglose.horasEsperaFacturables,
      condiciones_traslado: nuevoMeta,
    };
    setTraslados((prev) => prev.map((t) => (t.id === id ? { ...t, ...extPatch } : t)));
    if (!String(id).startsWith('real-')) {
      let { error } = await supabase.from('traslados').update(extPatch).eq('id', id);
      if (error) {
        await supabase.from('traslados').update(basePatch).eq('id', id);
      }
    }
  };
  const eliminarTraslado = async (t, e) => {
    if (e) e.stopPropagation();
    const ok = window.confirm(
      `¿Confirmás eliminar el traslado de ${t.paciente_nombre} (Siniestro ${t.numero_siniestro} - ${t.fecha_programada})?`
    );
    if (!ok) return;
    if (!String(t.id).startsWith('real-')) {
      await supabase.from('traslados').delete().eq('id', t.id);
    }
    const restantes = traslados.filter((item) => item.id !== t.id);
    setTraslados(restantes);
    if (viajeSeleccionadoId === t.id) {
      setViajeSeleccionadoId(restantes[0]?.id || null);
    }
  };
  const abrirModalEdicion = (t, e) => {
    if (e) e.stopPropagation();
    const meta = obtenerMetaTraslado(t);
    setTrasladoEditando({
      ...t,
      ...meta,
    });
  };
  const guardarEdicionTraslado = async (e) => {
    e.preventDefault();
    if (!trasladoEditando) return;
    const ch = choferes.find((c) => c.id === trasladoEditando.chofer_id);
    const cambiaCp =
      String(trasladoEditando.cp_origen || '5600').trim() !== String(trasladoEditando.cp_base || '5600').trim() ||
      String(trasladoEditando.cp_destino || '5600').trim() !== String(trasladoEditando.cp_base || '5600').trim();
    const desglose = calcularDesgloseLiquidacion({
      artNombre: trasladoEditando.art_nombre,
      esquema: trasladoEditando.esquema_liquidacion || 'TRAMO_2_URBANO',
      modalidadViaje: trasladoEditando.modalidad_viaje,
      kmBaseAOrigen: trasladoEditando.km_base_a_origen || 2.0,
      kmOrigenADestino: trasladoEditando.km_reales || 4.5,
      kmDestinoABase: trasladoEditando.km_destino_a_base || 3.5,
      horasEsperaTotal: trasladoEditando.horas_espera || 0,
    });
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
      chofer_id: trasladoEditando.chofer_id || null,
      chofer_nombre_snap: ch?.nombre || trasladoEditando.chofer_nombre_snap || '',
      cp_base: trasladoEditando.cp_base || '5600',
      cp_origen: trasladoEditando.cp_origen || '5600',
      cp_destino: trasladoEditando.cp_destino || '5600',
      cambia_codigo_postal: cambiaCp,
      esquema_liquidacion: trasladoEditando.esquema_liquidacion || 'TRAMO_2_URBANO',
      km_base_a_origen: Number(trasladoEditando.km_base_a_origen || 2.0),
      km_origen_a_destino: Number(trasladoEditando.km_reales || 4.5),
      km_destino_a_base: Number(trasladoEditando.km_destino_a_base || 3.5),
      horas_espera_facturables: desglose.horasEsperaFacturables,
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
      importe_total: desglose.importeTotal,
      eventos: eventosPrevios,
    };
    const fullPatch = {
      ...basePatch,
      ...condicionesObj,
      condiciones_traslado: condicionesObj,
    };
    if (!String(trasladoEditando.id).startsWith('real-')) {
      let { error } = await supabase.from('traslados').update(fullPatch).eq('id', trasladoEditando.id);
      if (error) {
        await supabase.from('traslados').update(basePatch).eq('id', trasladoEditando.id);
      }
    }
    setTraslados((prev) =>
      prev.map((item) => (item.id === trasladoEditando.id ? { ...item, ...fullPatch } : item))
    );
    setTrasladoEditando(null);
  };
  const repetirTrasladoPaciente = (t, e) => {
    if (e) e.stopPropagation();
    const cond = obtenerMetaTraslado(t);
    setNuevoViaje({
      art_nombre: t.art_nombre || 'Prevención ART',
      modalidad_viaje: t.modalidad_viaje || 'IDA_VUELTA',
      paciente_nombre: t.paciente_nombre || '',
      paciente_dni: t.paciente_dni || '',
      paciente_telefono: t.paciente_telefono || '',
      numero_siniestro: t.numero_siniestro || '',
      origen_direccion: t.origen_direccion || '',
      cp_origen: cond.cp_origen || '5600',
      origen_lat: t.origen_lat || -34.6245,
      origen_lng: t.origen_lng || -68.3480,
      destino_nombre: t.destino_nombre || 'Fisiokinesio Terapia / Consultorios Rivadavia (Bernardino Rivadavia 340, San Rafael, Mendoza)',
      cp_destino: cond.cp_destino || '5600',
      destino_lat: t.destino_lat || -34.6152,
      destino_lng: t.destino_lng || -68.3342,
      orden_adjunta_url: t.orden_adjunta_url || '',
      prestador_id: t.prestador_id || prestadores[0]?.id,
      vehiculo_id: t.vehiculo_id || vehiculos[0]?.id,
      chofer_id: cond.chofer_id || choferes[0]?.id,
      fecha_programada: '2026-11-19',
      hora_programada: t.hora_programada || '11:30',
      esquema_liquidacion: cond.esquema_liquidacion || 'AUTO',
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
  const generarFechasRecurrentes = (fechaInicioStr, totalSesiones, patron) => {
    if (!esRecurrente || totalSesiones <= 1) return [fechaInicioStr];
    const fechas = [];
    const cursor = new Date(fechaInicioStr + 'T12:00:00');
    let guard = 0;
    while (fechas.length < totalSesiones && guard < 90) {
      const diaSemana = cursor.getDay();
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
  const crearNuevoTraslado = async (e) => {
    e.preventDefault();
    const veh = vehiculos.find((v) => v.id === nuevoViaje.vehiculo_id);
    const ch = choferes.find((c) => c.id === nuevoViaje.chofer_id) || obtenerChoferDeVehiculo(veh);
    const prest = prestadores.find((p) => p.id === nuevoViaje.prestador_id) || prestadores[0];
    if (veh && vehiculoEstaBloqueado(veh)) {
      alert('No se puede asignar un móvil con documentación vencida.');
      return;
    }
    if (ch && evaluarVencimiento(ch.licencia_venc).bloqueado) {
      alert(`No se puede asignar al chofer ${ch.nombre} porque su licencia está vencida (${ch.licencia_venc}).`);
      return;
    }
    const baseLat = prest?.base_lat || -34.6158;
    const baseLng = prest?.base_lng || -68.3285;
    const cpBase = String(prest?.codigo_postal_base || '5600').trim();
    const cpOrigen = String(nuevoViaje.cp_origen || '5600').trim();
    const cpDestino = String(nuevoViaje.cp_destino || '5600').trim();
    const cambiaCp = cpOrigen !== cpBase || cpDestino !== cpBase;
    const kmBaseAOrigen = calcularDistanciaKm(baseLat, baseLng, nuevoViaje.origen_lat, nuevoViaje.origen_lng);
    const kmOrigenADestino = calcularDistanciaKm(
      nuevoViaje.origen_lat,
      nuevoViaje.origen_lng,
      nuevoViaje.destino_lat,
      nuevoViaje.destino_lng
    );
    const kmDestinoABase = calcularDistanciaKm(nuevoViaje.destino_lat, nuevoViaje.destino_lng, baseLat, baseLng);
    const esquemaEfectivo =
      nuevoViaje.esquema_liquidacion === 'AUTO'
        ? resolverEsquemaAutomatico(
            nuevoViaje.art_nombre,
            nuevoViaje.modalidad_viaje,
            cpBase,
            cpOrigen,
            cpDestino
          )
        : nuevoViaje.esquema_liquidacion;
    const desglose = calcularDesgloseLiquidacion({
      artNombre: nuevoViaje.art_nombre,
      esquema: esquemaEfectivo,
      modalidadViaje: nuevoViaje.modalidad_viaje,
      kmBaseAOrigen,
      kmOrigenADestino,
      kmDestinoABase,
      horasEsperaTotal: 0,
    });
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
      chofer_id: ch?.id || null,
      chofer_nombre_snap: ch?.nombre || '',
      cp_base: cpBase,
      cp_origen: cpOrigen,
      cp_destino: cpDestino,
      cambia_codigo_postal: cambiaCp,
      esquema_liquidacion: esquemaEfectivo,
      km_base_a_origen: kmBaseAOrigen,
      km_origen_a_destino: kmOrigenADestino,
      km_destino_a_base: kmDestinoABase,
      horas_espera_facturables: 0,
    };
    const fechasProgramadas = generarFechasRecurrentes(
      nuevoViaje.fecha_programada || '2026-11-19',
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
      km_reales: kmOrigenADestino,
      horas_espera: 0,
      importe_total: desglose.importeTotal,
      gps_progreso: 10,
      eventos: [
        {
          hora: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
          estado: 'ASIGNADO',
          detalle: `Orden emitida (${nuevoViaje.art_nombre}) • Chofer: ${ch?.nombre || 'Asignado'} • ${desglose.descripcionCalculo}`,
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
      const listaRedondeada = listaBase.map((x) => ({ ...x, importe_total: Math.round(x.importe_total) }));
      const retry = await supabase.from('traslados').insert(listaRedondeada).select();
      data = retry.data;
      error = retry.error;
    }
    if (error) {
      alert('Error al guardar traslado en Supabase: ' + error.message);
      return;
    }
    const insertados = (data || []).map((row) => ({
      ...row,
      importe_total: desglose.importeTotal,
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
  // ============================================================================
  // LINKS DE ACCESO INDEPENDIENTE (PACIENTE Y CHOFER) + ENVÍO POR WHATSAPP
  // ============================================================================
  const construirUrlPaciente = (t) => {
    if (t?.token_paciente) return `${window.location.origin}/?token=${t.token_paciente}`;
    return `${window.location.origin}/?modo=paciente&traslado=${t?.id}`;
  };
  const construirUrlChoferViaje = (t) => {
    const ch = obtenerChoferDeTraslado(t);
    const chParam = ch?.id ? `&chofer=${ch.id}` : '';
    return `${window.location.origin}/?modo=chofer&traslado=${t?.id}${chParam}`;
  };
  const construirUrlPortalChofer = (choferId) => {
    return `${window.location.origin}/?modo=chofer&chofer=${choferId}`;
  };
  const enviarWhatsAppPaciente = (t) => {
    const veh = vehiculos.find((v) => v.id === t.vehiculo_id) || vehiculos[0];
    const ch = obtenerChoferDeTraslado(t);
    const urlSeguimiento = construirUrlPaciente(t);
    const telLimpio = (t.paciente_telefono || '').replace(/\D/g, '');
    const telArg = telLimpio.startsWith('54') ? telLimpio : `549${telLimpio}`;
    const resumenCond = resumirCondicionesTexto(t);
    const mensaje = encodeURIComponent(
      `Hola ${t.paciente_nombre}, te saludamos de *Erquenci Traslados ART*.\n\n` +
        `Tu traslado (${t.numero_siniestro}) para el *${t.fecha_programada} a las ${t.hora_programada || ''} hs* hacia *${t.destino_nombre}* ya está asignado:\n` +
        `• *Chofer:* ${ch?.nombre || 'Matías Emanuel Gatica'}\n` +
        `• *Vehículo:* ${veh?.modelo || 'Peugeot 408'} (Patente *${veh?.patente || 'AB 635 BN'}*)\n` +
        `• *Detalle:* ${resumenCond}\n\n` +
        `Seguí el móvil en tiempo real por GPS desde tu acceso exclusivo:\n${urlSeguimiento}`
    );
    window.open(`https://wa.me/${telArg}?text=${mensaje}`, '_blank');
  };
  const enviarWhatsAppChofer = (t) => {
    const veh = vehiculos.find((v) => v.id === t.vehiculo_id) || vehiculos[0];
    const ch = obtenerChoferDeTraslado(t);
    const urlChofer = construirUrlChoferViaje(t);
    const telLimpio = (ch?.telefono || '').replace(/\D/g, '');
    const telArg = telLimpio ? (telLimpio.startsWith('54') ? telLimpio : `549${telLimpio}`) : '';
    const resumenCond = resumirCondicionesTexto(t);
    const mensaje = encodeURIComponent(
      `Hola *${ch?.nombre || 'Matías'}*, tenés una orden asignada en *Erquenci ART*:\n\n` +
        `• *Fecha/Hora:* ${t.fecha_programada} - ${t.hora_programada || ''} hs\n` +
        `• *ART / Siniestro:* ${t.art_nombre} (${t.numero_siniestro})\n` +
        `• *Paciente:* ${t.paciente_nombre} (Tel: ${t.paciente_telefono})\n` +
        `• *Retirar en:* ${t.origen_direccion}\n` +
        `• *Destino:* ${t.destino_nombre}\n` +
        `• *Móvil:* ${veh?.patente || 'AB 635 BN'} (${veh?.modelo || 'Peugeot 408'})\n` +
        `• *Condiciones del Paciente:* ${resumenCond}\n\n` +
        `Abrí tu Terminal Móvil de Chofer (GPS, estados y firma digital) acá:\n${urlChofer}`
    );
    window.open(`https://wa.me/${telArg}?text=${mensaje}`, '_blank');
  };
  // ============================================================================
  // EXPORTACIÓN EXCEL (.CSV) Y PDF AUDITADO CON CENTAVOS EXACTOS
  // ============================================================================
  const exportarExcelLiquidacion = () => {
    const filtrados =
      filtroArtLiquidacion === 'TODAS'
        ? traslados
        : traslados.filter((t) => t.art_nombre === filtroArtLiquidacion);
    const encabezados = [
      'Fecha',
      'Hora',
      'ART',
      'Siniestro / Autorizacion',
      'Paciente',
      'DNI',
      'Esquema Liquidacion',
      'CP Base',
      'CP Origen',
      'CP Destino',
      'Cambia CP',
      'KM Facturables',
      'Horas Espera Total',
      'Horas Espera Facturables',
      'Condicion Paciente',
      'Acompanante',
      'Muletas / Silla de Ruedas',
      'Patente',
      'Chofer',
      'Estado',
      'Importe Total ($)',
    ];
    const filas = filtrados.map((t) => {
      const veh = vehiculos.find((v) => v.id === t.vehiculo_id) || vehiculos[0];
      const ch = obtenerChoferDeTraslado(t);
      const meta = obtenerMetaTraslado(t);
      const desglose = calcularDesgloseLiquidacion({
        artNombre: t.art_nombre,
        esquema: meta.esquema_liquidacion,
        modalidadViaje: t.modalidad_viaje,
        kmBaseAOrigen: meta.km_base_a_origen,
        kmOrigenADestino: t.km_reales || meta.km_origen_a_destino,
        kmDestinoABase: meta.km_destino_a_base,
        horasEsperaTotal: t.horas_espera || 0,
      });
      return [
        t.fecha_programada,
        t.hora_programada || '',
        t.art_nombre,
        `"${t.numero_siniestro || ''}"`,
        `"${t.paciente_nombre || ''}"`,
        t.paciente_dni,
        `"${ESQUEMAS_LIQUIDACION_LABELS[meta.esquema_liquidacion] || meta.esquema_liquidacion}"`,
        meta.cp_base,
        meta.cp_origen,
        meta.cp_destino,
        meta.cambia_codigo_postal ? 'SI' : 'NO',
        desglose.kmFacturables,
        t.horas_espera || 0,
        desglose.horasEsperaFacturables,
        `"${CONDICIONES_PACIENTE_LABELS[meta.condicion_paciente] || meta.condicion_paciente}"`,
        `"${meta.lleva_acompanante ? `SI (${meta.acompanante_detalle || 'Autorizado'})` : 'NO'}"`,
        `"${meta.lleva_silla_ruedas ? ELEMENTOS_ORTOPEDICOS_LABELS[meta.elemento_ortopedico] || 'SI' : 'NO'}"`,
        veh?.patente || 'AB 635 BN',
        `"${ch?.nombre || 'Matías Emanuel Gatica'}"`,
        t.estado,
        formatearMoneda(t.importe_total || desglose.importeTotal),
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
  const descargarPdfLiquidacion = (t) => {
    const doc = new jsPDF();
    const veh = vehiculos.find((v) => v.id === t.vehiculo_id) || vehiculos[0];
    const ch = obtenerChoferDeTraslado(t);
    const prest = prestadores.find((p) => p.id === t.prestador_id) || prestadores[0];
    const cond = obtenerMetaTraslado(t);
    const desglose = calcularDesgloseLiquidacion({
      artNombre: t.art_nombre,
      esquema: cond.esquema_liquidacion,
      modalidadViaje: t.modalidad_viaje,
      kmBaseAOrigen: cond.km_base_a_origen,
      kmOrigenADestino: t.km_reales || cond.km_origen_a_destino,
      kmDestinoABase: cond.km_destino_a_base,
      horasEsperaTotal: t.horas_espera || 0,
    });
    doc.setFillColor(30, 88, 141);
    doc.rect(0, 0, 210, 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('ERQUENCI ART — COMPROBANTE DE TRASLADO AUDITADO', 14, 18);
    doc.setFontSize(10);
    doc.text(`Aseguradora: ${t.art_nombre} | Esquema: ${ESQUEMAS_LIQUIDACION_LABELS[cond.esquema_liquidacion] || cond.esquema_liquidacion}`, 14, 26);
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10.5);
    doc.text(`N° Siniestro / Autorización: ${t.numero_siniestro} | Fecha y Hora: ${t.fecha_programada} - ${t.hora_programada || ''} hs`, 14, 41);
    doc.text(`Paciente: ${t.paciente_nombre} (DNI: ${t.paciente_dni} | Tel: ${t.paciente_telefono})`, 14, 48);
    doc.text(`Base Operativa (Inicio Odómetro): ${prest?.domicilio_base || 'Av. Moreno 37, San Rafael'} (CP ${cond.cp_base})`, 14, 55);
    doc.text(`Origen Paciente: ${t.origen_direccion} (CP ${cond.cp_origen})`, 14, 62);
    doc.text(`Destino Médico: ${t.destino_nombre} (CP ${cond.cp_destino})`, 14, 69);
    doc.setFillColor(241, 245, 249);
    doc.rect(14, 74, 182, 26, 'F');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 88, 141);
    doc.text('CONDICIONES CLÍNICAS Y REQUERIMIENTOS DEL TRASLADO:', 17, 80);
    doc.setTextColor(30, 41, 59);
    doc.text(
      `• Condición: ${CONDICIONES_PACIENTE_LABELS[cond.condicion_paciente] || cond.condicion_paciente} | Acompañante: ${
        cond.lleva_acompanante ? `SÍ (${cond.acompanante_detalle || 'Autorizado'})` : 'NO'
      }`,
      17,
      86
    );
    doc.text(
      `• Elementos / Ortopedia: ${
        cond.lleva_silla_ruedas ? ELEMENTOS_ORTOPEDICOS_LABELS[cond.elemento_ortopedico] || 'SÍ' : 'NO'
      } | Peso: ${cond.peso_paciente_kg ? `${cond.peso_paciente_kg} kg` : 'Estándar'} | Unidad: ${
        TIPOS_VEHICULO_ESPECIAL_LABELS[cond.tipo_vehiculo_especial] || 'Estándar'
      }`,
      17,
      92
    );
    if (cond.observaciones_traslado) {
      doc.text(`• Detalle: ${cond.observaciones_traslado.slice(0, 95)}`, 17, 98);
    }
    doc.line(14, 104, 196, 104);
    doc.setFontSize(10);
    doc.text(`Prestador: ${prest?.razon_social || 'Erquenci S.A.S.'} (CUIT: ${prest?.cuit || '30-71792870-5'})`, 14, 111);
    doc.text(`Móvil Asignado: ${veh?.modelo || 'Peugeot 408'} (Patente ${veh?.patente || 'AB 635 BN'}) | Chofer: ${ch?.nombre || 'Matías Emanuel Gatica'}`, 14, 118);
    doc.text(`Recorrido: ${desglose.descripcionCalculo}`, 14, 125);
    doc.text(
      `Espera Total: ${t.horas_espera || 0} hs (Franquicia ART: ${desglose.franquiciaEspera} hs -> Facturable: ${desglose.horasEsperaFacturables} hs = $${formatearMoneda(desglose.importeEspera)})`,
      14,
      132
    );
    doc.setFontSize(12);
    doc.text(`IMPORTE TOTAL LIQUIDACIÓN ART: $${formatearMoneda(t.importe_total || desglose.importeTotal)}`, 14, 141);
    doc.setFontSize(10);
    doc.text('Trazabilidad Horaria:', 14, 151);
    (t.eventos || []).forEach((ev, idx) => {
      doc.setFontSize(8.5);
      doc.text(`• [${ev.hora}] ${ev.estado}: ${(ev.detalle || '').slice(0, 90)}`, 16, 157 + idx * 5.5);
    });
    if (t.firma_url) {
      doc.setFontSize(10);
      doc.text('Conformidad Digital del Paciente:', 14, 188);
      doc.addImage(t.firma_url, 'PNG', 14, 192, 70, 26);
    }
    doc.save(`Liquidacion_${t.art_nombre}_${t.paciente_nombre}.pdf`);
  };
  const enviarMensajeChat = async (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || !viajeActivo) return;
    const remitente =
      rolActivo === 'PACIENTE' ? viajeActivo.paciente_nombre : choferAsignadoViaje?.nombre || 'Central ART';
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
    emitirCambioEnVivo(viajeActivo.id, { chat_mensajes: listaActualizada });
    setNuevoMensaje('');
    if (!String(viajeActivo.id).startsWith('real-')) {
      await supabase.from('traslados').update({ chat_mensajes: listaActualizada }).eq('id', viajeActivo.id);
    }
  };
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
      acc[clave].total_importe = +(acc[clave].total_importe + Number(t.importe_total || 0)).toFixed(2);
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
  // ============================================================================
  // ABM DE CHOFERES, VEHÍCULOS Y PRESTADORES
  // ============================================================================
  const guardarNuevoChofer = async (e) => {
    e.preventDefault();
    const payload = {
      prestador_id: nuevoChofer.prestador_id,
      vehiculo_habitual_id: nuevoChofer.vehiculo_habitual_id || null,
      nombre: nuevoChofer.nombre.trim(),
      dni: nuevoChofer.dni.trim(),
      telefono: nuevoChofer.telefono.trim(),
      foto_url:
        nuevoChofer.foto_url ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
      licencia_venc: nuevoChofer.licencia_venc,
    };
    const { data, error } = await supabase.from('choferes').insert([payload]).select().single();
    const registro = data || { id: `ch-${Date.now()}`, ...payload };
    if (error) console.warn('Guardado local de chofer:', error.message);
    const nuevaLista = [...choferes, registro];
    setChoferes(nuevaLista);
    localStorage.setItem('erquenci_choferes_v3', JSON.stringify(nuevaLista));
    if (registro.vehiculo_habitual_id) {
      await asignarChoferAVehiculo(registro.vehiculo_habitual_id, registro.id, nuevaLista);
    }
    setNuevoChofer({
      ...nuevoChofer,
      nombre: '',
      dni: '',
      telefono: '',
      foto_url: '',
    });
  };
  const guardarEdicionChofer = async (e) => {
    e.preventDefault();
    if (!choferEditando) return;
    const patch = {
      prestador_id: choferEditando.prestador_id,
      vehiculo_habitual_id: choferEditando.vehiculo_habitual_id || null,
      nombre: choferEditando.nombre,
      dni: choferEditando.dni,
      telefono: choferEditando.telefono,
      foto_url: choferEditando.foto_url,
      licencia_venc: choferEditando.licencia_venc,
    };
    const { data: chUpdated } = await supabase.from('choferes').update(patch).eq('id', choferEditando.id).select();
    if (!chUpdated || chUpdated.length === 0) {
      await supabase.from('choferes').insert([patch]).select();
    }
    const nuevaLista = choferes.map((c) => (c.id === choferEditando.id ? { ...c, ...patch } : c));
    setChoferes(nuevaLista);
    localStorage.setItem('erquenci_choferes_v3', JSON.stringify(nuevaLista));
    // Persistir la foto y datos actualizados del chofer también en los vehículos de Supabase para que el Paciente la vea en cualquier celular
    const vehiculosAfectados = vehiculos.filter(
      (v) =>
        v.chofer_id === choferEditando.id ||
        v.id === choferEditando.vehiculo_habitual_id ||
        v.chofer_nombre === choferEditando.nombre ||
        vehiculos.length === 1
    );
    for (const v of vehiculosAfectados) {
      await supabase
        .from('vehiculos')
        .update({
          chofer_nombre: choferEditando.nombre,
          chofer_foto: choferEditando.foto_url,
          licencia_venc: choferEditando.licencia_venc,
        })
        .eq('id', v.id);
    }
    setVehiculos((prev) =>
      prev.map((v) =>
        vehiculosAfectados.some((af) => af.id === v.id)
          ? {
              ...v,
              chofer_nombre: choferEditando.nombre,
              chofer_foto: choferEditando.foto_url,
              licencia_venc: choferEditando.licencia_venc,
            }
          : v
      )
    );
    setChoferEditando(null);
  };
  const eliminarChofer = async (ch) => {
    if (!window.confirm(`¿Confirmás dar de baja / eliminar al chofer "${ch.nombre}"?`)) return;
    await supabase.from('choferes').delete().eq('id', ch.id);
    const nuevaLista = choferes.filter((c) => c.id !== ch.id);
    setChoferes(nuevaLista);
    localStorage.setItem('erquenci_choferes_v3', JSON.stringify(nuevaLista));
  };
  const asignarChoferAVehiculo = async (vehiculoId, nuevoChoferId, listaChoferesRef = choferes) => {
    const ch = listaChoferesRef.find((c) => c.id === nuevoChoferId);
    if (!ch) return;
    const patchBase = {
      chofer_nombre: ch.nombre,
      chofer_foto: ch.foto_url,
      licencia_venc: ch.licencia_venc,
    };
    const patchExt = {
      ...patchBase,
      chofer_id: ch.id,
    };
    setVehiculos((prev) => prev.map((v) => (v.id === vehiculoId ? { ...v, ...patchExt } : v)));
    let { error } = await supabase.from('vehiculos').update(patchExt).eq('id', vehiculoId);
    if (error) {
      await supabase.from('vehiculos').update(patchBase).eq('id', vehiculoId);
    }
  };
  const guardarEdicionVehiculo = async (e) => {
    e.preventDefault();
    if (!vehiculoEditando) return;
    const ch = choferes.find((c) => c.id === vehiculoEditando.chofer_id) || obtenerChoferDeVehiculo(vehiculoEditando);
    const docsActualizados = [
      { tipo: 'SEGURO', vencimiento: vehiculoEditando.seguro_venc },
      { tipo: 'HABILITACION_TRANSPORTE', vencimiento: vehiculoEditando.hab_venc },
      { tipo: 'RTO', vencimiento: vehiculoEditando.rto_venc },
      { tipo: 'MATAFUEGOS', vencimiento: vehiculoEditando.matafuegos_venc },
      { tipo: 'DESINFECCION', vencimiento: vehiculoEditando.desinfeccion_venc },
    ];
    const patchBase = {
      prestador_id: vehiculoEditando.prestador_id,
      patente: vehiculoEditando.patente.toUpperCase(),
      modelo: vehiculoEditando.modelo,
      tipo_movilidad: vehiculoEditando.tipo_movilidad,
      chofer_nombre: ch?.nombre || vehiculoEditando.chofer_nombre,
      chofer_foto: ch?.foto_url || vehiculoEditando.chofer_foto,
      licencia_venc: ch?.licencia_venc || vehiculoEditando.licencia_venc,
      docs: docsActualizados,
    };
    const patchExt = {
      ...patchBase,
      chofer_id: ch?.id || null,
    };
    let { error } = await supabase.from('vehiculos').update(patchExt).eq('id', vehiculoEditando.id);
    if (error) {
      await supabase.from('vehiculos').update(patchBase).eq('id', vehiculoEditando.id);
    }
    setVehiculos((prev) =>
      prev.map((v) => (v.id === vehiculoEditando.id ? { ...v, ...patchExt } : v))
    );
    setVehiculoEditando(null);
  };
  const eliminarVehiculo = async (v) => {
    if (!window.confirm(`¿Confirmás eliminar el vehículo ${v.patente} (${v.modelo}) de la flota?`)) return;
    await supabase.from('vehiculos').delete().eq('id', v.id);
    setVehiculos((prev) => prev.filter((item) => item.id !== v.id));
  };
  const guardarEdicionPrestador = async (e) => {
    e.preventDefault();
    if (!prestadorEditando) return;
    const patchBase = {
      razon_social: prestadorEditando.razon_social,
      cuit: prestadorEditando.cuit,
      zona_cobertura: prestadorEditando.zona_cobertura,
      telefono_guardia: prestadorEditando.telefono_guardia,
    };
    const patchExt = {
      ...patchBase,
      domicilio_base: prestadorEditando.domicilio_base,
      codigo_postal_base: prestadorEditando.codigo_postal_base || '5600',
      base_lat: prestadorEditando.base_lat || -34.6158,
      base_lng: prestadorEditando.base_lng || -68.3285,
    };
    let { error } = await supabase.from('prestadores').update(patchExt).eq('id', prestadorEditando.id);
    if (error) {
      await supabase.from('prestadores').update(patchBase).eq('id', prestadorEditando.id);
    }
    setPrestadores((prev) =>
      prev.map((p) => (p.id === prestadorEditando.id ? { ...p, ...patchExt } : p))
    );
    setPrestadorEditando(null);
  };
  const eliminarPrestador = async (p) => {
    if (!window.confirm(`¿Confirmás eliminar al prestador "${p.razon_social}"?`)) return;
    await supabase.from('prestadores').delete().eq('id', p.id);
    setPrestadores((prev) => prev.filter((item) => item.id !== p.id));
  };
  const actualizarCampoTarifaArt = async (nombreArt, campo, valor) => {
    const nuevas = tarifasArt.map((item) =>
      item.nombre_art === nombreArt ? { ...item, [campo]: valor } : item
    );
    setTarifasArt(nuevas);
    const mapa = {};
    nuevas.forEach((t) => {
      mapa[t.nombre_art] = t;
    });
    localStorage.setItem('erquenci_tarifas_v3', JSON.stringify(mapa));
    await supabase.from('tarifas_art').update({ [campo]: valor }).eq('nombre_art', nombreArt);
  };
  const guardarMapaTarifasLocal = (lista) => {
    const mapa = {};
    lista.forEach((t) => {
      mapa[t.nombre_art] = t;
    });
    localStorage.setItem('erquenci_tarifas_v3', JSON.stringify(mapa));
  };
  const abrirNuevaArt = () => {
    setArtEditandoNombre(null);
    setFormArt({
      nombre_art: '',
      valor_tramo_1: 5630.04,
      valor_tramo_2: 11260.08,
      valor_km: 656.85,
      bajada_bandera: 0,
      valor_hora_espera: 5630.04,
      espera_desde_hora: 1,
      modo_facturacion_default: 'URBANO_TRAMOS_Y_KM_CP',
      regla_km: 'SOLO_IDA_PACIENTE',
    });
    setMostrarFormArt(true);
  };
  const abrirEditarArt = (tar) => {
    setArtEditandoNombre(tar.nombre_art);
    setFormArt({
      nombre_art: tar.nombre_art || '',
      valor_tramo_1: Number(tar.valor_tramo_1 ?? 5630.04),
      valor_tramo_2: Number(tar.valor_tramo_2 ?? 11260.08),
      valor_km: Number(tar.valor_km ?? 656.85),
      bajada_bandera: Number(tar.bajada_bandera ?? 0),
      valor_hora_espera: Number(tar.valor_hora_espera ?? 5630.04),
      espera_desde_hora: Number(tar.espera_desde_hora ?? 1),
      modo_facturacion_default: tar.modo_facturacion_default || 'URBANO_TRAMOS_Y_KM_CP',
      regla_km: tar.regla_km || 'SOLO_IDA_PACIENTE',
    });
    setMostrarFormArt(true);
  };
  const guardarArt = async (e) => {
    e.preventDefault();
    const nombreLimpio = (formArt.nombre_art || '').trim();
    if (!nombreLimpio) return alert('Ingresá el nombre de la ART.');
    const existeDuplicada = tarifasArt.some(
      (t) =>
        t.nombre_art.toLowerCase() === nombreLimpio.toLowerCase() &&
        t.nombre_art !== artEditandoNombre
    );
    if (existeDuplicada) {
      return alert(`Ya existe una ART llamada "${nombreLimpio}".`);
    }
    const payload = {
      nombre_art: nombreLimpio,
      valor_tramo_1: Number(formArt.valor_tramo_1 || 0),
      valor_tramo_2: Number(formArt.valor_tramo_2 || 0),
      valor_km: Number(formArt.valor_km || 0),
      bajada_bandera: Number(formArt.bajada_bandera || 0),
      valor_hora_espera: Number(formArt.valor_hora_espera || 0),
      espera_desde_hora: Number(formArt.espera_desde_hora ?? 1),
      modo_facturacion_default: formArt.modo_facturacion_default || 'URBANO_TRAMOS_Y_KM_CP',
      regla_km: formArt.regla_km || 'SOLO_IDA_PACIENTE',
    };
    if (artEditandoNombre) {
      const nuevas = tarifasArt.map((t) =>
        t.nombre_art === artEditandoNombre ? { ...t, ...payload } : t
      );
      setTarifasArt(nuevas);
      guardarMapaTarifasLocal(nuevas);
      await supabase.from('tarifas_art').update(payload).eq('nombre_art', artEditandoNombre);
    } else {
      const nuevaLocal = { id: 't-' + Date.now(), ...payload };
      const { data, error } = await supabase
        .from('tarifas_art')
        .insert([payload])
        .select();
      const creada = data && data[0] ? data[0] : nuevaLocal;
      if (error) {
        console.warn('No se pudo insertar ART en Supabase (se guarda local):', error.message);
      }
      const nuevas = [...tarifasArt, creada];
      setTarifasArt(nuevas);
      guardarMapaTarifasLocal(nuevas);
    }
    setMostrarFormArt(false);
    setArtEditandoNombre(null);
  };
  const eliminarArt = async (tar) => {
    if (tarifasArt.length <= 1) {
      return alert('Debe quedar al menos una ART activa en el sistema.');
    }
    if (!window.confirm(`¿Confirmás eliminar la ART "${tar.nombre_art}" y su tarifario?`)) return;
    const nuevas = tarifasArt.filter((t) => t.nombre_art !== tar.nombre_art);
    setTarifasArt(nuevas);
    guardarMapaTarifasLocal(nuevas);
    await supabase.from('tarifas_art').delete().eq('nombre_art', tar.nombre_art);
  };
  // PANTALLA DE LOGIN REAL
  if (!modoDemo && !session && !esAccesoExclusivoPaciente && !esAccesoExclusivoChofer) {
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
  const totalFacturarFiltrado = +trasladosLiquidacion
    .reduce((acc, t) => acc + Number(t.importe_total || 0), 0)
    .toFixed(2);
  // Vista previa en vivo del cálculo tarifario al derivar un nuevo traslado
  const prestadorFormViaje = prestadores.find((p) => p.id === nuevoViaje.prestador_id) || prestadores[0];
  const cpBaseForm = String(prestadorFormViaje?.codigo_postal_base || '5600').trim();
  const kmBaseOrigForm = calcularDistanciaKm(
    prestadorFormViaje?.base_lat || -34.6158,
    prestadorFormViaje?.base_lng || -68.3285,
    nuevoViaje.origen_lat,
    nuevoViaje.origen_lng
  );
  const kmOrigDestForm = calcularDistanciaKm(
    nuevoViaje.origen_lat,
    nuevoViaje.origen_lng,
    nuevoViaje.destino_lat,
    nuevoViaje.destino_lng
  );
  const kmDestBaseForm = calcularDistanciaKm(
    nuevoViaje.destino_lat,
    nuevoViaje.destino_lng,
    prestadorFormViaje?.base_lat || -34.6158,
    prestadorFormViaje?.base_lng || -68.3285
  );
  const esquemaPreviewForm =
    nuevoViaje.esquema_liquidacion === 'AUTO'
      ? resolverEsquemaAutomatico(
          nuevoViaje.art_nombre,
          nuevoViaje.modalidad_viaje,
          cpBaseForm,
          nuevoViaje.cp_origen,
          nuevoViaje.cp_destino
        )
      : nuevoViaje.esquema_liquidacion;
  const desglosePreviewForm = calcularDesgloseLiquidacion({
    artNombre: nuevoViaje.art_nombre,
    esquema: esquemaPreviewForm,
    modalidadViaje: nuevoViaje.modalidad_viaje,
    kmBaseAOrigen: kmBaseOrigForm,
    kmOrigenADestino: kmOrigDestForm,
    kmDestinoABase: kmDestBaseForm,
    horasEsperaTotal: 0,
  });
  const hayTrasladosLocalesSinImpactar = false;
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <style>{`
        @keyframes erqTabEnter {
          0% { opacity: 0; transform: translateY(10px) scale(0.995); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes erqTopBar {
          0% { width: 0%; opacity: 1; }
          65% { width: 82%; opacity: 1; }
          100% { width: 100%; opacity: 0; }
        }
        @keyframes erqSplashBar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(0%); }
        }
        .animate-erq-tab-enter {
          animation: erqTabEnter 280ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .animate-erq-top-bar {
          animation: erqTopBar 440ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .animate-erq-splash-bar {
          animation: erqSplashBar 750ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>
      {/* BARRA DE PROGRESO SUPERIOR AL CAMBIAR DE PESTAÑA O VISTA */}
      {barraCargaTab && (
        <div className="fixed top-0 left-0 right-0 h-[3px] z-[60] pointer-events-none bg-transparent">
          <div className="h-full bg-gradient-to-r from-[#34B37B] via-[#268786] to-[#1E588D] animate-erq-top-bar shadow-[0_0_8px_rgba(52,179,123,0.7)]" />
        </div>
      )}
      {/* SPLASH SCREEN PROFESIONAL AL ABRIR LA PÁGINA */}
      {splashEstado !== 'OCULTO' && (
        <div
          className={`fixed inset-0 z-[70] flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-[#0f2942] to-[#103b38] text-white transition-opacity duration-400 ${
            splashEstado === 'SALIENDO' ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div className="flex flex-col items-center gap-4 px-6 text-center">
            <div className="bg-white/95 px-6 py-4 rounded-2xl shadow-2xl border border-white/20">
              <ErquenciLogo subtitle="Plataforma Operativa ART" />
            </div>
            <div className="w-56 h-1.5 bg-white/15 rounded-full overflow-hidden mt-2">
              <div className="w-full h-full bg-gradient-to-r from-[#34B37B] to-[#38bdf8] rounded-full animate-erq-splash-bar" />
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200/90 tracking-wide">
              <span className="w-2 h-2 rounded-full bg-[#34B37B] animate-ping" />
              <span>Sincronizando Torre de Control y GPS en vivo...</span>
            </div>
          </div>
        </div>
      )}
      {linkCopiadoMsg && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-bold flex items-center gap-2 border border-[#34B37B]">
          <CheckCircle2 className="w-4 h-4 text-[#34B37B]" />
          <span>{linkCopiadoMsg}</span>
        </div>
      )}
      {/* BARRA SUPERIOR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <ErquenciLogo
            subtitle={
              esAccesoExclusivoPaciente
                ? 'Acceso Exclusivo del Paciente • Seguimiento Satelital'
                : esAccesoExclusivoChofer
                ? 'Acceso Independiente del Chofer • Hoja de Ruta'
                : rolActivo === 'CENTRAL_ART'
                ? 'Torre de Control ART — Hoja de Ruta Real 19/11/2026'
                : rolActivo === 'CHOFER'
                ? 'Terminal Móvil Chofer — Matías Emanuel Gatica (AB 635 BN)'
                : 'Portal Seguro del Paciente'
            }
          />
          {modoDemo && !esAccesoExclusivoPaciente && !esAccesoExclusivoChofer && (
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => cambiarRolConTransicion('CENTRAL_ART')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  rolActivo === 'CENTRAL_ART' ? 'bg-[#1E588D] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Torre Control ART
              </button>
              <button
                onClick={() => cambiarRolConTransicion('CHOFER')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  rolActivo === 'CHOFER' ? 'bg-[#34B37B] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Car className="w-3.5 h-3.5" /> App Chofer
              </button>
              <button
                onClick={() => cambiarRolConTransicion('PACIENTE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  rolActivo === 'PACIENTE' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" /> Vista Paciente
              </button>
            </div>
          )}
          {!esAccesoExclusivoPaciente && !esAccesoExclusivoChofer && (
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
          {/* BANNER DE SINCRONIZACIÓN DE LA HOJA DE RUTA REAL DEL 19/11/2026 */}
          {hayTrasladosLocalesSinImpactar && (
            <div className="bg-gradient-to-r from-[#1E588D] to-[#268786] text-white rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-200">
                  ✓ Hoja de Ruta Real Cargada — Jueves 19/11/2026 (Prevención ART • 6 Tramos / 3 Pacientes)
                </div>
                <p className="text-xs text-blue-100 mt-0.5">
                  Chofer: <strong>Matías Emanuel Gatica</strong> • Móvil: <strong>Peugeot 408 (AB 635 BN)</strong> • Pacientes: <strong>Scheidegger (08:30)</strong>, <strong>Casado con Muletas (11:00)</strong> y <strong>Velázquez (11:30)</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={impactarHojaRutaRealEnSupabase}
                disabled={guardandoHojaReal}
                className="px-4 py-2 bg-[#34B37B] hover:bg-[#2a9666] text-white font-extrabold rounded-xl text-xs shadow-lg shrink-0"
              >
                {guardandoHojaReal ? 'Guardando en Supabase...' : '💾 Guardar estos 3 Traslados en Supabase'}
              </button>
            </div>
          )}
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
                            {v.patente} - {v.modelo} ({obtenerChoferDeVehiculo(v)?.nombre})
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
              onClick={() => cambiarTabAdmin('TORRE')}
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
              onClick={() => cambiarTabAdmin('HISTORIAL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
                tabAdmin === 'HISTORIAL' ? 'bg-[#1E588D] text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              <History className="w-4 h-4" /> Historial por Paciente ({historialPacientes.length})
            </button>
            <button
              onClick={() => cambiarTabAdmin('LIQUIDACION')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
                tabAdmin === 'LIQUIDACION' ? 'bg-[#1E588D] text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              <DollarSign className="w-4 h-4" /> Liquidación y Tarifas ART
            </button>
            <button
              onClick={() => cambiarTabAdmin('FLOTA')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
                tabAdmin === 'FLOTA' ? 'bg-[#1E588D] text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              <Truck className="w-4 h-4" /> Flota, Choferes y Vencimientos ({vehiculos.length} autos • {choferes.length} choferes)
            </button>
            <button
              onClick={() => cambiarTabAdmin('PRESTADORES')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
                tabAdmin === 'PRESTADORES' ? 'bg-[#1E588D] text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4" /> Prestadores y Base Operativa ({prestadores.length})
            </button>
          </div>
          <div key={tabAdmin} className="animate-erq-tab-enter space-y-6">
          {/* PESTAÑA 1: MONITOREO + FILTROS + LINKS INDEPENDIENTES */}
          {tabAdmin === 'TORRE' && (
            <div className="space-y-5">
              <MapaGeneralFlota
                trasladosActivos={trasladosFiltradosTorre}
                vehiculos={vehiculos}
                obtenerNombreChofer={(t) => obtenerChoferDeTraslado(t)?.nombre || 'Matías Emanuel Gatica'}
              />
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
                      placeholder="Buscar paciente, DNI, siniestro, chofer..."
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
                    <option value="REALIZADO">Realizado</option>
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
                    <option value="CON_SILLA_RUEDAS">♿ Con Muletas / Silla de Ruedas</option>
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
                      <button
                        onClick={() => setTabAdmin('NUEVO_VIAJE')}
                        className="px-4 py-2 bg-[#34B37B] text-white text-xs font-bold rounded-xl"
                      >
                        + Crear Nuevo Traslado ART
                      </button>
                    </div>
                  ) : (
                    trasladosFiltradosTorre.map((t) => {
                      const veh = vehiculos.find((v) => v.id === t.vehiculo_id) || vehiculos[0];
                      const ch = obtenerChoferDeTraslado(t);
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
                                <strong>${formatearMoneda(t.importe_total)}</strong>
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                esAlerta
                                  ? 'bg-red-600 text-white'
                                  : t.estado === 'REALIZADO' || t.estado === 'FINALIZADO'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {t.estado.replace(/_/g, ' ')}
                            </span>
                          </div>
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
                          {/* BARRA DE LINKS INDEPENDIENTES PARA COMPARTIR (CHOFER Y PACIENTE) */}
                          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-blue-50/50 border border-blue-100 mb-3 text-xs">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-bold text-[#1E588D] text-[11px]">Links Independientes:</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copiarEnlacePortapapeles(construirUrlPaciente(t), `Paciente (${t.paciente_nombre})`);
                                }}
                                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-semibold flex items-center gap-1 text-[11px]"
                              >
                                <Copy className="w-3 h-3 text-[#1E588D]" /> Link Paciente
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  enviarWhatsAppPaciente(t);
                                }}
                                className="px-2.5 py-1 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-lg font-bold flex items-center gap-1 text-[11px]"
                              >
                                <MessageCircle className="w-3 h-3" /> WA Paciente
                              </button>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copiarEnlacePortapapeles(construirUrlChoferViaje(t), `Chofer (${ch?.nombre || 'Matías'})`);
                                }}
                                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-semibold flex items-center gap-1 text-[11px]"
                              >
                                <Copy className="w-3 h-3 text-[#34B37B]" /> Link Chofer
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  enviarWhatsAppChofer(t);
                                }}
                                className="px-2.5 py-1 bg-[#1E588D] hover:bg-[#16436b] text-white rounded-lg font-bold flex items-center gap-1 text-[11px]"
                              >
                                <Share2 className="w-3 h-3" /> WA Chofer
                              </button>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-2.5">
                              {ch?.foto_url && (
                                <img src={ch.foto_url} alt={ch.nombre} className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                              )}
                              <div>
                                <div className="text-xs font-bold text-slate-800">{ch?.nombre || 'Matías Emanuel Gatica'}</div>
                                <div className="text-[11px] text-slate-500">
                                  <strong>{veh?.patente || 'AB 635 BN'}</strong> • {t.km_reales} km tramo ({t.modalidad_viaje === 'IDA_VUELTA' ? 'Ida y Vuelta' : 'Solo Ida'})
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => abrirModalEdicion(t, e)}
                                className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-[#1E588D] rounded-lg flex items-center gap-1"
                              >
                                <Edit3 className="w-3.5 h-3.5" /> Editar
                              </button>
                              <button
                                type="button"
                                onClick={(e) => repetirTrasladoPaciente(t, e)}
                                className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg flex items-center gap-1"
                              >
                                <Repeat className="w-3.5 h-3.5" /> Repetir
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
                {/* PANEL DERECHO: AUDITORÍA + ESQUEMA DE LIQUIDACIÓN Y HORAS DE ESPERA CON FRANQUICIA */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 h-fit">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#1E588D]" /> Auditoría y Liquidación del Viaje
                    </h3>
                    {viajeActivo && (
                      <button
                        type="button"
                        onClick={() => abrirModalEdicion(viajeActivo)}
                        className="text-xs font-bold text-[#1E588D] hover:underline flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Editar Todo
                      </button>
                    )}
                  </div>
                  {viajeActivo ? (
                    (() => {
                      const metaActivo = obtenerMetaTraslado(viajeActivo);
                      const desgloseActivo = calcularDesgloseLiquidacion({
                        artNombre: viajeActivo.art_nombre,
                        esquema: metaActivo.esquema_liquidacion,
                        modalidadViaje: viajeActivo.modalidad_viaje,
                        kmBaseAOrigen: metaActivo.km_base_a_origen,
                        kmOrigenADestino: viajeActivo.km_reales || metaActivo.km_origen_a_destino,
                        kmDestinoABase: metaActivo.km_destino_a_base,
                        horasEsperaTotal: viajeActivo.horas_espera || 0,
                      });
                      return (
                        <>
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                            <div className="text-[11px] font-bold uppercase text-slate-500">
                              Requerimientos ({viajeActivo.paciente_nombre})
                            </div>
                            <BadgesCondicionesTraslado traslado={viajeActivo} mostrarObservaciones={true} />
                          </div>
                          <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl space-y-3">
                            <div className="text-xs font-bold text-[#1E588D]">
                              Regla de Liquidación ({viajeActivo.art_nombre})
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-600 block mb-1">
                                Esquema de Cobro Pactado
                              </label>
                              <select
                                value={metaActivo.esquema_liquidacion}
                                onChange={(e) =>
                                  actualizarLiquidacionViaje(viajeActivo.id, { esquema_liquidacion: e.target.value })
                                }
                                className="w-full border border-blue-200 bg-white rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-800"
                              >
                                {Object.entries(ESQUEMAS_LIQUIDACION_LABELS).map(([k, label]) => (
                                  <option key={k} value={k}>
                                    {label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5 text-xs">
                              <div>
                                <label className="text-[10px] font-bold text-slate-500">KM Base→Dom</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={metaActivo.km_base_a_origen}
                                  onChange={(e) =>
                                    actualizarLiquidacionViaje(viajeActivo.id, { km_base_a_origen: e.target.value })
                                  }
                                  className="w-full border bg-white rounded-lg px-2 py-1 mt-0.5"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-500">KM Dom→Dest</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={viajeActivo.km_reales || 0}
                                  onChange={(e) =>
                                    actualizarLiquidacionViaje(viajeActivo.id, { km_reales: e.target.value })
                                  }
                                  className="w-full border bg-white rounded-lg px-2 py-1 mt-0.5"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-500">KM Dest→Base</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={metaActivo.km_destino_a_base}
                                  onChange={(e) =>
                                    actualizarLiquidacionViaje(viajeActivo.id, { km_destino_a_base: e.target.value })
                                  }
                                  className="w-full border bg-white rounded-lg px-2 py-1 mt-0.5"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs items-end">
                              <div>
                                <label className="text-[10px] font-bold text-slate-500">
                                  Horas de Espera Totales
                                </label>
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  value={viajeActivo.horas_espera || 0}
                                  onChange={(e) =>
                                    actualizarLiquidacionViaje(viajeActivo.id, { horas_espera: e.target.value })
                                  }
                                  className="w-full border bg-white rounded-lg px-2 py-1 mt-0.5 font-bold"
                                />
                              </div>
                              <div className="bg-white/90 border border-blue-100 rounded-lg px-2.5 py-1.5 text-[11px]">
                                <div className="text-slate-500">
                                  Franquicia: <strong>{desgloseActivo.franquiciaEspera} hs</strong>
                                </div>
                                <div className="font-bold text-[#1E588D]">
                                  Facturable: {desgloseActivo.horasEsperaFacturables} hs (${formatearMoneda(desgloseActivo.importeEspera)})
                                </div>
                              </div>
                            </div>
                            <div className="text-[11px] text-slate-600 bg-white/80 p-2 rounded-lg border border-blue-100">
                              <strong>Fórmula aplicada:</strong> {desgloseActivo.descripcionCalculo}
                            </div>
                            <div className="flex justify-between items-center pt-1 border-t border-blue-200/60 text-xs">
                              <span className="font-semibold text-slate-700">Total a liquidar ART:</span>
                              <span className="text-base font-extrabold text-[#1E588D]">
                                ${formatearMoneda(viajeActivo.importe_total || desgloseActivo.importeTotal)}
                              </span>
                            </div>
                          </div>
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
                      );
                    })()
                  ) : (
                    <p className="text-xs text-slate-500">Seleccioná un traslado para ver su auditoría.</p>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* PESTAÑA 2: DERIVAR NUEVO TRASLADO */}
          {tabAdmin === 'NUEVO_VIAJE' && (
            <form onSubmit={crearNuevoTraslado} className="bg-white rounded-2xl border border-slate-200 p-6 max-w-3xl space-y-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Emitir Orden de Traslado ART</h3>
                  <p className="text-xs text-slate-500">
                    El odómetro inicia en el Domicilio de Base Operativa del Prestador ({prestadorFormViaje?.domicilio_base || 'Av. Moreno 37'} • CP {cpBaseForm}).
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
                        {t.nombre_art} (Tramo 1: ${formatearMoneda(t.valor_tramo_1)} | Ida/Vuelta: ${formatearMoneda(t.valor_tramo_2)} | KM: ${formatearMoneda(t.valor_km)})
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
                    <option value="IDA_VUELTA">Ida y Vuelta ($11.260,08 en Radio Céntrico)</option>
                    <option value="SOLO_IDA">Solo Ida ($5.630,04 en Radio Céntrico)</option>
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
                  <input required value={nuevoViaje.paciente_nombre} onChange={(e) => setNuevoViaje({ ...nuevoViaje, paciente_nombre: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm" placeholder="Ej: CASADO, JOSE MARIA" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">DNI Paciente</label>
                  <input required value={nuevoViaje.paciente_dni} onChange={(e) => setNuevoViaje({ ...nuevoViaje, paciente_dni: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm" placeholder="35908887" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">N° Siniestro / Autorización ART</label>
                  <input required value={nuevoViaje.numero_siniestro} onChange={(e) => setNuevoViaje({ ...nuevoViaje, numero_siniestro: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm" placeholder="3050702 (Aut. 5031009/9)" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Teléfono WhatsApp</label>
                  <input required value={nuevoViaje.paciente_telefono} onChange={(e) => setNuevoViaje({ ...nuevoViaje, paciente_telefono: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm" placeholder="2604..." />
                </div>
                <FormularioCondicionesTraslado state={nuevoViaje} onChange={setNuevoViaje} />
                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end">
                  <div className="sm:col-span-3 space-y-1">
                    <label className="block text-xs font-semibold text-slate-600">Domicilio de Retiro del Paciente</label>
                    <div className="flex gap-2">
                      <input
                        required
                        value={nuevoViaje.origen_direccion}
                        onChange={(e) => setNuevoViaje({ ...nuevoViaje, origen_direccion: e.target.value })}
                        className="flex-1 border rounded-xl px-3 py-2 text-sm"
                        placeholder="Ej: Bolívar 285, San Rafael"
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
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Código Postal Origen</label>
                    <input
                      type="text"
                      value={nuevoViaje.cp_origen}
                      onChange={(e) => setNuevoViaje({ ...nuevoViaje, cp_origen: e.target.value })}
                      placeholder="5600"
                      className="w-full border rounded-xl px-3 py-2 text-sm font-bold text-[#1E588D]"
                    />
                  </div>
                </div>
                {/* Centro Médico + ABM Completo */}
                <div className="sm:col-span-2 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="block text-xs font-semibold text-slate-600">Centro Médico de Destino</label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setMostrarFormCentro(!mostrarFormCentro);
                          setMostrarGestorCentros(false);
                        }}
                        className="text-xs font-bold text-[#1E588D] hover:text-[#34B37B] flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> {mostrarFormCentro ? 'Cerrar alta' : 'Agregar centro'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMostrarGestorCentros(!mostrarGestorCentros);
                          setMostrarFormCentro(false);
                        }}
                        className="text-xs font-bold text-slate-700 hover:text-[#1E588D] flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg"
                      >
                        <Edit3 className="w-3.5 h-3.5" />{' '}
                        {mostrarGestorCentros ? 'Cerrar gestor' : `Modificar / Eliminar Centros (${centrosMedicos.length})`}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <select
                      value={nuevoViaje.destino_nombre}
                      onChange={(e) => {
                        const seleccionado = centrosMedicos.find(
                          (cm) => (cm.direccion ? `${cm.nombre} (${cm.direccion})` : cm.nombre) === e.target.value
                        );
                        setNuevoViaje({
                          ...nuevoViaje,
                          destino_nombre: e.target.value,
                          cp_destino: seleccionado?.codigo_postal || '5600',
                          destino_lat: seleccionado?.lat || -34.6152,
                          destino_lng: seleccionado?.lng || -68.3342,
                        });
                      }}
                      className="sm:col-span-3 w-full border rounded-xl px-3 py-2 text-sm bg-white"
                    >
                      {centrosMedicos.map((cm) => {
                        const label = cm.direccion ? `${cm.nombre} (${cm.direccion})` : cm.nombre;
                        return (
                          <option key={cm.id} value={label}>
                            {label} [CP {cm.codigo_postal || '5600'}]
                          </option>
                        );
                      })}
                    </select>
                    <div>
                      <input
                        type="text"
                        value={nuevoViaje.cp_destino}
                        onChange={(e) => setNuevoViaje({ ...nuevoViaje, cp_destino: e.target.value })}
                        placeholder="CP Destino"
                        className="w-full border rounded-xl px-3 py-2 text-sm font-bold text-[#1E588D]"
                      />
                    </div>
                  </div>
                  {mostrarFormCentro && (
                    <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2.5">
                      <div className="text-xs font-bold text-[#1E588D]">Nuevo Centro Médico / Clínica</div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
                          placeholder="Dirección (ej: Bernardino Rivadavia 340)"
                          className="border border-slate-300 bg-white rounded-lg px-2.5 py-1.5 text-xs"
                        />
                        <input
                          type="text"
                          value={nuevoCentro.codigo_postal}
                          onChange={(e) => setNuevoCentro({ ...nuevoCentro, codigo_postal: e.target.value })}
                          placeholder="Código Postal (ej: 5600)"
                          className="border border-slate-300 bg-white rounded-lg px-2.5 py-1.5 text-xs font-bold"
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
                  {mostrarGestorCentros && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div className="text-xs font-bold text-slate-800">
                        Listado de Centros Médicos (Modificar o Eliminar)
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {centrosMedicos.map((cm) => (
                          <div
                            key={cm.id}
                            className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs"
                          >
                            {centroEditando?.id === cm.id ? (
                              <div className="w-full grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                                <input
                                  value={centroEditando.nombre}
                                  onChange={(e) => setCentroEditando({ ...centroEditando, nombre: e.target.value })}
                                  className="border rounded-lg px-2 py-1 text-xs"
                                />
                                <input
                                  value={centroEditando.direccion}
                                  onChange={(e) => setCentroEditando({ ...centroEditando, direccion: e.target.value })}
                                  className="border rounded-lg px-2 py-1 text-xs"
                                />
                                <input
                                  value={centroEditando.codigo_postal || '5600'}
                                  onChange={(e) =>
                                    setCentroEditando({ ...centroEditando, codigo_postal: e.target.value })
                                  }
                                  className="border rounded-lg px-2 py-1 text-xs font-bold"
                                />
                                <div className="flex justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={guardarEdicionCentroMedico}
                                    className="px-2.5 py-1 bg-[#34B37B] text-white font-bold rounded-lg"
                                  >
                                    Guardar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setCentroEditando(null)}
                                    className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div>
                                  <span className="font-bold text-slate-900">{cm.nombre}</span>{' '}
                                  <span className="text-slate-500">({cm.direccion || 'Sin dirección'})</span>{' '}
                                  <span className="px-2 py-0.5 bg-blue-50 text-[#1E588D] font-bold rounded text-[10px]">
                                    CP {cm.codigo_postal || '5600'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setCentroEditando({ ...cm })}
                                    className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#1E588D] font-semibold rounded-lg flex items-center gap-1"
                                  >
                                    <Edit3 className="w-3 h-3" /> Modificar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => eliminarCentroMedico(cm)}
                                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold rounded-lg flex items-center gap-1"
                                  >
                                    <Trash2 className="w-3 h-3" /> Eliminar
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {/* Esquema de Liquidación Automático por Código Postal o Manual */}
                <div className="sm:col-span-2 p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-extrabold uppercase text-[#1E588D] flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-[#34B37B]" />
                      Cálculo de Odómetro desde Base ({prestadorFormViaje?.domicilio_base} • CP {cpBaseForm})
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        nuevoViaje.cp_origen !== cpBaseForm || nuevoViaje.cp_destino !== cpBaseForm
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {nuevoViaje.cp_origen !== cpBaseForm || nuevoViaje.cp_destino !== cpBaseForm
                        ? `Cambia Código Postal (${cpBaseForm} → ${nuevoViaje.cp_origen}/${nuevoViaje.cp_destino}): Suma KM ($656,85/km)`
                        : `Mismo Código Postal (${cpBaseForm}): Radio Céntrico por Tramo`}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Regla de Liquidación a Aplicar
                      </label>
                      <select
                        value={nuevoViaje.esquema_liquidacion}
                        onChange={(e) => setNuevoViaje({ ...nuevoViaje, esquema_liquidacion: e.target.value })}
                        className="w-full border border-blue-200 rounded-xl px-3 py-2 bg-white font-semibold"
                      >
                        <option value="AUTO">
                          ⚡ Automático según Convenio {nuevoViaje.art_nombre} y Código Postal
                        </option>
                        {Object.entries(ESQUEMAS_LIQUIDACION_LABELS).map(([k, label]) => (
                          <option key={k} value={k}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-blue-100 flex flex-col justify-center">
                      <div className="text-[11px] text-slate-500">{desglosePreviewForm.descripcionCalculo}</div>
                      <div className="text-sm font-extrabold text-[#1E588D] mt-0.5">
                        Importe Inicial Estimado: ${formatearMoneda(desglosePreviewForm.importeTotal)}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Selección Independiente de Vehículo y Chofer */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Asignar Vehículo Habilitado
                  </label>
                  <select
                    value={nuevoViaje.vehiculo_id}
                    onChange={(e) => {
                      const v = vehiculos.find((item) => item.id === e.target.value);
                      const chDefault = obtenerChoferDeVehiculo(v);
                      setNuevoViaje({
                        ...nuevoViaje,
                        vehiculo_id: e.target.value,
                        prestador_id: v?.prestador_id || nuevoViaje.prestador_id,
                        chofer_id: chDefault?.id || nuevoViaje.chofer_id,
                      });
                    }}
                    className="w-full border rounded-xl px-3 py-2 text-xs bg-white font-semibold"
                  >
                    {vehiculos.map((v) => {
                      const bloqueado = vehiculoEstaBloqueado(v);
                      return (
                        <option key={v.id} value={v.id} disabled={bloqueado}>
                          {bloqueado ? '⛔ BLOQUEADO — ' : '✅ '}
                          {v.patente} | {v.modelo}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Elegir Chofer para este Viaje (Independiente del Auto)
                  </label>
                  <select
                    value={nuevoViaje.chofer_id}
                    onChange={(e) => setNuevoViaje({ ...nuevoViaje, chofer_id: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 text-xs bg-white font-semibold"
                  >
                    {choferes.map((c) => {
                      const evLic = evaluarVencimiento(c.licencia_venc);
                      return (
                        <option key={c.id} value={c.id} disabled={evLic.bloqueado}>
                          {evLic.bloqueado ? '⛔ LIC. VENCIDA — ' : '👨‍✈️ '}
                          {c.nombre} (Lic: {c.licencia_venc})
                        </option>
                      );
                    })}
                  </select>
                </div>
                {/* Programación Recurrente (Sesiones FKT / Rehabilitación, ej. 5 días MULETAS) */}
                <div className="sm:col-span-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-bold text-[#1E588D] flex items-center gap-1.5">
                      <Repeat className="w-4 h-4 text-[#34B37B]" />
                      ¿Programar múltiples sesiones recurrentes (ej. 5 días Fisiokinesio Terapia)?
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
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Cantidad de Sesiones</label>
                        <input
                          type="number"
                          min="2"
                          max="20"
                          value={cantidadSesiones}
                          onChange={(e) => setCantidadSesiones(e.target.value)}
                          className="w-full border rounded-lg px-2.5 py-1.5 bg-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Días de Cursado</label>
                        <select
                          value={frecuenciaSesiones}
                          onChange={(e) => setFrecuenciaSesiones(e.target.value)}
                          className="w-full border rounded-lg px-2.5 py-1.5 bg-white font-medium"
                        >
                          <option value="DIARIO_HABIL">Todos los días hábiles (5 días corridos Lun a Vie)</option>
                          <option value="LUN_MIE_VIE">Lunes, Miércoles y Viernes</option>
                          <option value="MAR_JUE">Martes y Jueves</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <button type="submit" className="px-5 py-2.5 bg-[#34B37B] hover:bg-[#2a9666] text-white font-bold rounded-xl text-sm shadow">
                {esRecurrente
                  ? `Confirmar y Generar ${cantidadSesiones} Traslados Recurrentes`
                  : 'Confirmar y Guardar Traslado en Base de Datos'}
              </button>
            </form>
          )}
          {/* PESTAÑA 3: HISTORIAL POR PACIENTE */}
          {tabAdmin === 'HISTORIAL' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <History className="w-4 h-4 text-[#1E588D]" />
                    Historial Consolidado por Paciente ART
                  </h3>
                  <p className="text-xs text-slate-500">
                    Consultá todos los viajes realizados por cada paciente, sus condiciones habituales y repetí una orden en 1 clic.
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
                              ${formatearMoneda(p.total_importe)}
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
                                    ${formatearMoneda(v.importe_total)}
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
            </div>
          )}
          {/* PESTAÑA 4: LIQUIDACIÓN Y TARIFAS AVANZADAS POR ART */}
          {tabAdmin === 'LIQUIDACION' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      Convenios y Reglas de Tarifación por Aseguradora (ART)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Valores convenidos activos: Radio Céntrico Ida (Tramo 1) <strong>$5.630,04</strong> • Ida y Vuelta (Tramo 1 + Tramo 2) <strong>$11.260,08</strong> • Hora de Espera <strong>$5.630,04</strong> • Kilómetro Solo de Ida <strong>$656,85</strong>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={abrirNuevaArt}
                    className="px-3.5 py-2 bg-[#1E588D] hover:bg-[#16426B] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> Nueva ART
                  </button>
                </div>
                {mostrarFormArt && (
                  <form onSubmit={guardarArt} className="p-4 rounded-2xl border-2 border-[#1E588D]/30 bg-blue-50/40 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-sm text-[#1E588D]">
                        {artEditandoNombre ? `Editar ART: ${artEditandoNombre}` : 'Agregar Nueva Aseguradora (ART)'}
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setMostrarFormArt(false);
                          setArtEditandoNombre(null);
                        }}
                        className="p-1 rounded-lg hover:bg-slate-200 text-slate-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Nombre de la ART *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej: Swiss Medical ART"
                          value={formArt.nombre_art}
                          onChange={(e) => setFormArt({ ...formArt, nombre_art: e.target.value })}
                          className="w-full border bg-white rounded-lg px-2.5 py-1.5 font-bold text-slate-900"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Criterio Principal de Facturación</label>
                        <select
                          value={formArt.modo_facturacion_default}
                          onChange={(e) => setFormArt({ ...formArt, modo_facturacion_default: e.target.value })}
                          className="w-full border bg-white rounded-lg px-2.5 py-1.5 font-semibold text-slate-800"
                        >
                          {Object.entries(MODOS_FACTURACION_ART_LABELS).map(([k, label]) => (
                            <option key={k} value={k}>{label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-teal-800 block mb-0.5">Radio Céntrico Ida — Tramo 1 ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formArt.valor_tramo_1}
                          onChange={(e) => setFormArt({ ...formArt, valor_tramo_1: e.target.value })}
                          className="w-full border bg-white rounded-lg px-2.5 py-1.5 font-bold text-teal-900"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-teal-800 block mb-0.5">Ida y Vuelta — Tramo 1+2 ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formArt.valor_tramo_2}
                          onChange={(e) => setFormArt({ ...formArt, valor_tramo_2: e.target.value })}
                          className="w-full border bg-white rounded-lg px-2.5 py-1.5 font-bold text-teal-900"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#1E588D] block mb-0.5">Valor por KM ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formArt.valor_km}
                          onChange={(e) => setFormArt({ ...formArt, valor_km: e.target.value })}
                          className="w-full border bg-white rounded-lg px-2.5 py-1.5 font-bold text-[#1E588D]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#1E588D] block mb-0.5">Modalidad de Conteo de KM</label>
                        <select
                          value={formArt.regla_km}
                          onChange={(e) => setFormArt({ ...formArt, regla_km: e.target.value })}
                          className="w-full border bg-white rounded-lg px-2 py-1.5 font-semibold"
                        >
                          {Object.entries(REGLAS_KM_ART_LABELS).map(([k, label]) => (
                            <option key={k} value={k}>{label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-amber-800 block mb-0.5">Valor Hora de Espera ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formArt.valor_hora_espera}
                          onChange={(e) => setFormArt({ ...formArt, valor_hora_espera: e.target.value })}
                          className="w-full border bg-white rounded-lg px-2.5 py-1.5 font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-amber-800 block mb-0.5">Espera: ¿Desde cuántas hs suma?</label>
                        <select
                          value={Number(formArt.espera_desde_hora)}
                          onChange={(e) => setFormArt({ ...formArt, espera_desde_hora: Number(e.target.value) })}
                          className="w-full border bg-white rounded-lg px-2 py-1.5 font-bold text-amber-900"
                        >
                          <option value={0}>Desde la 1ra hora (0 hs sin cargo)</option>
                          <option value={1}>A partir de la 2da hora (1ra hora sin cargo)</option>
                          <option value={1.5}>A partir de 1.5 hs</option>
                          <option value={2}>A partir de la 3ra hora (2 hs sin cargo)</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2 flex items-end justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setMostrarFormArt(false);
                            setArtEditandoNombre(null);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-600 hover:bg-slate-100"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-lg bg-[#34B37B] hover:bg-emerald-600 text-white font-bold flex items-center gap-1 shadow-sm"
                        >
                          <Check className="w-4 h-4" /> {artEditandoNombre ? 'Guardar Cambios' : 'Agregar ART'}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {tarifasArt.map((tar) => (
                    <div key={tar.nombre_art} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-extrabold text-sm text-[#1E588D] truncate">{tar.nombre_art}</span>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px] shrink-0">
                            Convenio Activo
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => abrirEditarArt(tar)}
                            title="Editar ART"
                            className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-blue-50 text-[#1E588D] font-bold flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => eliminarArt(tar)}
                            title="Eliminar ART"
                            className="px-2 py-1 rounded-lg bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Eliminar
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                            Criterio Principal de Facturación
                          </label>
                          <select
                            value={tar.modo_facturacion_default || 'URBANO_TRAMOS_Y_KM_CP'}
                            onChange={(e) =>
                              actualizarCampoTarifaArt(tar.nombre_art, 'modo_facturacion_default', e.target.value)
                            }
                            className="w-full border bg-white rounded-lg px-2.5 py-1.5 font-semibold text-slate-800"
                          >
                            {Object.entries(MODOS_FACTURACION_ART_LABELS).map(([k, label]) => (
                              <option key={k} value={k}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-teal-800 block mb-0.5">
                            Radio Céntrico Ida — Tramo 1 ($)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={tar.valor_tramo_1 ?? 5630.04}
                            onChange={(e) =>
                              actualizarCampoTarifaArt(tar.nombre_art, 'valor_tramo_1', Number(e.target.value))
                            }
                            className="w-full border bg-white rounded-lg px-2.5 py-1.5 font-bold text-teal-900"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-teal-800 block mb-0.5">
                            Ida y Vuelta (Tramo 1 + Tramo 2) ($)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={tar.valor_tramo_2 ?? 11260.08}
                            onChange={(e) =>
                              actualizarCampoTarifaArt(tar.nombre_art, 'valor_tramo_2', Number(e.target.value))
                            }
                            className="w-full border bg-white rounded-lg px-2.5 py-1.5 font-bold text-teal-900"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-[#1E588D] block mb-0.5">
                            Valor por KM ($) (Fuera de Radio / CP)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={tar.valor_km}
                            onChange={(e) =>
                              actualizarCampoTarifaArt(tar.nombre_art, 'valor_km', Number(e.target.value))
                            }
                            className="w-full border bg-white rounded-lg px-2.5 py-1.5 font-bold text-[#1E588D]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-[#1E588D] block mb-0.5">
                            Modalidad de Conteo de KM
                          </label>
                          <select
                            value={tar.regla_km || 'SOLO_IDA_PACIENTE'}
                            onChange={(e) => actualizarCampoTarifaArt(tar.nombre_art, 'regla_km', e.target.value)}
                            className="w-full border bg-white rounded-lg px-2 py-1.5 font-semibold"
                          >
                            {Object.entries(REGLAS_KM_ART_LABELS).map(([k, label]) => (
                              <option key={k} value={k}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-amber-800 block mb-0.5">
                            Valor Hora de Espera ($)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={tar.valor_hora_espera}
                            onChange={(e) =>
                              actualizarCampoTarifaArt(tar.nombre_art, 'valor_hora_espera', Number(e.target.value))
                            }
                            className="w-full border bg-white rounded-lg px-2.5 py-1.5 font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-amber-800 block mb-0.5">
                            Espera: ¿A partir de cuántas hs suma?
                          </label>
                          <select
                            value={Number(tar.espera_desde_hora ?? 1)}
                            onChange={(e) =>
                              actualizarCampoTarifaArt(tar.nombre_art, 'espera_desde_hora', Number(e.target.value))
                            }
                            className="w-full border bg-white rounded-lg px-2 py-1.5 font-bold text-amber-900"
                          >
                            <option value={0}>Desde la 1ra hora (0 hs sin cargo)</option>
                            <option value={1}>A partir de la 2da hora (1ra hora sin cargo)</option>
                            <option value={1.5}>A partir de 1.5 hs</option>
                            <option value={2}>A partir de la 3ra hora (2 hs sin cargo)</option>
                          </select>
                        </div>
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
                        ${formatearMoneda(totalFacturarFiltrado)}
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
                        <th className="py-2.5 px-2">Fecha / Hora</th>
                        <th className="py-2.5 px-2">ART</th>
                        <th className="py-2.5 px-2">Siniestro / Paciente</th>
                        <th className="py-2.5 px-2">Esquema / Código Postal</th>
                        <th className="py-2.5 px-2">Condiciones</th>
                        <th className="py-2.5 px-2">KM / Espera Facturable</th>
                        <th className="py-2.5 px-2 text-right">Importe ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {trasladosLiquidacion.map((t) => {
                        const meta = obtenerMetaTraslado(t);
                        const desglose = calcularDesgloseLiquidacion({
                          artNombre: t.art_nombre,
                          esquema: meta.esquema_liquidacion,
                          modalidadViaje: t.modalidad_viaje,
                          kmBaseAOrigen: meta.km_base_a_origen,
                          kmOrigenADestino: t.km_reales || meta.km_origen_a_destino,
                          kmDestinoABase: meta.km_destino_a_base,
                          horasEsperaTotal: t.horas_espera || 0,
                        });
                        return (
                          <tr key={t.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-2 font-semibold">
                              {t.fecha_programada} • {t.hora_programada} hs
                            </td>
                            <td className="py-2.5 px-2 font-semibold text-[#1E588D]">{t.art_nombre}</td>
                            <td className="py-2.5 px-2">
                              <div className="font-bold text-slate-800">{t.paciente_nombre}</div>
                              <div className="text-[11px] text-slate-500">{t.numero_siniestro}</div>
                            </td>
                            <td className="py-2.5 px-2">
                              <div className="font-semibold text-slate-800">
                                {ESQUEMAS_LIQUIDACION_LABELS[meta.esquema_liquidacion] || meta.esquema_liquidacion}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                CP Base {meta.cp_base} → Origen {meta.cp_origen} → Dest {meta.cp_destino}
                              </div>
                            </td>
                            <td className="py-2.5 px-2">
                              <BadgesCondicionesTraslado traslado={t} />
                            </td>
                            <td className="py-2.5 px-2">
                              <div>{desglose.kmFacturables} km</div>
                              <div className="text-[10px] text-slate-500">
                                Espera: {t.horas_espera || 0}h (Fact: {desglose.horasEsperaFacturables}h)
                              </div>
                            </td>
                            <td className="py-2.5 px-2 text-right font-bold text-slate-900">
                              ${formatearMoneda(t.importe_total || desglose.importeTotal)}
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
          {/* PESTAÑA 5: FLOTA (5 VENCIMIENTOS) Y CHOFERES INDEPENDIENTES POR EMPRESA */}
          {tabAdmin === 'FLOTA' && (
            <div className="space-y-8">
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-[#1E588D]" />
                    Vehículos de la Flota y Vencimientos (Seguro, Habilitación, RTO, Matafuegos y Desinfección)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Podés cambiar en 1 clic qué chofer de la empresa está hoy al volante de cada auto o modificar/eliminar unidades.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {vehiculos.map((v) => {
                    const prest = prestadores.find((p) => p.id === v.prestador_id);
                    const choferActual = obtenerChoferDeVehiculo(v);
                    const choferesDeLaEmpresa = choferes.filter((c) => c.prestador_id === v.prestador_id);
                    const bloqueado = vehiculoEstaBloqueado(v);
                    const evalLic = evaluarVencimiento(choferActual?.licencia_venc || v.licencia_venc);
                    const docsNorm = normalizarDocsVehiculo(v.docs);
                    return (
                      <div
                        key={v.id}
                        className={`bg-white rounded-2xl border p-5 space-y-3 shadow-xs ${
                          bloqueado ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 bg-slate-900 text-white font-mono text-xs font-bold rounded-lg">
                            {v.patente}
                          </span>
                          <div className="flex items-center gap-1">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                bloqueado ? 'bg-red-600 text-white' : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {bloqueado ? 'BLOQUEADO ART' : 'APTO OPERAR'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const mapaD = {};
                                docsNorm.forEach((d) => {
                                  mapaD[d.tipo] = d.vencimiento;
                                });
                                setVehiculoEditando({
                                  ...v,
                                  chofer_id: choferActual?.id || v.chofer_id,
                                  seguro_venc: mapaD.SEGURO || '2027-06-01',
                                  hab_venc: mapaD.HABILITACION_TRANSPORTE || '2027-06-01',
                                  rto_venc: mapaD.RTO || '2027-06-01',
                                  matafuegos_venc: mapaD.MATAFUEGOS || '2027-06-01',
                                  desinfeccion_venc: mapaD.DESINFECCION || '2027-06-01',
                                });
                              }}
                              className="p-1.5 text-slate-500 hover:text-[#1E588D] hover:bg-slate-100 rounded-lg"
                              title="Modificar vehículo y vencimientos"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => eliminarVehiculo(v)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                              title="Eliminar vehículo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{v.modelo}</h4>
                          <p className="text-xs text-slate-500">{prest?.razon_social}</p>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={
                                choferActual?.foto_url ||
                                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
                              }
                              alt={choferActual?.nombre}
                              className="w-10 h-10 rounded-full object-cover border border-slate-300 shrink-0"
                            />
                            <div className="text-xs flex-1">
                              <div className="text-[10px] font-bold uppercase text-slate-400">
                                Chofer asignado al móvil
                              </div>
                              <div className="font-bold text-slate-900">{choferActual?.nombre}</div>
                              <span
                                className={`inline-block px-2 py-0.5 rounded border text-[10px] font-semibold mt-0.5 ${evalLic.badge}`}
                              >
                                Licencia: {choferActual?.licencia_venc} ({evalLic.estado})
                              </span>
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-[#1E588D] block mb-1">
                              Cambiar Chofer del Auto (Reemplazo / Turno):
                            </label>
                            <select
                              value={choferActual?.id || ''}
                              onChange={(e) => asignarChoferAVehiculo(v.id, e.target.value)}
                              className="w-full border border-slate-300 bg-white rounded-lg px-2 py-1 text-xs font-semibold"
                            >
                              {(choferesDeLaEmpresa.length > 0 ? choferesDeLaEmpresa : choferes).map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.nombre} (Lic: {c.licencia_venc})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="space-y-1.5 pt-2 border-t border-slate-100">
                          <div className="text-[10px] font-bold uppercase text-slate-400">
                            Vencimientos del Vehículo:
                          </div>
                          {docsNorm.map((d, idx) => {
                            const ev = evaluarVencimiento(d.vencimiento);
                            const labelDoc =
                              TIPOS_DOC_VEHICULO.find((item) => item.tipo === d.tipo)?.label ||
                              d.tipo.replace(/_/g, ' ');
                            return (
                              <div key={idx} className="flex justify-between items-center text-xs">
                                <span className="text-slate-600 font-medium">{labelDoc}</span>
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
                {/* Formulario Alta de Nuevo Vehículo */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const ch = choferes.find((c) => c.id === nuevoVehiculo.chofer_id) || choferes[0];
                    const payloadBase = {
                      prestador_id: nuevoVehiculo.prestador_id,
                      patente: nuevoVehiculo.patente.toUpperCase(),
                      modelo: nuevoVehiculo.modelo,
                      tipo_movilidad: nuevoVehiculo.tipo_movilidad,
                      chofer_nombre: ch?.nombre || 'Asignado',
                      chofer_foto:
                        ch?.foto_url ||
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
                      licencia_venc: ch?.licencia_venc || '2027-08-15',
                      docs: [
                        { tipo: 'SEGURO', vencimiento: nuevoVehiculo.seguro_venc },
                        { tipo: 'HABILITACION_TRANSPORTE', vencimiento: nuevoVehiculo.hab_venc },
                        { tipo: 'RTO', vencimiento: nuevoVehiculo.rto_venc },
                        { tipo: 'MATAFUEGOS', vencimiento: nuevoVehiculo.matafuegos_venc },
                        { tipo: 'DESINFECCION', vencimiento: nuevoVehiculo.desinfeccion_venc },
                      ],
                    };
                    const payloadExt = { ...payloadBase, chofer_id: ch?.id || null };
                    let { data, error } = await supabase.from('vehiculos').insert([payloadExt]).select().single();
                    if (error) {
                      const retry = await supabase.from('vehiculos').insert([payloadBase]).select().single();
                      data = retry.data;
                      error = retry.error;
                    }
                    if (error) {
                      alert('Error guardando unidad: ' + error.message);
                      return;
                    }
                    setVehiculos([...vehiculos, { ...payloadExt, ...(data || {}) }]);
                    setNuevoVehiculo({ ...nuevoVehiculo, patente: '', modelo: '' });
                  }}
                  className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4"
                >
                  <h4 className="font-bold text-sm text-slate-900">
                    Registrar Nuevo Vehículo en la Flota (Con los 5 Vencimientos Reglamentarios)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Empresa Prestadora</label>
                      <select
                        value={nuevoVehiculo.prestador_id}
                        onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, prestador_id: e.target.value })}
                        className="w-full border rounded-xl px-3 py-2 mt-0.5 bg-white"
                      >
                        {prestadores.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.razon_social}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Patente</label>
                      <input
                        required
                        placeholder="Ej: AG 123 ZZ"
                        value={nuevoVehiculo.patente}
                        onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, patente: e.target.value })}
                        className="w-full border rounded-xl px-3 py-2 mt-0.5"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Marca y Modelo</label>
                      <input
                        required
                        placeholder="Ej: Peugeot 408 / Partner"
                        value={nuevoVehiculo.modelo}
                        onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, modelo: e.target.value })}
                        className="w-full border rounded-xl px-3 py-2 mt-0.5"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Capacidad / Tipo de Unidad</label>
                      <select
                        value={nuevoVehiculo.tipo_movilidad}
                        onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, tipo_movilidad: e.target.value })}
                        className="w-full border rounded-xl px-3 py-2 mt-0.5 bg-white font-semibold text-[#1E588D]"
                      >
                        <option value="AMPLIO_150KG_SILLA">Sedán Amplio (Apto +150 kg y Silla en Baúl)</option>
                        <option value="UTILITARIO_ADAPTADO">Utilitario / SUV Adaptado (Silla Ruedas / Rampa)</option>
                        <option value="AMBULATORIO">Ambulatorio Estándar</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500">Chofer Titular Inicial</label>
                      <select
                        value={nuevoVehiculo.chofer_id}
                        onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, chofer_id: e.target.value })}
                        className="w-full border rounded-xl px-3 py-2 mt-0.5 bg-white font-semibold"
                      >
                        {choferes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nombre} (Licencia vence: {c.licencia_venc})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">1. Venc. Seguro</label>
                      <input
                        type="date"
                        value={nuevoVehiculo.seguro_venc}
                        onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, seguro_venc: e.target.value })}
                        className="w-full border rounded-xl px-3 py-1.5"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">2. Venc. Habilitación Transporte</label>
                      <input
                        type="date"
                        value={nuevoVehiculo.hab_venc}
                        onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, hab_venc: e.target.value })}
                        className="w-full border rounded-xl px-3 py-1.5"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">3. Venc. RTO</label>
                      <input
                        type="date"
                        value={nuevoVehiculo.rto_venc}
                        onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, rto_venc: e.target.value })}
                        className="w-full border rounded-xl px-3 py-1.5"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">4. Venc. Matafuegos</label>
                      <input
                        type="date"
                        value={nuevoVehiculo.matafuegos_venc}
                        onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, matafuegos_venc: e.target.value })}
                        className="w-full border rounded-xl px-3 py-1.5"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">5. Venc. Desinfección</label>
                      <input
                        type="date"
                        value={nuevoVehiculo.desinfeccion_venc}
                        onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, desinfeccion_venc: e.target.value })}
                        className="w-full border rounded-xl px-3 py-1.5"
                      />
                    </div>
                  </div>
                  <button type="submit" className="px-4 py-2 bg-[#1E588D] text-white font-bold rounded-xl text-xs">
                    Guardar Vehículo en Flota
                  </button>
                </form>
              </div>
              {/* SECCIÓN B: CHOFERES POR EMPRESA */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div>
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#34B37B]" />
                    Plantel de Choferes por Empresa (Vencimiento de Licencia y Acceso Independiente)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cargá varios choferes por empresa, controlá el vencimiento de su Licencia Nacional de Conducir, compartiles su link exclusivo de trabajo o dalos de baja si renuncian.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {choferes.map((c) => {
                    const prest = prestadores.find((p) => p.id === c.prestador_id);
                    const autoHab = vehiculos.find((v) => v.id === c.vehiculo_habitual_id || v.chofer_id === c.id);
                    const evLic = evaluarVencimiento(c.licencia_venc);
                    return (
                      <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                c.foto_url ||
                                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
                              }
                              alt={c.nombre}
                              className="w-12 h-12 rounded-full object-cover border-2 border-[#34B37B]"
                            />
                            <div>
                              <h4 className="font-bold text-sm text-slate-900">{c.nombre}</h4>
                              <p className="text-[11px] text-slate-500">{prest?.razon_social || 'Erquenci S.A.S.'}</p>
                              <p className="text-[11px] text-slate-500">
                                DNI: {c.dni || 'S/D'} • Tel: {c.telefono || 'S/T'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setChoferEditando({ ...c })}
                              className="p-1.5 text-slate-500 hover:text-[#1E588D] hover:bg-slate-100 rounded-lg"
                              title="Modificar chofer y licencia"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => eliminarChofer(c)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                              title="Eliminar chofer (baja / renuncia)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                          <span className="font-medium text-slate-600">Venc. Licencia:</span>
                          <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${evLic.badge}`}>
                            {c.licencia_venc} ({evLic.estado})
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-600">Móvil Habitual:</span>
                          <span className="font-bold text-slate-800">
                            {autoHab ? `${autoHab.patente} (${autoHab.modelo})` : 'Rotativo / Suplente'}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              copiarEnlacePortapapeles(construirUrlPortalChofer(c.id), `Portal Chofer (${c.nombre})`)
                            }
                            className="flex-1 py-1.5 px-2.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#1E588D] rounded-lg text-[11px] font-bold flex items-center justify-center gap-1"
                          >
                            <Copy className="w-3 h-3" /> Copiar Link Chofer
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Formulario Alta de Nuevo Chofer */}
                <form onSubmit={guardarNuevoChofer} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                  <h4 className="font-bold text-sm text-slate-900">
                    Dar de Alta Nuevo Chofer por Empresa y Vencimiento de Licencia
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Empresa Prestadora</label>
                      <select
                        value={nuevoChofer.prestador_id}
                        onChange={(e) => setNuevoChofer({ ...nuevoChofer, prestador_id: e.target.value })}
                        className="w-full border rounded-xl px-3 py-2 mt-0.5 bg-white"
                      >
                        {prestadores.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.razon_social}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Apellido y Nombre del Chofer</label>
                      <input
                        required
                        placeholder="Ej: Lucas Fernández"
                        value={nuevoChofer.nombre}
                        onChange={(e) => setNuevoChofer({ ...nuevoChofer, nombre: e.target.value })}
                        className="w-full border rounded-xl px-3 py-2 mt-0.5"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">DNI / CUIL</label>
                      <input
                        placeholder="Ej: 39.111.222"
                        value={nuevoChofer.dni}
                        onChange={(e) => setNuevoChofer({ ...nuevoChofer, dni: e.target.value })}
                        className="w-full border rounded-xl px-3 py-2 mt-0.5"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Teléfono WhatsApp Chofer</label>
                      <input
                        placeholder="Ej: 2604..."
                        value={nuevoChofer.telefono}
                        onChange={(e) => setNuevoChofer({ ...nuevoChofer, telefono: e.target.value })}
                        className="w-full border rounded-xl px-3 py-2 mt-0.5"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Venc. Licencia de Conducir</label>
                      <input
                        type="date"
                        required
                        value={nuevoChofer.licencia_venc}
                        onChange={(e) => setNuevoChofer({ ...nuevoChofer, licencia_venc: e.target.value })}
                        className="w-full border rounded-xl px-3 py-2 mt-0.5"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Asignar a Vehículo (Opcional)</label>
                      <select
                        value={nuevoChofer.vehiculo_habitual_id || ''}
                        onChange={(e) => setNuevoChofer({ ...nuevoChofer, vehiculo_habitual_id: e.target.value })}
                        className="w-full border rounded-xl px-3 py-2 mt-0.5 bg-white"
                      >
                        <option value="">Chofer Rotativo / Franquero (Sin auto fijo)</option>
                        {vehiculos.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.patente} — {v.modelo}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-3 flex items-center gap-3 border rounded-xl px-3 py-2 bg-slate-50">
                      {nuevoChofer.foto_url ? (
                        <img src={nuevoChofer.foto_url} alt="Preview" className="w-9 h-9 rounded-full object-cover border" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                          <Camera className="w-4 h-4" />
                        </div>
                      )}
                      <label className="cursor-pointer text-xs font-semibold text-[#1E588D] hover:underline flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" />
                        {nuevoChofer.foto_url ? 'Foto cargada (Cambiar)' : 'Subir foto del chofer'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            leerArchivoBase64(e.target.files?.[0], (url) =>
                              setNuevoChofer((prev) => ({ ...prev, foto_url: url }))
                            )
                          }
                        />
                      </label>
                    </div>
                  </div>
                  <button type="submit" className="px-4 py-2 bg-[#34B37B] text-white font-bold rounded-xl text-xs">
                    Guardar Chofer en Plantel
                  </button>
                </form>
              </div>
            </div>
          )}
          {/* PESTAÑA 6: PRESTADORES Y DOMICILIO DE BASE OPERATIVA */}
          {tabAdmin === 'PRESTADORES' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                {prestadores.map((p) => (
                  <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 shadow-xs">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{p.razon_social}</h4>
                        <p className="text-xs text-slate-500">CUIT: {p.cuit} • Zona: {p.zona_cobertura}</p>
                        <p className="text-xs text-slate-500">Guardia 24hs: {p.telefono_guardia}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full">
                          Homologado
                        </span>
                        <button
                          type="button"
                          onClick={() => setPrestadorEditando({ ...p })}
                          className="p-1.5 text-slate-500 hover:text-[#1E588D] hover:bg-slate-100 rounded-lg"
                          title="Modificar prestador y domicilio base"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => eliminarPrestador(p)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                          title="Eliminar prestador"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[#1E588D] block text-[11px]">
                          📍 Domicilio Base Operativa (Inicio Odómetro KM):
                        </span>
                        <span className="text-slate-700 font-semibold">
                          {p.domicilio_base || 'Av. Moreno 37, San Rafael'} (CP {p.codigo_postal_base || '5600'})
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBuscandoGeo(true);
                  const coords = nuevoPrestador.domicilio_base
                    ? await buscarCoordenadasDireccion(nuevoPrestador.domicilio_base)
                    : null;
                  setBuscandoGeo(false);
                  const payloadBase = {
                    razon_social: nuevoPrestador.razon_social,
                    cuit: nuevoPrestador.cuit,
                    zona_cobertura: nuevoPrestador.zona_cobertura,
                    telefono_guardia: nuevoPrestador.telefono_guardia,
                    habilitado_operar: true,
                  };
                  const payloadExt = {
                    ...payloadBase,
                    domicilio_base: nuevoPrestador.domicilio_base,
                    codigo_postal_base: nuevoPrestador.codigo_postal_base || coords?.cp || '5600',
                    base_lat: coords?.lat || -34.6158,
                    base_lng: coords?.lng || -68.3285,
                  };
                  let { data, error } = await supabase.from('prestadores').insert([payloadExt]).select().single();
                  if (error) {
                    const retry = await supabase.from('prestadores').insert([payloadBase]).select().single();
                    data = retry.data;
                    error = retry.error;
                  }
                  if (error) {
                    alert('Error guardando prestador: ' + error.message);
                    return;
                  }
                  setPrestadores([...prestadores, { ...payloadExt, ...(data || {}) }]);
                  setNuevoPrestador({
                    razon_social: '',
                    cuit: '',
                    domicilio_base: 'Av. Moreno 37, San Rafael, Mendoza',
                    codigo_postal_base: '5600',
                    base_lat: -34.6158,
                    base_lng: -68.3285,
                    zona_cobertura: 'San Rafael, Mendoza',
                    telefono_guardia: '',
                  });
                }}
                className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 h-fit"
              >
                <h4 className="font-bold text-sm text-slate-900">
                  Dar de Alta Nuevo Prestador y Domicilio de Base Operativa
                </h4>
                <p className="text-xs text-slate-500">
                  El domicilio de base es el punto cero desde donde comienza el odómetro a contar los kilómetros.
                </p>
                <input
                  required
                  placeholder="Razón Social (ej: Erquenci S.A.S.)"
                  value={nuevoPrestador.razon_social}
                  onChange={(e) => setNuevoPrestador({ ...nuevoPrestador, razon_social: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 text-xs"
                />
                <input
                  required
                  placeholder="CUIT"
                  value={nuevoPrestador.cuit}
                  onChange={(e) => setNuevoPrestador({ ...nuevoPrestador, cuit: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 text-xs"
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    required
                    placeholder="Domicilio Base Operativa (ej: Av. Moreno 37, San Rafael)"
                    value={nuevoPrestador.domicilio_base}
                    onChange={(e) => setNuevoPrestador({ ...nuevoPrestador, domicilio_base: e.target.value })}
                    className="sm:col-span-2 w-full border rounded-xl px-3 py-2 text-xs font-semibold"
                  />
                  <input
                    required
                    placeholder="CP Base (ej: 5600)"
                    value={nuevoPrestador.codigo_postal_base}
                    onChange={(e) => setNuevoPrestador({ ...nuevoPrestador, codigo_postal_base: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 text-xs font-bold text-[#1E588D]"
                  />
                </div>
                <input
                  required
                  placeholder="Zona de Cobertura"
                  value={nuevoPrestador.zona_cobertura}
                  onChange={(e) => setNuevoPrestador({ ...nuevoPrestador, zona_cobertura: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 text-xs"
                />
                <input
                  required
                  placeholder="Teléfono de Guardia"
                  value={nuevoPrestador.telefono_guardia}
                  onChange={(e) => setNuevoPrestador({ ...nuevoPrestador, telefono_guardia: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 text-xs"
                />
                <button
                  type="submit"
                  disabled={buscandoGeo}
                  className="px-4 py-2 bg-[#34B37B] text-white font-bold rounded-xl text-xs"
                >
                  {buscandoGeo ? 'Ubicando Base GPS...' : 'Homologar Prestador en Supabase'}
                </button>
              </form>
            </div>
          )}
          </div>
        </main>
      )}
      {/* ==================================================================== */}
      {/* MODAL DE EDICIÓN DE VEHÍCULO Y SUS 5 VENCIMIENTOS                    */}
      {/* ==================================================================== */}
      {vehiculoEditando && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-2.5">
              <h3 className="font-bold text-sm text-slate-900">
                Modificar Vehículo ({vehiculoEditando.patente}) y Vencimientos
              </h3>
              <button onClick={() => setVehiculoEditando(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={guardarEdicionVehiculo} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-600">Patente</label>
                  <input
                    required
                    value={vehiculoEditando.patente}
                    onChange={(e) => setVehiculoEditando({ ...vehiculoEditando, patente: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 mt-0.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600">Modelo</label>
                  <input
                    required
                    value={vehiculoEditando.modelo}
                    onChange={(e) => setVehiculoEditando({ ...vehiculoEditando, modelo: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 mt-0.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600">Categoría</label>
                  <select
                    value={vehiculoEditando.tipo_movilidad}
                    onChange={(e) => setVehiculoEditando({ ...vehiculoEditando, tipo_movilidad: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 mt-0.5 bg-white"
                  >
                    <option value="AMPLIO_150KG_SILLA">Amplio (+150 kg / Silla Ruedas)</option>
                    <option value="UTILITARIO_ADAPTADO">Utilitario / Rampa Adaptado</option>
                    <option value="AMBULATORIO">Ambulatorio Estándar</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-600">Chofer Asignado</label>
                  <select
                    value={vehiculoEditando.chofer_id || ''}
                    onChange={(e) => setVehiculoEditando({ ...vehiculoEditando, chofer_id: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 mt-0.5 bg-white"
                  >
                    {choferes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-600">1. Venc. Seguro</label>
                  <input
                    type="date"
                    value={vehiculoEditando.seguro_venc}
                    onChange={(e) => setVehiculoEditando({ ...vehiculoEditando, seguro_venc: e.target.value })}
                    className="w-full border rounded-xl px-3 py-1.5 mt-0.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600">2. Venc. Habilitación Transp.</label>
                  <input
                    type="date"
                    value={vehiculoEditando.hab_venc}
                    onChange={(e) => setVehiculoEditando({ ...vehiculoEditando, hab_venc: e.target.value })}
                    className="w-full border rounded-xl px-3 py-1.5 mt-0.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600">3. Venc. RTO</label>
                  <input
                    type="date"
                    value={vehiculoEditando.rto_venc}
                    onChange={(e) => setVehiculoEditando({ ...vehiculoEditando, rto_venc: e.target.value })}
                    className="w-full border rounded-xl px-3 py-1.5 mt-0.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600">4. Venc. Matafuegos</label>
                  <input
                    type="date"
                    value={vehiculoEditando.matafuegos_venc}
                    onChange={(e) => setVehiculoEditando({ ...vehiculoEditando, matafuegos_venc: e.target.value })}
                    className="w-full border rounded-xl px-3 py-1.5 mt-0.5"
                  />
                </div>
                <div className="col-span-2">
                  <label className="font-bold text-slate-600">5. Venc. Certificado de Desinfección</label>
                  <input
                    type="date"
                    value={vehiculoEditando.desinfeccion_venc}
                    onChange={(e) => setVehiculoEditando({ ...vehiculoEditando, desinfeccion_venc: e.target.value })}
                    className="w-full border rounded-xl px-3 py-1.5 mt-0.5"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVehiculoEditando(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-[#1E588D] text-white rounded-xl font-bold">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ==================================================================== */}
      {/* MODAL DE EDICIÓN DE CHOFER Y LICENCIA                                */}
      {/* ==================================================================== */}
      {choferEditando && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-2.5">
              <h3 className="font-bold text-sm text-slate-900">Modificar Chofer y Vencimiento de Licencia</h3>
              <button onClick={() => setChoferEditando(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={guardarEdicionChofer} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-600">Empresa Prestadora</label>
                <select
                  value={choferEditando.prestador_id}
                  onChange={(e) => setChoferEditando({ ...choferEditando, prestador_id: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 mt-0.5 bg-white"
                >
                  {prestadores.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.razon_social}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-600">Nombre y Apellido</label>
                <input
                  required
                  value={choferEditando.nombre}
                  onChange={(e) => setChoferEditando({ ...choferEditando, nombre: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 mt-0.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-600">DNI</label>
                  <input
                    value={choferEditando.dni || ''}
                    onChange={(e) => setChoferEditando({ ...choferEditando, dni: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 mt-0.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600">Teléfono WhatsApp</label>
                  <input
                    value={choferEditando.telefono || ''}
                    onChange={(e) => setChoferEditando({ ...choferEditando, telefono: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 mt-0.5"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-600">Vencimiento Licencia de Conducir</label>
                <input
                  type="date"
                  required
                  value={choferEditando.licencia_venc}
                  onChange={(e) => setChoferEditando({ ...choferEditando, licencia_venc: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 mt-0.5"
                />
              </div>
              <div className="flex items-center gap-3 border rounded-xl p-2 bg-slate-50">
                <img
                  src={
                    choferEditando.foto_url ||
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
                  }
                  alt={choferEditando.nombre}
                  className="w-10 h-10 rounded-full object-cover border"
                />
                <label className="cursor-pointer font-bold text-[#1E588D] hover:underline">
                  Cambiar foto del chofer
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      leerArchivoBase64(e.target.files?.[0], (url) =>
                        setChoferEditando((prev) => ({ ...prev, foto_url: url }))
                      )
                    }
                  />
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setChoferEditando(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-[#34B37B] text-white rounded-xl font-bold">
                  Guardar Chofer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ==================================================================== */}
      {/* MODAL DE EDICIÓN DE PRESTADOR Y DOMICILIO DE BASE OPERATIVA          */}
      {/* ==================================================================== */}
      {prestadorEditando && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-2.5">
              <h3 className="font-bold text-sm text-slate-900">Modificar Prestador y Domicilio Base (Odómetro)</h3>
              <button onClick={() => setPrestadorEditando(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={guardarEdicionPrestador} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-600">Razón Social</label>
                <input
                  required
                  value={prestadorEditando.razon_social}
                  onChange={(e) => setPrestadorEditando({ ...prestadorEditando, razon_social: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 mt-0.5"
                />
              </div>
              <div>
                <label className="font-bold text-slate-600">CUIT</label>
                <input
                  required
                  value={prestadorEditando.cuit}
                  onChange={(e) => setPrestadorEditando({ ...prestadorEditando, cuit: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 mt-0.5"
                />
              </div>
              <div>
                <label className="font-bold text-[#1E588D]">
                  Domicilio de Base Operativa (Donde inicia el odómetro a contar KM)
                </label>
                <div className="flex gap-1.5 mt-0.5">
                  <input
                    required
                    value={prestadorEditando.domicilio_base || ''}
                    onChange={(e) => setPrestadorEditando({ ...prestadorEditando, domicilio_base: e.target.value })}
                    className="flex-1 border rounded-xl px-3 py-2 font-semibold"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      const coords = await buscarCoordenadasDireccion(prestadorEditando.domicilio_base || '');
                      if (coords) {
                        setPrestadorEditando((prev) => ({
                          ...prev,
                          base_lat: coords.lat,
                          base_lng: coords.lng,
                          codigo_postal_base: coords.cp || prev.codigo_postal_base,
                        }));
                        alert(`Base GPS actualizada: Lat ${coords.lat.toFixed(4)}, Lng ${coords.lng.toFixed(4)}`);
                      }
                    }}
                    className="px-2.5 py-2 bg-blue-50 text-[#1E588D] font-bold rounded-xl border border-blue-200"
                  >
                    Ubicar GPS
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-600">Código Postal Base</label>
                  <input
                    required
                    value={prestadorEditando.codigo_postal_base || '5600'}
                    onChange={(e) =>
                      setPrestadorEditando({ ...prestadorEditando, codigo_postal_base: e.target.value })
                    }
                    className="w-full border rounded-xl px-3 py-2 mt-0.5 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600">Teléfono Guardia</label>
                  <input
                    required
                    value={prestadorEditando.telefono_guardia}
                    onChange={(e) =>
                      setPrestadorEditando({ ...prestadorEditando, telefono_guardia: e.target.value })
                    }
                    className="w-full border rounded-xl px-3 py-2 mt-0.5"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-600">Zona de Cobertura</label>
                <input
                  required
                  value={prestadorEditando.zona_cobertura}
                  onChange={(e) => setPrestadorEditando({ ...prestadorEditando, zona_cobertura: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 mt-0.5"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPrestadorEditando(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-[#1E588D] text-white rounded-xl font-bold">
                  Guardar Prestador
                </button>
              </div>
            </form>
          </div>
        </div>
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
                  <Edit3 className="w-4 h-4 text-[#1E588D]" /> Editar Traslado, Chofer, Liquidación y Condiciones
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
                    <option value="REALIZADO">REALIZADO</option>
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
                  <label className="block font-semibold text-slate-600 mb-1">N° Siniestro / Autorización</label>
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
                    value={trasladoEditando.hora_programada || '08:30'}
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
                        {v.patente} — {v.modelo}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Chofer Asignado (Independiente)</label>
                  <select
                    value={trasladoEditando.chofer_id || ''}
                    onChange={(e) => setTrasladoEditando({ ...trasladoEditando, chofer_id: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 bg-white font-semibold"
                  >
                    {choferes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} (Lic: {c.licencia_venc})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-600 mb-1">Esquema de Liquidación ART</label>
                  <select
                    value={trasladoEditando.esquema_liquidacion || 'TRAMO_2_URBANO'}
                    onChange={(e) => setTrasladoEditando({ ...trasladoEditando, esquema_liquidacion: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 bg-white font-semibold text-[#1E588D]"
                  >
                    {Object.entries(ESQUEMAS_LIQUIDACION_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
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
      {/* VISTA 2: TERMINAL MÓVIL DEL CHOFER (ACCESO INDEPENDIENTE)            */}
      {/* ==================================================================== */}
      {rolActivo === 'CHOFER' && (
        <main className="max-w-xl w-full mx-auto px-4 py-6 space-y-5">
          {trasladosDelChoferActivo.length > 1 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-3.5 space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-slate-500 block">
                Hoja de Ruta de Matías ({trasladosDelChoferActivo.length} Traslados Asignados):
              </label>
              <select
                value={viajeActivo?.id || ''}
                onChange={(e) => setViajeSeleccionadoId(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-[#1E588D] bg-slate-50"
              >
                {trasladosDelChoferActivo.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fecha_programada} ({t.hora_programada || ''} hs) — {t.paciente_nombre} ({t.estado})
                  </option>
                ))}
              </select>
            </div>
          )}
          {!viajeActivo ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-600">
              No hay traslados activos asignados en este momento.
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      choferAsignadoViaje?.foto_url ||
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
                    }
                    alt="Chofer"
                    className="w-12 h-12 rounded-full object-cover border-2 border-[#34B37B]"
                  />
                  <div>
                    <h2 className="font-bold text-sm text-slate-900">{choferAsignadoViaje?.nombre || 'Matías Emanuel Gatica'}</h2>
                    <p className="text-xs text-slate-500">
                      {vehiculoAsignado?.modelo || 'Peugeot 408'} • <strong>{vehiculoAsignado?.patente || 'AB 635 BN'}</strong>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => (gpsRealActivo ? detenerGpsRealDispositivo() : activarGpsRealDispositivo(false))}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 border ${
                      gpsRealActivo ? 'bg-emerald-600 text-white border-emerald-700 animate-pulse' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50'
                    }`}
                  >
                    <Navigation className="w-3.5 h-3.5" /> {gpsRealActivo ? '📡 GPS En Vivo' : 'Activar GPS'}
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
                    <p className="text-xs text-slate-500">
                      DNI: {viajeActivo.paciente_dni} • {viajeActivo.fecha_programada} ({viajeActivo.hora_programada} hs)
                    </p>
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
                  <div><strong>Base Operativa:</strong> {prestadorAsignado?.domicilio_base || 'Av. Moreno 37, San Rafael'}</div>
                  <div><strong>Retirar Paciente en:</strong> {viajeActivo.origen_direccion}</div>
                  <div><strong>Llevar a:</strong> {viajeActivo.destino_nombre}</div>
                  <div><strong>Modalidad:</strong> {viajeActivo.modalidad_viaje === 'IDA_VUELTA' ? 'Ida y Vuelta' : 'Solo Ida'}</div>
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
                    disabled={viajeActivo.estado === 'REALIZADO' || viajeActivo.estado === 'FINALIZADO'}
                    onSave={(dataUrl) =>
                      cambiarEstadoViaje(viajeActivo.id, 'REALIZADO', { firma_url: dataUrl, gps_progreso: 100 })
                    }
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
      {/* VISTA 3: PORTAL SEGURO DEL PACIENTE (ACCESO INDEPENDIENTE)           */}
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
                  <p className="text-xs text-blue-100 mt-0.5">
                    Estado actual: <strong>{viajeActivo.estado.replace(/_/g, ' ')}</strong>
                  </p>
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
                    patente={vehiculoAsignado?.patente || 'AB 635 BN'}
                    choferNombre={choferAsignadoViaje?.nombre || 'Matías Emanuel Gatica'}
                    coordsReales={viajeActivo.coords_reales}
                  />
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          choferAsignadoViaje?.foto_url ||
                          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
                        }
                        alt={choferAsignadoViaje?.nombre}
                        className="w-14 h-14 rounded-full object-cover border-2 border-[#34B37B]"
                      />
                      <div>
                        <div className="text-[11px] font-bold text-[#34B37B] uppercase">Tu Chofer Asignado</div>
                        <h3 className="font-bold text-base text-slate-900">{choferAsignadoViaje?.nombre || 'Matías Emanuel Gatica'}</h3>
                        <p className="text-xs text-slate-600">
                          {vehiculoAsignado?.modelo || 'Peugeot 408'} • Patente: <strong>{vehiculoAsignado?.patente || 'AB 635 BN'}</strong>
                        </p>
                      </div>
                    </div>
                    <a href={`tel:${choferAsignadoViaje?.telefono || prestadorAsignado?.telefono_guardia}`} className="p-3 bg-blue-50 text-[#1E588D] rounded-full">
                      <Phone className="w-5 h-5" />
                    </a>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl text-xs space-y-2 text-slate-700">
                    <div><strong>Fecha y Hora:</strong> {viajeActivo.fecha_programada} • {viajeActivo.hora_programada || ''} hs</div>
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
