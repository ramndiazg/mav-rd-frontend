"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

type Tipo = "texto" | "html" | "url" | "json";
type Bloque = { _id: string; clave: string; valor: string; tipo: Tipo };

type DefinicionCampo = {
  clave: string;
  etiqueta: string;
  tipo: Tipo;
  ayuda?: string;
  esImagen?: boolean; // si es true, se muestra un subidor de imagen en vez de un input de texto
};

const AREAS: { id: string; titulo: string; campos: DefinicionCampo[] }[] = [
  {
    id: "inicio",
    titulo: "Inicio",
    campos: [
      { clave: "inicio_hero_titulo", etiqueta: "Título principal", tipo: "texto" },
      { clave: "inicio_hero_texto", etiqueta: "Texto debajo del título", tipo: "html" },
      { clave: "inicio_desde_texto", etiqueta: "Texto de la tarjeta \"Desde 2017\"", tipo: "html" },
    ],
  },
  {
    id: "acerca",
    titulo: "Acerca de Nosotros",
    campos: [
      { clave: "acerca_de_historia", etiqueta: "Nuestra historia", tipo: "html" },
      { clave: "acerca_de_historia_imagen", etiqueta: "Imagen de la sección \"Nuestra historia\"", tipo: "url", esImagen: true },
      { clave: "acerca_de_fundadora", etiqueta: "Biografía de la fundadora", tipo: "html" },
      { clave: "acerca_de_fundadora_imagen", etiqueta: "Foto de la fundadora", tipo: "url", esImagen: true },
      { clave: "acerca_de_frase", etiqueta: "Frase destacada", tipo: "texto" },
      { clave: "acerca_de_mision", etiqueta: "Misión", tipo: "html" },
      { clave: "acerca_de_vision", etiqueta: "Visión", tipo: "html" },
      { clave: "acerca_de_valores", etiqueta: "Valores", tipo: "html" },
    ],
  },
  {
    id: "kit",
    titulo: "Kit de Preparación",
    campos: [
      { clave: "kit_video_modulos", etiqueta: "Videos del curso", tipo: "json" },
      { clave: "kit_minimanual_pdf_url", etiqueta: "Enlace al PDF del minimanual", tipo: "url" },
      { clave: "kit_intrant_simulador_url", etiqueta: "Enlace al simulador de INTRANT", tipo: "url" },
      { clave: "kit_intrant_cita_url", etiqueta: "Enlace para agendar cita en INTRANT", tipo: "url" },
    ],
  },
  {
    id: "contacto",
    titulo: "Contacto y Redes Sociales",
    campos: [
      { clave: "contacto_lugares_practicas", etiqueta: "Teléfonos por sede", tipo: "json" },
      { clave: "contacto_email", etiqueta: "Correo de contacto", tipo: "texto" },
      { clave: "redes_facebook", etiqueta: "Facebook", tipo: "url" },
      { clave: "redes_instagram", etiqueta: "Instagram", tipo: "url" },
      { clave: "redes_youtube", etiqueta: "YouTube", tipo: "url" },
    ],
  },
];

type VideoModulo = { numero: number; titulo: string; youtubeId: string };
type LugarPractica = { zona: string; telefono: string };

export default function ContenidoPaginaPage() {
  const { token } = useAuth();

  const [bloques, setBloques] = useState<Bloque[]>([]);
  const [cargando, setCargando] = useState(true);
  const [areaActiva, setAreaActiva] = useState<string | null>(null);

  const [valoresEditados, setValoresEditados] = useState<Record<string, string>>({});
  const [videos, setVideos] = useState<VideoModulo[]>([]);
  const [lugares, setLugares] = useState<LugarPractica[]>([]);

  const [guardandoClave, setGuardandoClave] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  // Para bloques que todavía no existen (definidos en AREAS pero sin crear en la BD)
  const [valoresNuevos, setValoresNuevos] = useState<Record<string, string>>({});
  const [creandoClave, setCreandoClave] = useState<string | null>(null);

  const [subiendoImagenClave, setSubiendoImagenClave] = useState<string | null>(null);

  // Sube una imagen y guarda la URL en el lugar correcto según si el bloque
  // ya existe (valoresEditados, listo para "Guardar cambio") o todavía no
  // (valoresNuevos, listo para el mini-formulario de "crear aquí mismo").
  async function subirImagenCampo(
    e: React.ChangeEvent<HTMLInputElement>,
    campo: DefinicionCampo,
    existe: boolean,
  ) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    setSubiendoImagenClave(campo.clave);
    setMensaje(null);

    try {
      const datosForm = new FormData();
      datosForm.append("imagen", archivo);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/uploads/imagen`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: datosForm,
      });
      const json = await res.json();

      if (json.success) {
        if (existe) {
          setValoresEditados((prev) => ({ ...prev, [campo.clave]: json.data.url }));
        } else {
          setValoresNuevos((prev) => ({ ...prev, [campo.clave]: json.data.url }));
        }
      } else {
        setMensaje({ tipo: "error", texto: json.error || "No se pudo subir la imagen." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    } finally {
      setSubiendoImagenClave(null);
    }
  }

  async function cargarTodo() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contenido`);
      const json = await res.json();
      if (!json.success) return;

      setBloques(json.data);
      const iniciales: Record<string, string> = {};
      json.data.forEach((b: Bloque) => {
        iniciales[b.clave] = b.valor;
      });
      setValoresEditados(iniciales);

      const bv = json.data.find((b: Bloque) => b.clave === "kit_video_modulos");
      if (bv) {
        try {
          setVideos(JSON.parse(bv.valor));
        } catch {
          setVideos([]);
        }
      }
      const bl = json.data.find((b: Bloque) => b.clave === "contacto_lugares_practicas");
      if (bl) {
        try {
          setLugares(JSON.parse(bl.valor));
        } catch {
          setLugares([]);
        }
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos cargar el contenido." });
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contenido`);
        const json = await res.json();
        if (cancelado || !json.success) return;

        setBloques(json.data);
        const iniciales: Record<string, string> = {};
        json.data.forEach((b: Bloque) => {
          iniciales[b.clave] = b.valor;
        });
        setValoresEditados(iniciales);

        const bv = json.data.find((b: Bloque) => b.clave === "kit_video_modulos");
        if (bv) {
          try {
            setVideos(JSON.parse(bv.valor));
          } catch {
            setVideos([]);
          }
        }
        const bl = json.data.find((b: Bloque) => b.clave === "contacto_lugares_practicas");
        if (bl) {
          try {
            setLugares(JSON.parse(bl.valor));
          } catch {
            setLugares([]);
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

  function actualizarVideo(i: number, campo: "titulo" | "youtubeId", valor: string) {
    setVideos((prev) => {
      const copia = prev.map((v, idx) => (idx === i ? { ...v, [campo]: valor } : v));
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
  function quitarVideo(i: number) {
    setVideos((prev) => {
      const copia = prev.filter((_, idx) => idx !== i).map((v, idx) => ({ ...v, numero: idx + 1 }));
      setValoresEditados((ve) => ({ ...ve, kit_video_modulos: JSON.stringify(copia) }));
      return copia;
    });
  }

  function actualizarLugar(i: number, campo: "zona" | "telefono", valor: string) {
    setLugares((prev) => {
      const copia = prev.map((l, idx) => (idx === i ? { ...l, [campo]: valor } : l));
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
  function quitarLugar(i: number) {
    setLugares((prev) => {
      const copia = prev.filter((_, idx) => idx !== i);
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
        setMensaje({ tipo: "ok", texto: "Guardado." });
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

  async function crearBloqueFaltante(campo: DefinicionCampo) {
    setCreandoClave(campo.clave);
    setMensaje(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contenido`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          clave: campo.clave,
          valor: valoresNuevos[campo.clave] || "",
          tipo: campo.tipo,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMensaje({ tipo: "ok", texto: "Creado." });
        await cargarTodo();
      } else {
        setMensaje({ tipo: "error", texto: json.error || "No se pudo crear." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    } finally {
      setCreandoClave(null);
    }
  }

  function renderCampo(campo: DefinicionCampo) {
    const bloque = bloques.find((b) => b.clave === campo.clave);

    // El bloque todavía no existe en la base — se ofrece crearlo aquí mismo
    if (!bloque) {
      if (campo.esImagen) {
        return (
          <div key={campo.clave} className="rounded-xl bg-white border border-dashed border-neutral-bg p-5">
            <p className="text-sm font-medium text-brand-blue mb-1">{campo.etiqueta}</p>
            <p className="text-xs text-neutral-text mb-3">Todavía no se ha subido esta imagen.</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => subirImagenCampo(e, campo, false)}
              className="text-sm mb-3"
            />
            {subiendoImagenClave === campo.clave && (
              <p className="text-xs text-brand-blueLight mb-3">Subiendo...</p>
            )}
            {valoresNuevos[campo.clave] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={valoresNuevos[campo.clave]} alt="" className="rounded-lg max-h-40 mb-3" />
            )}
            <button
              onClick={() => crearBloqueFaltante(campo)}
              disabled={creandoClave === campo.clave || !valoresNuevos[campo.clave]}
              className="block rounded-lg bg-brand-blue text-white text-sm px-4 py-2 font-medium hover:opacity-90 disabled:opacity-60"
            >
              {creandoClave === campo.clave ? "Guardando..." : "Guardar"}
            </button>
          </div>
        );
      }

      return (
        <div key={campo.clave} className="rounded-xl bg-white border border-dashed border-neutral-bg p-5">
          <p className="text-sm font-medium text-brand-blue mb-1">{campo.etiqueta}</p>
          <p className="text-xs text-neutral-text mb-3">Todavía no se ha configurado este texto.</p>
          <textarea
            value={valoresNuevos[campo.clave] || ""}
            onChange={(e) => setValoresNuevos((prev) => ({ ...prev, [campo.clave]: e.target.value }))}
            rows={3}
            className="w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm mb-3"
          />
          <button
            onClick={() => crearBloqueFaltante(campo)}
            disabled={creandoClave === campo.clave}
            className="rounded-lg bg-brand-blue text-white text-sm px-4 py-2 font-medium hover:opacity-90 disabled:opacity-60"
          >
            {creandoClave === campo.clave ? "Creando..." : "Guardar"}
          </button>
        </div>
      );
    }

    if (campo.esImagen) {
      const editado = valoresEditados[campo.clave] ?? "";
      const cambio = editado !== bloque.valor;
      return (
        <div key={bloque._id} className="rounded-xl bg-white border border-neutral-bg p-5">
          <p className="text-sm font-medium text-brand-blue mb-3">{campo.etiqueta}</p>
          {editado && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={editado} alt="" className="rounded-lg max-h-40 mb-3" />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => subirImagenCampo(e, campo, true)}
            className="text-sm mb-3"
          />
          {subiendoImagenClave === campo.clave && (
            <p className="text-xs text-brand-blueLight mb-3">Subiendo...</p>
          )}
          {cambio && (
            <button
              onClick={() => guardarBloque(bloque)}
              disabled={guardandoClave === campo.clave}
              className="block rounded-lg bg-brand-pink text-white text-sm px-4 py-2 font-medium hover:opacity-90 disabled:opacity-60"
            >
              {guardandoClave === campo.clave ? "Guardando..." : "Guardar cambio"}
            </button>
          )}
        </div>
      );
    }

    if (campo.clave === "kit_video_modulos") {
      const cambio = valoresEditados.kit_video_modulos !== bloque.valor;
      return (
        <div key={bloque._id} className="rounded-xl bg-white border border-neutral-bg p-5">
          <p className="text-sm font-medium text-brand-blue mb-3">{campo.etiqueta}</p>
          <div className="grid gap-3 mb-3">
            {videos.map((video, i) => (
              <div key={i} className="rounded-lg border border-neutral-bg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-neutral-text">Video {i + 1}</span>
                  <button onClick={() => quitarVideo(i)} className="text-xs text-brand-pink hover:underline">
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
          <button onClick={agregarVideo} className="text-sm text-brand-blueLight hover:underline mb-3 block">
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

    if (campo.clave === "contacto_lugares_practicas") {
      const cambio = valoresEditados.contacto_lugares_practicas !== bloque.valor;
      return (
        <div key={bloque._id} className="rounded-xl bg-white border border-neutral-bg p-5">
          <p className="text-sm font-medium text-brand-blue mb-3">{campo.etiqueta}</p>
          <div className="grid gap-3 mb-3">
            {lugares.map((lugar, i) => (
              <div key={i} className="flex gap-2 items-start">
                <input
                  type="text"
                  value={lugar.zona}
                  onChange={(e) => actualizarLugar(i, "zona", e.target.value)}
                  placeholder="Zona"
                  className="flex-1 rounded-lg border border-neutral-bg px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={lugar.telefono}
                  onChange={(e) => actualizarLugar(i, "telefono", e.target.value)}
                  placeholder="Teléfono"
                  className="w-40 rounded-lg border border-neutral-bg px-3 py-2 text-sm"
                />
                <button onClick={() => quitarLugar(i)} className="text-xs text-brand-pink hover:underline px-2 py-2">
                  Quitar
                </button>
              </div>
            ))}
          </div>
          <button onClick={agregarLugar} className="text-sm text-brand-blueLight hover:underline mb-3 block">
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

    const editado = valoresEditados[bloque.clave] ?? "";
    const cambio = editado !== bloque.valor;

    return (
      <div key={bloque._id} className="rounded-xl bg-white border border-neutral-bg p-5">
        <p className="text-sm font-medium text-brand-blue mb-2">{campo.etiqueta}</p>
        {campo.tipo === "html" ? (
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

  const area = AREAS.find((a) => a.id === areaActiva);

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="font-display text-2xl font-bold text-brand-blue mb-1">
        Contenido de la página
      </h2>

      {cargando && <p className="text-sm text-neutral-text">Cargando...</p>}

      {!cargando && !area && (
        <>
          <p className="text-sm text-neutral-text mb-6">
            Elige qué parte del sitio quieres editar.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {AREAS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAreaActiva(a.id)}
                className="rounded-xl bg-white border border-neutral-bg p-6 text-left hover:border-brand-blueLight transition-colors"
              >
                <p className="font-display font-semibold text-brand-blue">{a.titulo}</p>
                <p className="text-xs text-neutral-text mt-1">{a.campos.length} elementos editables</p>
              </button>
            ))}
          </div>
        </>
      )}

      {!cargando && area && (
        <>
          <button
            onClick={() => setAreaActiva(null)}
            className="text-sm text-brand-blueLight hover:underline mb-4 block"
          >
            ← Volver a las áreas
          </button>
          <h3 className="font-display font-semibold text-brand-blue mb-4 pb-2 border-b border-neutral-bg">
            {area.titulo}
          </h3>
          <div className="grid gap-4">{area.campos.map(renderCampo)}</div>
        </>
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