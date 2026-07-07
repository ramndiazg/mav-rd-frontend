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

// Agrupación y orden de presentación — cualquier clave que no aparezca aquí
// cae en el grupo "Otros" al final, para que los bloques nuevos no se pierdan.
const GRUPOS: { titulo: string; claves: string[] }[] = [
  {
    titulo: "Página: Acerca de Nosotros",
    claves: ["acerca_de_historia", "acerca_de_fundadora", "acerca_de_frase"],
  },
  {
    titulo: "Página: Kit de Preparación",
    claves: [
      "kit_video_modulos",
      "kit_minimanual_pdf_url",
      "kit_intrant_simulador_url",
      "kit_intrant_cita_url",
    ],
  },
  {
    titulo: "Página: Contacto y Redes Sociales",
    claves: [
      "contacto_lugares_practicas",
      "contacto_email",
      "redes_facebook",
      "redes_instagram",
      "redes_youtube",
    ],
  },
];

// Nombres en español normal — sin esto, la fundadora vería "acerca_de_historia"
const ETIQUETAS: Record<string, string> = {
  acerca_de_historia: "Nuestra historia",
  acerca_de_fundadora: "Biografía de la fundadora",
  acerca_de_frase: "Frase destacada",
  kit_video_modulos: "Videos del curso",
  kit_minimanual_pdf_url: "Enlace al PDF del minimanual",
  kit_intrant_simulador_url: "Enlace al simulador de INTRANT",
  kit_intrant_cita_url: "Enlace para agendar cita en INTRANT",
  contacto_lugares_practicas: "Teléfonos por sede",
  contacto_email: "Correo de contacto",
  redes_facebook: "Facebook",
  redes_instagram: "Instagram",
  redes_youtube: "YouTube",
};

function etiquetaDe(clave: string) {
  return ETIQUETAS[clave] || clave;
}

type VideoModulo = { numero: number; titulo: string; youtubeId: string };
type LugarPractica = { zona: string; telefono: string };

export default function ContenidoPaginaPage() {
  const { token } = useAuth();

  const [bloques, setBloques] = useState<Bloque[]>([]);
  const [cargando, setCargando] = useState(true);

  // Valor "en bruto" de cada bloque tal como se manda al guardar (para los
  // bloques de lista, esto se mantiene sincronizado automáticamente cada vez
  // que se edita una fila — nunca lo ve la fundadora directamente).
  const [valoresEditados, setValoresEditados] = useState<Record<string, string>>({});

  // Listas ya parseadas, para los dos bloques que son arreglos
  const [videos, setVideos] = useState<VideoModulo[]>([]);
  const [lugares, setLugares] = useState<LugarPractica[]>([]);

  const [guardandoClave, setGuardandoClave] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  const [mostrandoNuevo, setMostrandoNuevo] = useState(false);
  const [nuevaClave, setNuevaClave] = useState("");
  const [nuevoTipo, setNuevoTipo] = useState<Tipo>("texto");
  const [nuevoValor, setNuevoValor] = useState("");
  const [creando, setCreando] = useState(false);

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

          const bloqueVideos = json.data.find((b: Bloque) => b.clave === "kit_video_modulos");
          if (bloqueVideos) {
            try {
              setVideos(JSON.parse(bloqueVideos.valor));
            } catch {
              setVideos([]);
            }
          }

          const bloqueLugares = json.data.find(
            (b: Bloque) => b.clave === "contacto_lugares_practicas",
          );
          if (bloqueLugares) {
            try {
              setLugares(JSON.parse(bloqueLugares.valor));
            } catch {
              setLugares([]);
            }
          }
        }
      } catch {
        if (!cancelado) setMensaje({ tipo: "error", texto: "No pudimos cargar el contenido." });
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, []);

  function cambiarValorSimple(clave: string, valor: string) {
    setValoresEditados((prev) => ({ ...prev, [clave]: valor }));
  }

  // --- Editor de la lista de videos ---
  function actualizarVideo(indice: number, campo: "titulo" | "youtubeId", valor: string) {
    setVideos((prev) => {
      const copia = prev.map((v, i) => (i === indice ? { ...v, [campo]: valor } : v));
      setValoresEditados((ve) => ({ ...ve, kit_video_modulos: JSON.stringify(copia) }));
      return copia;
    });
  }

  function agregarVideo() {
    setVideos((prev) => {
      const copia = [...prev, { numero: prev.length + 1, titulo: "", youtubeId: "" }];
      setValoresEditados((ve) => ({ ...ve, kit_video_modulos: JSON.stringify(copia) }));
      return copia;
    });
  }

  function quitarVideo(indice: number) {
    setVideos((prev) => {
      const copia = prev
        .filter((_, i) => i !== indice)
        .map((v, i) => ({ ...v, numero: i + 1 }));
      setValoresEditados((ve) => ({ ...ve, kit_video_modulos: JSON.stringify(copia) }));
      return copia;
    });
  }

  // --- Editor de la lista de teléfonos por sede ---
  function actualizarLugar(indice: number, campo: "zona" | "telefono", valor: string) {
    setLugares((prev) => {
      const copia = prev.map((l, i) => (i === indice ? { ...l, [campo]: valor } : l));
      setValoresEditados((ve) => ({ ...ve, contacto_lugares_practicas: JSON.stringify(copia) }));
      return copia;
    });
  }

  function agregarLugar() {
    setLugares((prev) => {
      const copia = [...prev, { zona: "", telefono: "" }];
      setValoresEditados((ve) => ({ ...ve, contacto_lugares_practicas: JSON.stringify(copia) }));
      return copia;
    });
  }

  function quitarLugar(indice: number) {
    setLugares((prev) => {
      const copia = prev.filter((_, i) => i !== indice);
      setValoresEditados((ve) => ({ ...ve, contacto_lugares_practicas: JSON.stringify(copia) }));
      return copia;
    });
  }

  async function guardarBloque(bloque: Bloque) {
    setGuardandoClave(bloque.clave);
    setMensaje(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contenido/${bloque.clave}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ valor: valoresEditados[bloque.clave] }),
      });
      const json = await res.json();

      if (json.success) {
        setMensaje({ tipo: "ok", texto: `"${etiquetaDe(bloque.clave)}" actualizado.` });
        setBloques((prev) => prev.map((b) => (b.clave === bloque.clave ? json.data : b)));
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
    setCreando(true);
    setMensaje(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contenido`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
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

  function renderBloqueSimple(bloque: Bloque) {
    const editado = valoresEditados[bloque.clave] ?? "";
    const cambio = editado !== bloque.valor;

    return (
      <div key={bloque._id} className="rounded-xl bg-white border border-neutral-bg p-5">
        <p className="text-sm font-medium text-brand-blue mb-2">
          {etiquetaDe(bloque.clave)}
        </p>

        {bloque.tipo === "html" ? (
          <textarea
            value={editado}
            onChange={(e) => cambiarValorSimple(bloque.clave, e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
          />
        ) : (
          <input
            type="text"
            value={editado}
            onChange={(e) => cambiarValorSimple(bloque.clave, e.target.value)}
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
  }

  function renderVideos(bloque: Bloque) {
    const cambio = valoresEditados.kit_video_modulos !== bloque.valor;

    return (
      <div key={bloque._id} className="rounded-xl bg-white border border-neutral-bg p-5">
        <p className="text-sm font-medium text-brand-blue mb-1">Videos del curso</p>
        <p className="text-xs text-neutral-text mb-3">
          El número de cada video se reordena solo según la posición en la lista.
        </p>

        <div className="grid gap-3 mb-3">
          {videos.map((video, i) => (
            <div key={i} className="rounded-lg border border-neutral-bg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-neutral-text">Video {i + 1}</span>
                <button
                  onClick={() => quitarVideo(i)}
                  className="text-xs text-brand-pink hover:underline"
                >
                  Quitar
                </button>
              </div>
              <input
                type="text"
                value={video.titulo}
                onChange={(e) => actualizarVideo(i, "titulo", e.target.value)}
                placeholder="Título del video"
                className="w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm mb-2"
              />
              <input
                type="text"
                value={video.youtubeId}
                onChange={(e) => actualizarVideo(i, "youtubeId", e.target.value)}
                placeholder="Código del video de YouTube (ej: BHbcDoxo5gE)"
                className="w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
              />
              {video.youtubeId && (
                <a
                  href={`https://youtu.be/${video.youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand-blueLight hover:underline mt-1 inline-block"
                >
                  Ver en YouTube ↗
                </a>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={agregarVideo}
          className="text-sm text-brand-blueLight hover:underline mb-3 block"
        >
          + Agregar video
        </button>

        {cambio && (
          <button
            onClick={() => guardarBloque(bloque)}
            disabled={guardandoClave === "kit_video_modulos"}
            className="rounded-lg bg-brand-pink text-white text-sm px-4 py-2 font-medium hover:opacity-90 disabled:opacity-60"
          >
            {guardandoClave === "kit_video_modulos" ? "Guardando..." : "Guardar cambios"}
          </button>
        )}
      </div>
    );
  }

  function renderLugares(bloque: Bloque) {
    const cambio = valoresEditados.contacto_lugares_practicas !== bloque.valor;

    return (
      <div key={bloque._id} className="rounded-xl bg-white border border-neutral-bg p-5">
        <p className="text-sm font-medium text-brand-blue mb-3">Teléfonos por sede</p>

        <div className="grid gap-3 mb-3">
          {lugares.map((lugar, i) => (
            <div key={i} className="flex gap-2 items-start">
              <input
                type="text"
                value={lugar.zona}
                onChange={(e) => actualizarLugar(i, "zona", e.target.value)}
                placeholder="Zona (ej: Santo Domingo Este)"
                className="flex-1 rounded-lg border border-neutral-bg px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={lugar.telefono}
                onChange={(e) => actualizarLugar(i, "telefono", e.target.value)}
                placeholder="Teléfono"
                className="w-40 rounded-lg border border-neutral-bg px-3 py-2 text-sm"
              />
              <button
                onClick={() => quitarLugar(i)}
                className="text-xs text-brand-pink hover:underline px-2 py-2"
              >
                Quitar
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={agregarLugar}
          className="text-sm text-brand-blueLight hover:underline mb-3 block"
        >
          + Agregar sede
        </button>

        {cambio && (
          <button
            onClick={() => guardarBloque(bloque)}
            disabled={guardandoClave === "contacto_lugares_practicas"}
            className="rounded-lg bg-brand-pink text-white text-sm px-4 py-2 font-medium hover:opacity-90 disabled:opacity-60"
          >
            {guardandoClave === "contacto_lugares_practicas" ? "Guardando..." : "Guardar cambios"}
          </button>
        )}
      </div>
    );
  }

  function renderBloque(bloque: Bloque) {
    if (bloque.clave === "kit_video_modulos") return renderVideos(bloque);
    if (bloque.clave === "contacto_lugares_practicas") return renderLugares(bloque);
    return renderBloqueSimple(bloque);
  }

  const clavesAgrupadas = new Set(GRUPOS.flatMap((g) => g.claves));
  const sinGrupo = bloques.filter((b) => !clavesAgrupadas.has(b.clave));

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="font-display text-2xl font-bold text-brand-blue mb-1">
        Contenido de la página
      </h2>
      <p className="text-sm text-neutral-text mb-8">
        Edita los textos, enlaces y videos que se muestran en el sitio público,
        organizados por página. Los cambios se reflejan en el sitio en cuanto
        los guardas.
      </p>

      {cargando && <p className="text-sm text-neutral-text">Cargando...</p>}

      {!cargando &&
        GRUPOS.map((grupo) => {
          const bloquesDelGrupo = grupo.claves
            .map((clave) => bloques.find((b) => b.clave === clave))
            .filter((b): b is Bloque => Boolean(b));

          if (bloquesDelGrupo.length === 0) return null;

          return (
            <div key={grupo.titulo} className="mb-10">
              <h3 className="font-display font-semibold text-brand-blue mb-4 pb-2 border-b border-neutral-bg">
                {grupo.titulo}
              </h3>
              <div className="grid gap-4">{bloquesDelGrupo.map(renderBloque)}</div>
            </div>
          );
        })}

      {!cargando && sinGrupo.length > 0 && (
        <div className="mb-10">
          <h3 className="font-display font-semibold text-brand-blue mb-4 pb-2 border-b border-neutral-bg">
            Otros
          </h3>
          <div className="grid gap-4">{sinGrupo.map(renderBloque)}</div>
        </div>
      )}

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
          <p className="font-display font-semibold text-brand-blue">Nuevo bloque</p>
          <p className="text-xs text-neutral-text -mt-2">
            Esto es para uso técnico — crea un bloque con un identificador que
            luego un desarrollador debe conectar a una página. Para textos ya
            existentes, edítalos arriba directamente.
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