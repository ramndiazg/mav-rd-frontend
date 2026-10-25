"use client";

import { Selector } from "@/components/us/FormUI";
import { useUsLocale } from "@/contexts/UsLocaleContext";
import type { AgenciaUS, ViaRemesa } from "@/lib/us/pagos";

// NUEVO (24/10/2026): lista desplegable de apps/agencias de envío. Muestra
// solo las que admiten la vía elegida (depósito o efectivo); la lista sale de
// la configuración (us_agencias), no del código.
export default function AgencySelector({
  agencias,
  via,
  valor,
  onChange,
  error,
}: {
  agencias: AgenciaUS[];
  via: ViaRemesa;
  valor: string;
  onChange: (id: string) => void;
  error?: string;
}) {
  const { t, locale } = useUsLocale();
  const disponibles = agencias.filter((a) => a.via.includes(via));

  if (disponibles.length === 0) {
    return (
      <p role="alert" className="rounded-lg bg-status-warning/15 px-4 py-3 text-sm text-neutral-text">
        {t("pay.agencia.ninguna")}
      </p>
    );
  }

  const elegida = disponibles.find((a) => a.id === valor);
  const nota = elegida ? (locale === "en" ? elegida.notas_en : elegida.notas_es) : "";

  return (
    <div>
      <Selector
        etiqueta={t("pay.agencia")}
        required
        value={valor}
        error={error}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="" disabled>
          {t("pay.agencia.elegir")}
        </option>
        {disponibles.map((a) => (
          <option key={a.id} value={a.id}>
            {a.nombre}
          </option>
        ))}
      </Selector>
      {nota && <p className="mt-2 text-sm text-neutral-text/80">{nota}</p>}
    </div>
  );
}