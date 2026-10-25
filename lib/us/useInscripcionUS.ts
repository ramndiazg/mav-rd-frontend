"use client";

import { useCallback, useEffect, useState } from "react";
import { useUsLocale } from "@/contexts/UsLocaleContext";
import { usFetch } from "@/lib/us/api";
import type { ConfigPagoUS, EstadoPago, InscripcionUS } from "@/lib/us/pagos";

// NUEVO (24/10/2026): carga la configuración de pago y la inscripción de la
// estudiante (las usan enroll, pay y pending).
//   inscripcion: undefined = cargando · null = aún no tiene · objeto = tiene.

export function useInscripcionUS() {
  const { locale, mensajeError } = useUsLocale();
  const [config, setConfig] = useState<ConfigPagoUS | null>(null);
  const [inscripcion, setInscripcion] = useState<
    InscripcionUS | null | undefined
  >(undefined);
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let cancelado = false;

    async function traer() {
      try {
        const [datosConfig, datosInscripcion] = await Promise.all([
          usFetch<ConfigPagoUS>("/us/config/pago", {
            locale,
            cache: "no-store",
          }),
          usFetch<InscripcionUS | null>("/us/inscripcion/me", {
            locale,
            cache: "no-store",
          }),
        ]);
        if (cancelado) return;
        setError("");
        setConfig(datosConfig);
        setInscripcion(datosInscripcion);
      } catch (e) {
        if (cancelado) return;
        setError(mensajeError(e));
        setInscripcion((previa) => (previa === undefined ? null : previa));
      }
    }

    void traer();
    return () => {
      cancelado = true;
    };
  }, [locale, mensajeError, intento]);

  // Botón "Reintentar": vuelve a ejecutar la carga.
  const cargar = useCallback(async () => {
    setError("");
    setIntento((n) => n + 1);
  }, []);

  // Solo la inscripción (sondeo de /us/pending). true si la consulta funcionó.
  const recargarInscripcion = useCallback(async (): Promise<boolean> => {
    try {
      const datos = await usFetch<InscripcionUS | null>("/us/inscripcion/me", {
        locale,
        cache: "no-store",
      });
      setInscripcion(datos);
      return true;
    } catch {
      return false;
    }
  }, [locale]);

  return {
    config,
    inscripcion,
    error,
    cargar,
    recargarInscripcion,
    setInscripcion,
  };
}

// A dónde debe estar cada estado de pago. null = puede quedarse en pay/enroll.
export function rutaSegunEstadoPago(
  estado: EstadoPago | undefined,
): string | null {
  switch (estado) {
    case "pendiente_verificacion":
    case "reembolsado":
    case "disputado":
      return "/us/pending";
    case "pagado":
      return "/us/dashboard";
    default:
      return null; // creado, rechazado o sin inscripción
  }
}
