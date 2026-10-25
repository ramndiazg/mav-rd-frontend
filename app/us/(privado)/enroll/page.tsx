"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RutaProtegidaUS from "@/components/us/RutaProtegidaUS";
import StateCard from "@/components/us/StateCard";
import { BotonPrimario, MensajeError } from "@/components/us/FormUI";
import { useUsAuth } from "@/contexts/UsAuthContext";
import { useUsLocale } from "@/contexts/UsLocaleContext";
import { ESTADOS_US, esEstadoUS, type EstadoUS } from "@/lib/us/estados";
import { formatearUSD } from "@/lib/us/pagos";
import { rutaSegunEstadoPago, useInscripcionUS } from "@/lib/us/useInscripcionUS";

// NUEVO (24/10/2026): paso 1 de la inscripción — elegir el estado. Todavía no
// se crea nada en el servidor: se pasa a /us/pay con el estado en la URL y es
// allí, al enviar el comprobante, donde se crea la inscripción.
function EnrollContenido() {
  const router = useRouter();
  const { t, locale } = useUsLocale();
  const { usuario } = useUsAuth();
  const { config, inscripcion, error, cargar } = useInscripcionUS();

  const [seleccion, setSeleccion] = useState<EstadoUS | null>(null);

  // Quien ya envió o pagó no debe estar aquí.
  const destino = rutaSegunEstadoPago(inscripcion?.estadoPago);
  useEffect(() => {
    if (destino) router.replace(destino);
  }, [destino, router]);

  const estados: EstadoUS[] = config?.estadosActivos?.length
    ? config.estadosActivos.filter(esEstadoUS)
    : ESTADOS_US;

  // Por defecto: el estado ya elegido en la inscripción o en el registro.
  const porDefecto = [inscripcion?.estadoUS, usuario?.estadoUS].find(
    (e): e is EstadoUS => esEstadoUS(e) && estados.includes(e),
  );
  const elegido = seleccion ?? porDefecto ?? null;

  if (inscripcion === undefined || destino) {
    return (
      <p role="status" className="mx-auto max-w-md px-4 py-20 text-center text-neutral-text/70">
        {t("enroll.cargando")}
      </p>
    );
  }

  const precio = config?.precioCentavos ? formatearUSD(config.precioCentavos, locale) : null;

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <h1 className="font-display text-3xl font-semibold text-brand-blue">{t("enroll.titulo")}</h1>
      <p className="mt-2 text-neutral-text/80">{t("enroll.sub")}</p>
      {precio ? (
        <p className="mt-3 text-lg font-semibold text-neutral-text">
          {t("enroll.precio", { precio })}
        </p>
      ) : (
        config && (
          <p role="status" className="mt-3 rounded-lg bg-status-warning/15 px-4 py-3 text-neutral-text">
            {t("enroll.sinPrecio")}
          </p>
        )
      )}

      {error && (
        <div className="mt-4 space-y-2">
          <MensajeError>{error}</MensajeError>
          <button
            type="button"
            onClick={() => void cargar()}
            className="text-sm font-medium text-brand-blue underline"
          >
            {t("comun.reintentar")}
          </button>
        </div>
      )}

      <fieldset className="mt-6">
        <legend className="sr-only">{t("enroll.titulo")}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {estados.map((codigo) => (
            <StateCard
              key={codigo}
              estado={codigo}
              seleccionado={elegido === codigo}
              onSelect={setSeleccion}
            />
          ))}
        </div>
      </fieldset>

      <BotonPrimario
        type="button"
        className="mt-8 w-full sm:w-auto"
        disabled={!elegido || !precio}
        onClick={() => elegido && router.push(`/us/pay?estado=${elegido}`)}
      >
        {t("enroll.continuar")}
      </BotonPrimario>
    </section>
  );
}

export default function EnrollPage() {
  return (
    <RutaProtegidaUS requiereCorreo>
      <EnrollContenido />
    </RutaProtegidaUS>
  );
}