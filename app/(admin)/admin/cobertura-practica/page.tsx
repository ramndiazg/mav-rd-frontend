"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { MapPin, Plus } from "lucide-react";

// NUEVO (13/09/2026): panel de cobertura geográfica de la práctica de
// manejo — ver ANALISIS_COBERTURA_PRACTICA.md, sección 7. Misma estructura
// que /admin/planes (carga con token, edición en línea, mensaje de
// resultado arriba).

type MunicipioPractica = {
  _id: string;
  provincia: string;
  municipio: string;
  activo: boolean;
};

type ProvinciaConMunicipios = { provincia: string; municipios: string[] };

export default function CoberturaPracticaPage() {
  const { token } = useAuth();

  const [filas, setFilas] = useState<MunicipioPractica[]>([]);
  const [referencia, setReferencia] = useState<ProvinciaConMunicipios[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardandoId, setGuardandoId] = useState<string | null>(null);
  const [agregando, setAgregando] = useState(false);
  const [mensaje, setMensaje] = useState<{
    tipo: "ok" | "error";
    texto: string;
  } | null>(null);

  const [nuevaProvincia, setNuevaProvincia] = useState("");
  const [nuevoMunicipio, setNuevoMunicipio] = useState("");

  useEffect(() => {
    if (!token) return;
    let cancelado = false;

    (async () => {
      try {
        const [resFilas, resRef] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/municipios-practica`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/ubicaciones/provincias-municipios`,
          ),
        ]);

        const jsonFilas = await resFilas.json();
        const jsonRef = await resRef.json();
        if (cancelado) return;

        if (jsonFilas.success) setFilas(jsonFilas.data);
        if (jsonRef.success) setReferencia(jsonRef.data);
      } catch {
        if (!cancelado)
          setMensaje({
            tipo: "error",
            texto: "No pude cargar la cobertura. Recarga la página.",
          });
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [token]);

  const municipiosDeProvincia =
    referencia.find((p) => p.provincia === nuevaProvincia)?.municipios ?? [];

  // Municipios de esa provincia que todavía NO están en la lista de
  // cobertura — evita el 409 del backend por duplicado antes de que pase.
  const municipiosDisponibles = municipiosDeProvincia.filter(
    (m) =>
      !filas.some((f) => f.provincia === nuevaProvincia && f.municipio === m),
  );

  async function agregar() {
    if (!nuevaProvincia || !nuevoMunicipio) return;
    setAgregando(true);
    setMensaje(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/municipios-practica`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            provincia: nuevaProvincia,
            municipio: nuevoMunicipio,
          }),
        },
      );
      const json = await res.json();

      if (json.success) {
        setFilas((prev) =>
          [...prev, json.data].sort(
            (a, b) =>
              a.provincia.localeCompare(b.provincia) ||
              a.municipio.localeCompare(b.municipio),
          ),
        );
        setNuevoMunicipio("");
        setMensaje({
          tipo: "ok",
          texto: `${json.data.municipio} agregado a la cobertura.`,
        });
      } else {
        setMensaje({ tipo: "error", texto: json.error || "No se pudo agregar." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "Error de conexión." });
    } finally {
      setAgregando(false);
    }
  }

  async function alternarActivo(fila: MunicipioPractica) {
    setGuardandoId(fila._id);
    setMensaje(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/municipios-practica/${fila._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ activo: !fila.activo }),
        },
      );
      const json = await res.json();

      if (json.success) {
        setFilas((prev) =>
          prev.map((f) => (f._id === fila._id ? json.data : f)),
        );
      } else {
        setMensaje({
          tipo: "error",
          texto: json.error || "No se pudo actualizar.",
        });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "Error de conexión." });
    } finally {
      setGuardandoId(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center gap-3 mb-2">
        <MapPin className="w-6 h-6 text-brand-pink" />
        <h1 className="font-display text-2xl font-bold text-brand-blue">
          Cobertura de práctica
        </h1>
      </div>
      <p className="text-sm text-neutral-text mb-2">
        Municipios donde ofrecemos práctica de manejo presencial. En los
        municipios que no estén aquí, las estudiantes del curso de livianos
        solo pueden inscribirse en la modalidad Solo Teórico.
      </p>
      <p className="text-sm text-neutral-text mb-8">
        Para activar un municipio primero debe existir ahí un{" "}
        <Link
          href="/admin/choferes"
          className="text-brand-blueLight underline underline-offset-2"
        >
          chofer activo con esa zona asignada
        </Link>
        — así nos aseguramos de que la estudiante que se inscriba con
        práctica de verdad tenga con quién tomarla.
      </p>

      {mensaje && (
        <div
          className={`mb-6 rounded-lg px-4 py-3 text-sm ${mensaje.tipo === "ok"
            ? "bg-green-50 text-green-800 border border-green-200"
            : "bg-red-50 text-red-800 border border-red-200"
            }`}
        >
          {mensaje.texto}
        </div>
      )}

      {/* --- Agregar municipio --- */}
      <div className="rounded-xl bg-white border border-neutral-bg p-5 mb-8">
        <h2 className="font-semibold text-brand-blue mb-4 text-sm">
          Agregar municipio
        </h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <select
            value={nuevaProvincia}
            onChange={(e) => {
              setNuevaProvincia(e.target.value);
              setNuevoMunicipio("");
            }}
            className="rounded-lg border border-neutral-bg px-3 py-2 text-sm bg-white"
          >
            <option value="">Provincia</option>
            {referencia.map((p) => (
              <option key={p.provincia} value={p.provincia}>
                {p.provincia}
              </option>
            ))}
          </select>

          <select
            value={nuevoMunicipio}
            onChange={(e) => setNuevoMunicipio(e.target.value)}
            disabled={!nuevaProvincia}
            className="rounded-lg border border-neutral-bg px-3 py-2 text-sm bg-white disabled:opacity-60"
          >
            <option value="">
              {nuevaProvincia ? "Municipio" : "Elige provincia"}
            </option>
            {municipiosDisponibles.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <button
            onClick={agregar}
            disabled={!nuevaProvincia || !nuevoMunicipio || agregando}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-pink text-white text-sm font-semibold px-4 py-2 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {agregando ? "Agregando..." : "Agregar"}
          </button>
        </div>
        {nuevaProvincia && municipiosDisponibles.length === 0 && (
          <p className="text-xs text-neutral-text mt-3">
            Todos los municipios de {nuevaProvincia} ya están en la lista.
          </p>
        )}
      </div>

      {/* --- Lista actual --- */}
      {cargando ? (
        <p className="text-sm text-neutral-text">Cargando cobertura...</p>
      ) : filas.length === 0 ? (
        <p className="text-sm text-neutral-text">
          Todavía no hay municipios con cobertura de práctica.
        </p>
      ) : (
        <div className="rounded-xl bg-white border border-neutral-bg overflow-hidden">
          {filas.map((fila) => (
            <div
              key={fila._id}
              className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-bg last:border-b-0"
            >
              <div>
                <p className="text-sm font-medium text-brand-blue">
                  {fila.municipio}
                </p>
                <p className="text-xs text-neutral-text">{fila.provincia}</p>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${fila.activo
                    ? "bg-green-100 text-green-800"
                    : "bg-neutral-bg text-neutral-text"
                    }`}
                >
                  {fila.activo ? "Activo" : "Inactivo"}
                </span>
                <button
                  onClick={() => alternarActivo(fila)}
                  disabled={guardandoId === fila._id}
                  className="text-xs font-semibold text-brand-blue underline underline-offset-2 disabled:opacity-50"
                >
                  {guardandoId === fila._id
                    ? "Guardando..."
                    : fila.activo
                      ? "Desactivar"
                      : "Activar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-neutral-text mt-6">
        Desactivar un municipio no afecta a quienes ya se inscribieron — solo
        cambia lo que se les ofrece a las estudiantes nuevas.
      </p>
    </div>
  );
}