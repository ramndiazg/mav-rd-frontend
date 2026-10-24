"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  LOCALE_KEY,
  detectarLocale,
  esLocale,
  interpolar,
  type Locale,
} from "@/lib/us/i18n";
import { dict, type DictKey } from "@/lib/us/dict";
import { mensajeDeError } from "@/lib/us/api";

// NUEVO (24/10/2026): idioma de la interfaz de /us/*. Ver lib/us/i18n.ts.
//
// El idioma es una "tienda externa" (URL + localStorage + preferencia del
// navegador), por eso se lee con useSyncExternalStore: el servidor y la
// primera pintura del cliente usan "es" (sin desajuste de hidratación) y
// enseguida React cambia al idioma detectado si es otro.

type Traductor = (clave: DictKey, vars?: Record<string, string | number>) => string;

type UsLocaleContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Traductor;
  // Mensaje listo para mostrar a partir de cualquier error (ver mensajeDeError).
  mensajeError: (error: unknown) => string;
};

const UsLocaleContext = createContext<UsLocaleContextType | undefined>(undefined);

// --- tienda externa del idioma ---------------------------------------------
let idiomaElegido: Locale | null = null; // lo que la persona eligió en esta pestaña
const suscriptores = new Set<() => void>();

function suscribir(avisar: () => void) {
  suscriptores.add(avisar);
  window.addEventListener("storage", avisar); // otra pestaña cambió el idioma
  return () => {
    suscriptores.delete(avisar);
    window.removeEventListener("storage", avisar);
  };
}

function snapshotCliente(): Locale {
  return idiomaElegido ?? detectarLocale();
}

function snapshotServidor(): Locale {
  return "es";
}

function elegirIdioma(locale: Locale) {
  idiomaElegido = locale;
  try {
    window.localStorage.setItem(LOCALE_KEY, locale);
  } catch {
    // localStorage bloqueado: el idioma vale solo para esta pestaña.
  }
  // Si la URL trae ?lang=, se actualiza para que un refresco no lo revierta.
  const url = new URL(window.location.href);
  if (url.searchParams.has("lang")) {
    url.searchParams.set("lang", locale);
    window.history.replaceState(null, "", url);
  }
  suscriptores.forEach((avisar) => avisar());
}

export function UsLocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(suscribir, snapshotCliente, snapshotServidor);

  // El layout raíz de RD fija lang="es": en /us se mantiene al día.
  useEffect(() => {
    document.documentElement.lang = locale;
    return () => {
      document.documentElement.lang = "es";
    };
  }, [locale]);

  const t = useCallback<Traductor>(
    (clave, vars) => interpolar(dict[locale][clave] ?? clave, vars),
    [locale],
  );

  const mensajeError = useCallback(
    (error: unknown) =>
      mensajeDeError(error, t, locale, dict[locale] as Record<string, string>),
    [t, locale],
  );

  const valor = useMemo(
    () => ({
      locale,
      setLocale: (nuevo: Locale) => {
        if (esLocale(nuevo)) elegirIdioma(nuevo);
      },
      t,
      mensajeError,
    }),
    [locale, t, mensajeError],
  );

  return <UsLocaleContext.Provider value={valor}>{children}</UsLocaleContext.Provider>;
}

export function useUsLocale() {
  const contexto = useContext(UsLocaleContext);
  if (!contexto) {
    throw new Error("useUsLocale debe usarse dentro de un UsLocaleProvider");
  }
  return contexto;
}