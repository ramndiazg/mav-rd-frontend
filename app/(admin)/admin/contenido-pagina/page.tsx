"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

type Tipo = "texto" | "html" | "url" | "json";

type Bloque = {
  _id: string;
  clave: string;
  valor: string;
  tipo: Tipo;
};

function etiquetaTipo(tipo: Tipo) {
  return { texto: "Texto", html: "HTML", url: "URL", json: "JSON" }[tipo];
}

export default function ContenidoPaginaPage() {
  const { token } = useAuth();

  const [bloques, setBloques] = useState<Bloque[]>([]);
  const [cargando, setCargando] = useState(true);
  const [valoresEditados, setValoresEditados] = useState<Record<string, string>>({});
  const [guardandoClave, setGuardandoClave] = useState<string | null>(null);
  const [erroresJson, setErroresJson] = useState<Record<string, boolean>>({});

  const [mostrandoNuevo, setMostrandoNuevo] = useState(false);
  const [nuevaClave, setNuevaClave] = useState("");
  const [nuevoTipo, setNuevoTipo] = useState<Tipo>("texto");
  const [nuevoValor, setNuevoValor] = useState("");
  const [creando, setCreando] = useState(false);

  const [mensaje, setMensaje] = useState<{
    tipo: "ok" | "error";
    texto: string;
  } | null>(null);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contenido`);
        const json = await res.json();
        if (!cancelado && json.success) {
          setBloques(json.data);
          const iniciales: Record<string, string> = {};
          json.data.forEach((b: Bloque) => {
            iniciales[b.clave] = b.valor;
          });
          setValoresEditados(iniciales);
        }
      } catch {
        if (!cancelado) {
          setMensaje({ tipo: "error", texto: "No pudimos cargar el contenido." });
        }
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, []);

  function cambiarValor(clave: string, valor: string) {
    setValoresEditados((prev) => ({ ...prev, [clave]: valor }));
  }

  async function guardarBloque(bloque: Bloque) {
    const valorNuevo = valoresEditados[bloque.clave];

    if (bloque.tipo === "json") {
      try {
        JSON.parse(valorNuevo);
        setErroresJson((prev) => ({ ...prev, [bloque.clave]: false }));
      } catch {
        setErroresJson((prev) => ({ ...prev, [bloque.clave]: true }));
        setMensaje({
          tipo: "error",
          texto: `"${bloque.clave}" no es JSON válido — revisa comas, comillas y corchetes antes de guardar.`,
        });
        return;
      }
    }

    setGuardandoClave(bloque.clave);
    setMensaje(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/contenido/${bloque.clave}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ valor: valorNuevo }),
        },
      );
      const json = await res.json();

      if (json.success) {
        setMensaje({ tipo: "ok", texto: `"${bloque.clave}" actualizado.` });
        setBloques((prev) =>
          prev.map((b) => (b.clave === bloque.clave ? json.data : b)),
        );
      } else {
        setMensaje({ tipo: "error", texto: json.error || "No se pudo guardar." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    } finally {
      setGuardandoClave(null);
    }
  }

  async function crearBloque(e: React.FormEvent) {
    e.preventDefault();

    if (nuevoTipo === "json") {
      try {
        JSON.parse(nuevoValor);
      } catch {
        setMensaje({ tipo: "error", texto: "El valor no es JSON válido." });
        return;
      }
    }

    setCreando(true);
    setMensaje(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contenido`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clave: nuevaClave, valor: nuevoValor, tipo: nuevoTipo }),
      });
      const json = await res.json();

      if (json.success) {
        setBloques((prev) => [...prev, json.data]);
        setValoresEditados((prev) => ({ ...prev, [json.data.clave]: json.data.valor }));
        setMensaje({ tipo: "ok", texto: `"${nuevaClave}" creado.` });
        setMostrandoNuevo(false);
        setNuevaClave("");
        setNuevoValor("");
        setNuevoTipo("texto");
      } else {
        setMensaje({ tipo: "error", texto: json.error || "No se pudo crear." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    } finally {
      setCreando(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="font-display text-2xl font-bold text-brand-blue mb-1">
        Contenido de la página
      </h2>
      <p className="text-sm text-neutral-text mb-6">
        Edita los textos y enlaces que se muestran en las páginas públicas del
        sitio (Inicio, Acerca de Nosotros, Kit de Preparación, Contacto) sin
        necesidad de pedir un cambio de código.
      </p>

      {cargando && <p className="text-sm text-neutral-text">Cargando...</p>}

      <div className="grid gap-4 mb-8">
        {bloques.map((bloque) => {
          const editado = valoresEditados[bloque.clave] ?? "";
          const cambio = editado !== bloque.valor;
          const esLargo = bloque.tipo === "html" || bloque.tipo === "json";

          return (
            <div
              key={bloque._id}
              className="rounded-xl bg-white border border-neutral-bg p-5"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-mono text-sm text-brand-blue font-medium">
                  {bloque.clave}
                </p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-bg text-neutral-text">
                  {etiquetaTipo(bloque.tipo)}
                </span>
              </div>

              {esLargo ? (
                <textarea
                  value={editado}
                  onChange={(e) => cambiarValor(bloque.clave, e.target.value)}
                  rows={bloque.tipo === "json" ? 6 : 4}
                  className={`w-full rounded-lg border px-3 py-2 text-sm font-mono ${erroresJson[bloque.clave] ? "border-brand-pink" : "border-neutral-bg"
                    }`}
                />
              ) : (
                <input
                  type="text"
                  value={editado}
                  onChange={(e) => cambiarValor(bloque.clave, e.target.value)}
                  className="w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
                />
              )}

              {cambio && (
                <button
                  onClick={() => guardarBloque(bloque)}
                  disabled={guardandoClave === bloque.clave}
                  className="mt-3 rounded-lg bg-brand-pink text-white text-sm px-4 py-2 font-medium hover:opacity-90 disabled:opacity-60"
                >
                  {guardandoClave === bloque.clave ? "Guardando..." : "Guardar cambio"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {!mostrandoNuevo && (
        <button
          onClick={() => setMostrandoNuevo(true)}
          className="rounded-lg bg-brand-blue text-white text-sm px-4 py-2 font-medium hover:opacity-90"
        >
          + Nuevo bloque de contenido
        </button>
      )}

      {mostrandoNuevo && (
        <form
          onSubmit={crearBloque}
          className="rounded-xl bg-white border border-neutral-bg p-5 grid gap-3"
        >
          <p className="font-display font-semibold text-brand-blue">
            Nuevo bloque
          </p>

          <label className="text-sm text-neutral-text">
            Clave (identificador único, ej: contacto_horario)
            <input
              type="text"
              required
              value={nuevaClave}
              onChange={(e) => setNuevaClave(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm font-mono"
            />
          </label>

          <label className="text-sm text-neutral-text">
            Tipo
            <select
              value={nuevoTipo}
              onChange={(e) => setNuevoTipo(e.target.value as Tipo)}
              className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
            >
              <option value="texto">Texto</option>
              <option value="html">HTML</option>
              <option value="url">URL</option>
              <option value="json">JSON</option>
            </select>
          </label>

          <label className="text-sm text-neutral-text">
            Valor
            <textarea
              required
              value={nuevoValor}
              onChange={(e) => setNuevoValor(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm font-mono"
            />
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creando}
              className="rounded-lg bg-brand-pink text-white text-sm px-4 py-2 font-medium hover:opacity-90 disabled:opacity-60"
            >
              {creando ? "Creando..." : "Crear bloque"}
            </button>
            <button
              type="button"
              onClick={() => setMostrandoNuevo(false)}
              className="rounded-lg bg-white border border-neutral-bg text-neutral-text text-sm px-4 py-2"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {mensaje && (
        <div
          className={`mt-6 rounded-lg p-4 text-sm ${mensaje.tipo === "ok"
            ? "bg-status-success/10 border border-status-success text-status-success"
            : "bg-brand-pinkLight border border-brand-pink text-brand-blue"
            }`}
        >
          {mensaje.texto}
        </div>
      )}
    </div>
  );
}