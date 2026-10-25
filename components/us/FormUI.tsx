"use client";

import {
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { Eye, EyeOff } from "lucide-react";
import { useUsLocale } from "@/contexts/UsLocaleContext";

// NUEVO (24/10/2026): piezas de formulario comunes de /us (cuenta, pago).
// Texto de 16 px en los campos (evita el zoom automático de iOS), alto táctil
// de 44 px, etiqueta siempre visible y errores enlazados con aria-describedby.

const estiloCampo =
  "min-h-11 w-full rounded-lg border border-neutral-bg bg-white px-4 py-2.5 text-base text-neutral-text focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-blue disabled:opacity-60 aria-[invalid=true]:border-brand-pink";

type CampoBase = {
  etiqueta: string;
  ayuda?: string;
  error?: string;
};

export function Campo({
  etiqueta,
  ayuda,
  error,
  className = "",
  ...input
}: CampoBase & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const idAyuda = `${id}-ayuda`;
  const idError = `${id}-error`;
  const describedby = [ayuda ? idAyuda : "", error ? idError : ""].filter(Boolean).join(" ");

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-neutral-text">
        {etiqueta}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedby || undefined}
        className={estiloCampo}
        {...input}
      />
      {ayuda && (
        <p id={idAyuda} className="mt-1 text-xs text-neutral-text/70">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={idError} className="mt-1 text-sm text-brand-pink">
          {error}
        </p>
      )}
    </div>
  );
}

export function CampoPassword({
  etiqueta,
  ayuda,
  error,
  className = "",
  ...input
}: CampoBase & Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const id = useId();
  const { t } = useUsLocale();
  const [visible, setVisible] = useState(false);
  const idAyuda = `${id}-ayuda`;
  const idError = `${id}-error`;
  const describedby = [ayuda ? idAyuda : "", error ? idError : ""].filter(Boolean).join(" ");

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-neutral-text">
        {etiqueta}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedby || undefined}
          className={`${estiloCampo} pr-12`}
          {...input}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t("campo.ocultar") : t("campo.mostrar")}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-neutral-text/70 hover:text-brand-blue focus-visible:outline-2 focus-visible:outline-brand-blue"
        >
          {visible ? <EyeOff aria-hidden size={20} /> : <Eye aria-hidden size={20} />}
        </button>
      </div>
      {ayuda && (
        <p id={idAyuda} className="mt-1 text-xs text-neutral-text/70">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={idError} className="mt-1 text-sm text-brand-pink">
          {error}
        </p>
      )}
    </div>
  );
}

export function Selector({
  etiqueta,
  ayuda,
  error,
  className = "",
  children,
  ...select
}: CampoBase & SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  const id = useId();
  const idError = `${id}-error`;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-neutral-text">
        {etiqueta}
      </label>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? idError : undefined}
        className={estiloCampo}
        {...select}
      >
        {children}
      </select>
      {ayuda && <p className="mt-1 text-xs text-neutral-text/70">{ayuda}</p>}
      {error && (
        <p id={idError} className="mt-1 text-sm text-brand-pink">
          {error}
        </p>
      )}
    </div>
  );
}

export function BotonPrimario({
  cargando = false,
  textoCargando,
  children,
  className = "",
  disabled,
  ...boton
}: {
  cargando?: boolean;
  textoCargando?: string;
  children: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      disabled={disabled || cargando}
      className={`inline-flex min-h-11 items-center justify-center rounded-full bg-brand-pink px-6 text-base font-semibold text-white transition hover:bg-brand-pink/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...boton}
    >
      {cargando && textoCargando ? textoCargando : children}
    </button>
  );
}

// Error de formulario: se anuncia a lectores de pantalla (role="alert").
export function MensajeError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="rounded-lg border border-brand-pink/40 bg-brand-pink/5 px-4 py-3 text-sm text-brand-pink"
    >
      {children}
    </p>
  );
}

// Carcasa de las pantallas de cuenta: tarjeta centrada con título.
export function TarjetaAuth({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-10 sm:py-14">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-bg sm:p-8">
        <h1 className="font-display text-2xl font-semibold text-brand-blue">{titulo}</h1>
        {subtitulo && <p className="mt-2 text-sm text-neutral-text/80">{subtitulo}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}