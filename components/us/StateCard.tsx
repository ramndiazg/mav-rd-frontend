"use client";

import { AlertTriangle, ExternalLink } from "lucide-react";
import { useUsLocale } from "@/contexts/UsLocaleContext";
import { ESTADOS_INFO, type EstadoUS } from "@/lib/us/estados";

// NUEVO (24/10/2026): ficha de un estado (landing e inscripción).
//  - Sin `onSelect`: tarjeta informativa (landing).
//  - Con `onSelect`: radio accesible (se elige con teclado y lector de pantalla).
// La advertencia de Florida (examen solo en inglés) lleva ícono Y texto: no
// depende del color.
export default function StateCard({
  estado,
  seleccionado = false,
  onSelect,
  nombreGrupo = "estadoUS",
}: {
  estado: EstadoUS;
  seleccionado?: boolean;
  onSelect?: (estado: EstadoUS) => void;
  nombreGrupo?: string;
}) {
  const { t, locale } = useUsLocale();
  const info = ESTADOS_INFO[estado];
  const seleccionable = !!onSelect;

  const contenido = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-semibold text-brand-blue">
            {info.nombre[locale]}
          </h3>
          <p className="text-xs text-neutral-text/70">
            {t("land.estado.organismo", { organismo: info.organismo })}
          </p>
        </div>
        <span
          aria-hidden
          className="rounded-md bg-brand-blue px-2 py-1 text-sm font-bold text-white"
        >
          {estado}
        </span>
      </div>

      {info.soloIngles && (
        <p className="mt-3 flex items-center gap-2 rounded-md bg-status-warning/15 px-3 py-2 text-sm font-semibold text-neutral-text">
          <AlertTriangle aria-hidden size={18} className="shrink-0 text-status-warning" />
          {t("land.estado.soloIngles")}
        </p>
      )}

      <p className="mt-3 text-sm font-medium text-neutral-text">{t("land.estado.examen")}</p>
      <p className="mt-1 text-sm leading-relaxed text-neutral-text/80">{info.examen[locale]}</p>

      <a
        href={info.sitio}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-blue underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-brand-blue"
      >
        {t("land.estado.verificar", { organismo: info.organismo })}
        <ExternalLink aria-hidden size={14} />
      </a>
    </>
  );

  if (!seleccionable) {
    return (
      <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-bg">
        {contenido}
      </article>
    );
  }

  return (
    <label
      className={`block cursor-pointer rounded-2xl bg-white p-5 shadow-sm ring-2 transition has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand-blue ${seleccionado ? "ring-brand-pink" : "ring-neutral-bg hover:ring-brand-blue/40"
        }`}
    >
      <input
        type="radio"
        name={nombreGrupo}
        value={estado}
        checked={seleccionado}
        onChange={() => onSelect?.(estado)}
        className="sr-only"
        aria-label={t("land.estado.elegir", { estado: info.nombre[locale] })}
      />
      {contenido}
    </label>
  );
}