"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type ResultadoDiploma = {
  nombreCompleto: string;
  codigoVerificacion: string;
  fechaEmision: string;
  urlPDF?: string;
};

type Estado = "inicial" | "cargando" | "encontrado" | "no_encontrado" | "error";

function formatearFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-DO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Consulta pública del diploma. Devuelve el resultado en vez de tocar el
// estado, para poder usarla tanto desde el formulario como desde el efecto
// que se dispara al abrir la página con ?codigo= (el QR del diploma).
async function buscarDiploma(
  codigoLimpio: string,
): Promise<{ estado: Estado; data: ResultadoDiploma | null }> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/diplomas/verificar/${encodeURIComponent(codigoLimpio)}`
    );
    const json = await res.json();
    return json.success
      ? { estado: "encontrado", data: json.data }
      : { estado: "no_encontrado", data: null };
  } catch {
    return { estado: "error", data: null };
  }
}

function VerificarDiplomaContenido() {
  const searchParams = useSearchParams();
  // NUEVO (04/10/2026): el QR del diploma abre esta página con
  // ?codigo=MUVO-2026-000123 y se verifica solo. Entrar sin parámetro
  // funciona exactamente igual que antes (formulario manual).
  const codigoDeUrl = searchParams.get("codigo")?.trim().toUpperCase() || "";

  const [codigo, setCodigo] = useState(codigoDeUrl);
  const [estado, setEstado] = useState<Estado>(codigoDeUrl ? "cargando" : "inicial");
  const [resultado, setResultado] = useState<ResultadoDiploma | null>(null);

  useEffect(() => {
    if (!codigoDeUrl) return;
    let cancelado = false;

    (async () => {
      const r = await buscarDiploma(codigoDeUrl);
      if (cancelado) return;
      setResultado(r.data);
      setEstado(r.estado);
    })();

    return () => {
      cancelado = true;
    };
  }, [codigoDeUrl]);

  async function verificar(e: React.FormEvent) {
    e.preventDefault();
    const codigoLimpio = codigo.trim().toUpperCase();
    if (!codigoLimpio) return;

    setEstado("cargando");
    setResultado(null);
    const r = await buscarDiploma(codigoLimpio);
    setResultado(r.data);
    setEstado(r.estado);
  }

  return (
    <main className="bg-neutral-bg min-h-screen px-6 py-16">
      <div className="max-w-lg mx-auto">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-brand-blue mb-2 text-center">
          Verificar Diploma
        </h1>
        <p className="text-neutral-text text-center mb-10">
          Escribe el codigo de verificacion que aparece en el diploma para
          confirmar su autenticidad.
        </p>

        <form onSubmit={verificar} className="flex flex-col sm:flex-row gap-3 mb-8">
          <input
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Ej: MUVO-2026-000001"
            className="flex-1 rounded-full border border-neutral-bg bg-white px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
          <button
            type="submit"
            disabled={estado === "cargando" || !codigo.trim()}
            className="bg-brand-pink text-white px-6 py-3 rounded-full font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {estado === "cargando" ? "Verificando..." : "Verificar"}
          </button>
        </form>

        {estado === "encontrado" && resultado && (
          <div className="rounded-xl bg-white border-2 border-status-success p-6">
            <p className="text-status-success font-medium text-sm mb-4">
              Diploma valido
            </p>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-neutral-text">Nombre</dt>
                <dd className="font-medium text-brand-blue text-right">
                  {resultado.nombreCompleto}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-text">Codigo</dt>
                <dd className="font-medium text-brand-blue text-right">
                  {resultado.codigoVerificacion}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-text">Fecha de emision</dt>
                <dd className="font-medium text-brand-blue text-right">
                  {formatearFecha(resultado.fechaEmision)}
                </dd>
              </div>
            </dl>
            {resultado.urlPDF && (
              <a
                href={resultado.urlPDF}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-block text-sm text-brand-pink underline"
              >
                Ver PDF del diploma
              </a>
            )}
          </div>
        )}

        {estado === "no_encontrado" && (
          <div className="rounded-xl bg-white border border-neutral-bg p-6 text-center">
            <p className="text-neutral-text">
              No encontramos ningun diploma con ese codigo. Revisa que este
              escrito exactamente como aparece impreso.
            </p>
          </div>
        )}

        {estado === "error" && (
          <div className="rounded-xl bg-brand-pink-light border border-brand-pink p-6 text-center text-brand-blue">
            No pudimos conectarnos con el servidor. Intenta de nuevo en unos
            minutos.
          </div>
        )}
      </div>
    </main>
  );
}

export default function VerificarDiplomaPage() {
  return (
    <Suspense fallback={null}>
      <VerificarDiplomaContenido />
    </Suspense>
  );
}
