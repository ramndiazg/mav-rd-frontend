"use client";

import { useState, type ComponentType } from "react";
import { Banknote, Landmark, Wallet } from "lucide-react";
import PayPalForm from "@/components/us/PayPalForm";
import RemittanceForm from "@/components/us/RemittanceForm";
import { useUsLocale } from "@/contexts/UsLocaleContext";
import type { DictKey } from "@/lib/us/dict";
import {
  esMetodoConocido,
  type ConfigPagoUS,
  type InscripcionUS,
  type MetodoPagoId,
  type MetodoPagoProps,
} from "@/lib/us/pagos";

// NUEVO (24/10/2026): elige el método de pago y muestra su formulario.
//
// PUNTO DE EXTENSIÓN: un método nuevo (p. ej. PayPal) = un componente que
// cumpla MetodoPagoProps + una línea aquí en FORMULARIOS (y en ICONOS/texto
// del diccionario) + activarlo en la configuración del backend. Nada más.
const FORMULARIOS: Record<MetodoPagoId, ComponentType<MetodoPagoProps>> = {
  remesa_deposito: RemittanceForm,
  remesa_efectivo: RemittanceForm,
  paypal: PayPalForm, // NUEVO (27/10/2026)
};

const ICONOS: Record<MetodoPagoId, typeof Landmark> = {
  remesa_deposito: Landmark,
  remesa_efectivo: Banknote,
  paypal: Wallet,
};

// Orden en pantalla: el depósito primero (es el recomendado).
const ORDEN: MetodoPagoId[] = ["remesa_deposito", "remesa_efectivo", "paypal"];

export default function PaymentMethodPicker({
  config,
  precioCentavos,
  inscripcion,
  asegurarInscripcion,
  onCompleto,
}: {
  config: ConfigPagoUS;
  precioCentavos: number;
  inscripcion: InscripcionUS | null;
  asegurarInscripcion: (metodo: MetodoPagoId) => Promise<InscripcionUS>;
  onCompleto: (inscripcion: InscripcionUS) => void;
}) {
  const { t } = useUsLocale();

  const disponibles = ORDEN.filter(
    (m) => esMetodoConocido(m) && (config.metodos ?? []).includes(m),
  );
  const [elegido, setElegido] = useState<MetodoPagoId | null>(() => {
    const anterior = inscripcion?.metodoPago;
    return disponibles.find((m) => m === anterior) ?? disponibles[0] ?? null;
  });

  if (disponibles.length === 0) {
    return (
      <p role="status" className="rounded-lg bg-status-warning/15 px-4 py-3 text-neutral-text">
        {t("pay.metodo.ninguno")}
      </p>
    );
  }

  const Formulario = elegido ? FORMULARIOS[elegido] : null;

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-3 font-display text-lg font-semibold text-brand-blue">
          {t("pay.metodo.titulo")}
        </legend>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {disponibles.map((metodo, indice) => {
            const Icono = ICONOS[metodo];
            const activo = metodo === elegido;
            return (
              <label
                key={metodo}
                className={`relative flex cursor-pointer gap-3 rounded-2xl bg-white p-4 shadow-sm ring-2 transition has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand-blue ${activo ? "ring-brand-pink" : "ring-neutral-bg hover:ring-brand-blue/40"
                  }`}
              >
                <input
                  type="radio"
                  name="metodoPago"
                  value={metodo}
                  checked={activo}
                  onChange={() => setElegido(metodo)}
                  className="sr-only"
                />
                <span
                  aria-hidden
                  className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-blue text-white"
                >
                  <Icono size={22} />
                </span>
                <span>
                  <span className="block font-semibold text-brand-blue">
                    {t(`pay.metodo.${metodo}` as DictKey)}
                    {indice === 0 && (
                      <span className="ml-2 rounded-full bg-brand-yellow px-2 py-0.5 text-xs font-bold text-neutral-text">
                        {t("pay.metodo.recomendado")}
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block text-sm text-neutral-text/80">
                    {t(`pay.metodo.${metodo}.desc` as DictKey)}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {Formulario && elegido && (
        <Formulario
          key={elegido}
          metodo={elegido}
          config={config}
          precioCentavos={precioCentavos}
          inscripcionExistente={inscripcion}
          asegurarInscripcion={asegurarInscripcion}
          onCompleto={onCompleto}
        />
      )}
    </div>
  );
}