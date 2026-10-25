"use client";

import { useEffect, useState } from "react";

// NUEVO (24/10/2026): reloj para pantallas con cuenta regresiva. Devuelve la
// hora actual en ms (null hasta el primer tic). El reloj se lee SOLO dentro de
// callbacks de temporizador — nunca durante el render, que debe ser puro.
export function useAhora(activo: boolean, intervaloMs = 1000): number | null {
  const [ahora, setAhora] = useState<number | null>(null);

  useEffect(() => {
    if (!activo) return;
    const primero = window.setTimeout(() => setAhora(Date.now()), 0);
    const repetido = window.setInterval(
      () => setAhora(Date.now()),
      intervaloMs,
    );
    return () => {
      window.clearTimeout(primero);
      window.clearInterval(repetido);
    };
  }, [activo, intervaloMs]);

  return ahora;
}
