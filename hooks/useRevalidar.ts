"use client";

import { useEffect, useRef } from "react";

// NUEVO (21/10/2026): "datos frescos" sin recargar la página.
//
// Problema que resuelve: la página pedía sus datos UNA sola vez al montar
// (inscripción, usuario, progreso...) y nunca más. Si el estado cambiaba
// afuera (la coordinadora confirma un pago, la persona verifica su correo
// desde Gmail), la pantalla seguía mostrando el estado viejo hasta que se
// cerraba y reabría el navegador.
//
// Es el mismo patrón que usan SWR y TanStack Query ("revalidate on focus")
// y las pantallas de espera de pago de Stripe/MercadoPago (polling):
//
//   1. EVENTOS: cada vez que la persona vuelve a esta pestaña (cambia de
//      app, desbloquea el celular, recupera internet) se vuelve a pedir
//      el dato. Cubre el caso "fui a Gmail y regresé".
//   2. POLLING (opcional): mientras la pantalla está ESPERANDO algo (pago
//      en revisión, correo sin verificar) se vuelve a preguntar cada
//      `intervaloMs`, pero SOLO con la pestaña visible — en segundo plano
//      no se gasta red ni batería.
//
// No hace el fetch por sí mismo: recibe un `callback` que ya sabe cómo
// pedir y guardar los datos. Así sirve para cualquier pantalla.

type Opciones = {
  // false = no escucha nada (ej. no hay sesión todavía).
  activo?: boolean;
  // null/undefined = sin polling, solo eventos de foco/visibilidad.
  intervaloMs?: number | null;
  // Mínimo entre dos revalidaciones disparadas por EVENTOS, para que
  // alternar rápido de pestaña no bombardee al backend. No limita al
  // polling (ese ya tiene su propio intervalo).
  minEntreEventosMs?: number;
};

export function useRevalidar(
  callback: () => void | Promise<unknown>,
  {
    activo = true,
    intervaloMs = null,
    minEntreEventosMs = 5000,
  }: Opciones = {},
) {
  // El callback se guarda en un ref para que cambiar su identidad (que
  // pasa en cada render si no está memorizado) no reinicie los listeners
  // ni el intervalo.
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!activo) return;

    let ultimoEvento = 0;

    function porEvento() {
      if (document.visibilityState !== "visible") return;
      const ahora = Date.now();
      if (ahora - ultimoEvento < minEntreEventosMs) return;
      ultimoEvento = ahora;
      void callbackRef.current();
    }

    document.addEventListener("visibilitychange", porEvento);
    window.addEventListener("focus", porEvento);
    window.addEventListener("online", porEvento);

    let intervalo: ReturnType<typeof setInterval> | null = null;
    if (intervaloMs && intervaloMs > 0) {
      intervalo = setInterval(() => {
        if (document.visibilityState !== "visible") return;
        void callbackRef.current();
      }, intervaloMs);
    }

    return () => {
      document.removeEventListener("visibilitychange", porEvento);
      window.removeEventListener("focus", porEvento);
      window.removeEventListener("online", porEvento);
      if (intervalo) clearInterval(intervalo);
    };
  }, [activo, intervaloMs, minEntreEventosMs]);
}
