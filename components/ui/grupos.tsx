"use client";

// NUEVO (18/09/2026) — piezas compartidas por las 3 pantallas de
// seguimiento de grupos (lista, detalle del grupo y ficha de estudiante),
// para que la barra de progreso, las etiquetas de estado y el formato de
// fechas se vean y se comporten igual en las tres.
//
// Los helpers de fecha son funciones de módulo (no viven dentro de un
// componente) a propósito: usan Date.now(), y el linter de React marca
// esas llamadas si están directamente en el cuerpo de un componente.

import {
  CheckCircle2,
  Clock,
  CircleDashed,
  UserX,
  type LucideIcon,
} from "lucide-react";

export type EstadoEstudiante =
  | "completado"
  | "en_curso"
  | "sin_iniciar"
  | "inactiva";

export function formatearFecha(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-DO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function haceCuanto(iso: string | null | undefined): string {
  if (!iso) return "Sin actividad";
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (dias <= 0) return "Hoy";
  if (dias === 1) return "Ayer";
  return `Hace ${dias} días`;
}

export function calcularEdad(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const nacimiento = new Date(iso);
  const hoy = new Date();
  let edad = hoy.getUTCFullYear() - nacimiento.getUTCFullYear();
  const yaCumplio =
    hoy.getUTCMonth() > nacimiento.getUTCMonth() ||
    (hoy.getUTCMonth() === nacimiento.getUTCMonth() &&
      hoy.getUTCDate() >= nacimiento.getUTCDate());
  if (!yaCumplio) edad -= 1;
  return edad;
}

export function BarraProgreso({
  porcentaje,
  alto = "h-2",
}: {
  porcentaje: number;
  alto?: string;
}) {
  const valor = Math.max(0, Math.min(100, porcentaje));
  return (
    <div
      className={`w-full ${alto} rounded-full bg-neutral-bg overflow-hidden`}
      role="progressbar"
      aria-valuenow={valor}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`${alto} rounded-full ${valor >= 100 ? "bg-status-success" : "bg-brand-blue"}`}
        style={{ width: `${valor}%` }}
      />
    </div>
  );
}

const ESTILO_ESTADO: Record<
  EstadoEstudiante,
  { texto: string; clase: string; Icono: typeof Clock }
> = {
  completado: {
    texto: "Completó la teoría",
    clase: "bg-status-success/15 text-status-success",
    Icono: CheckCircle2,
  },
  en_curso: {
    texto: "En curso",
    clase: "bg-brand-blue/10 text-brand-blue",
    Icono: Clock,
  },
  sin_iniciar: {
    texto: "Sin iniciar",
    clase: "bg-neutral-bg text-neutral-text",
    Icono: CircleDashed,
  },
  inactiva: {
    texto: "Cuenta inactiva",
    clase: "bg-neutral-bg text-neutral-text/60",
    Icono: UserX,
  },
};

export function EtiquetaEstadoEstudiante({
  estado,
}: {
  estado: EstadoEstudiante;
}) {
  const { texto, clase, Icono } = ESTILO_ESTADO[estado];
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${clase}`}
    >
      <Icono size={12} /> {texto}
    </span>
  );
}

// Tarjeta de indicador (icono + número grande + etiqueta). `alerta` la pinta
// en ámbar — se usa para lo que requiere seguimiento (estudiantes rezagadas).
export function Indicador({
  Icono,
  valor,
  etiqueta,
  detalle,
  alerta = false,
}: {
  Icono: LucideIcon;
  valor: number | string;
  etiqueta: string;
  detalle?: string;
  alerta?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${alerta ? "bg-amber-50 border-amber-200" : "bg-white border-neutral-bg"}`}
    >
      <Icono size={18} className={alerta ? "text-amber-700" : "text-brand-blue"} />
      <p
        className={`font-display text-2xl font-bold mt-1 ${alerta ? "text-amber-700" : "text-brand-blue"}`}
      >
        {valor}
      </p>
      <p className="text-xs text-neutral-text">{etiqueta}</p>
      {detalle && <p className="text-[11px] text-neutral-text/60 mt-0.5">{detalle}</p>}
    </div>
  );
}