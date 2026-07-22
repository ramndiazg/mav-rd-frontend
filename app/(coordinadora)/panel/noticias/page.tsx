"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Paginacion from "@/components/ui/Paginacion";

type Comentario = {
  _id: string;
  userId: { nombre: string; apellido: string } | string;
  texto: string;
  fecha: string;
};

type Noticia = {
  _id: string;
  titulo: string;
  contenido: string;
  imagenUrl?: string;
  videoEmbedUrl?: string;
  autorId?: { nombre: string; apellido: string };
  comentarios: Comentario[];
  likes: string[];
};

const POR_PAGINA = 9;

function formularioVacio() {
  return { titulo: "", contenido: "", imagenUrl: "", videoEmbedUrl: "" };
}

export default function PanelNoticiasPage() {
  const { token } = useAuth();

  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  const [editandoId, setEditandoId] = useState<string | "nueva" | null>(null);
  const [form, setForm] = useState(formularioVacio());
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [comentariosAbiertos, setComentariosAbiertos] = useState<string | null>(null);

  const [mensaje, setMensaje] = useState<{
    tipo: "ok" | "error";
    texto: string;
  } | null>(null);

  async function cargar(paginaBuscada: number) {
    setCargando(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/noticias?page=${paginaBuscada}&limit=${POR_PAGINA}`,
      );
      const json = await res.json();
      if (json.success) {
        setNoticias(json.data);
        setTotalPaginas(json.paginacion?.totalPaginas || 1);
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos cargar las noticias." });
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/noticias?page=1&limit=${POR_PAGINA}`,
        );
        const json = await res.json();
        if (!cancelado && json.success) {
          setNoticias(json.data);
          setTotalPaginas(json.paginacion?.totalPaginas || 1);
        }
      } catch {
        if (!cancelado) {
          setMensaje({ tipo: "error", texto: "No pudimos cargar las noticias." });
        }
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, []);

  // Después de crear/editar/eliminar o borrar un comentario, siempre
  // recargamos la página ACTUAL (no forzamos volver a la 1) — salvo cuando
  // se acaba de publicar una noticia nueva, donde sí tiene sentido volver a
  // la página 1 para verla de inmediato (queda arriba por el sort createdAt: -1).
  function irAPagina(nuevaPagina: number) {
    setPagina(nuevaPagina);
    cargar(nuevaPagina);
  }

  function abrirNueva() {
    setForm(formularioVacio());
    setEditandoId("nueva");
    setMensaje(null);
  }

  function abrirEdicion(noticia: Noticia) {
    setForm({
      titulo: noticia.titulo,
      contenido: noticia.contenido,
      imagenUrl: noticia.imagenUrl || "",
      videoEmbedUrl: noticia.videoEmbedUrl || "",
    });
    setEditandoId(noticia._id);
    setMensaje(null);
  }

  async function subirImagen(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    setSubiendoImagen(true);
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
        setForm((prev) => ({ ...prev, imagenUrl: json.data.url }));
      } else {
        setMensaje({ tipo: "error", texto: json.error || "No se pudo subir la imagen." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    } finally {
      setSubiendoImagen(false);
    }
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);

    try {
      const esNueva = editandoId === "nueva";
      const url = esNueva
        ? `${process.env.NEXT_PUBLIC_API_URL}/noticias`
        : `${process.env.NEXT_PUBLIC_API_URL}/noticias/${editandoId}`;

      const res = await fetch(url, {
        method: esNueva ? "POST" : "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (json.success) {
        setMensaje({ tipo: "ok", texto: esNueva ? "Noticia publicada." : "Noticia actualizada." });
        setEditandoId(null);
        if (esNueva) {
          // Una noticia nueva aparece primero (createdAt: -1) — volvemos a
          // la página 1 para que la vea de inmediato, en vez de quedar
          // "perdida" si estaba viendo la página 3 del listado.
          setPagina(1);
          cargar(1);
        } else {
          cargar(pagina);
        }
      } else {
        setMensaje({ tipo: "error", texto: json.error || "No se pudo guardar." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(noticia: Noticia) {
    if (!confirm(`¿Eliminar "${noticia.titulo}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/noticias/${noticia._id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();

      if (json.success) {
        setMensaje({ tipo: "ok", texto: "Noticia eliminada." });
        // Si esta era la única noticia de la última página, retrocede una
        // página en vez de quedar mirando una página vacía.
        const paginaDestino =
          noticias.length === 1 && pagina > 1 ? pagina - 1 : pagina;
        setPagina(paginaDestino);
        cargar(paginaDestino);
      } else {
        setMensaje({ tipo: "error", texto: json.error || "No se pudo eliminar." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    }
  }

  async function eliminarComentario(noticia: Noticia, comentarioId: string) {
    if (!confirm("¿Eliminar este comentario?")) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/noticias/${noticia._id}/comentarios/${comentarioId}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();

      if (json.success) {
        cargar(pagina);
      } else {
        setMensaje({ tipo: "error", texto: json.error || "No se pudo eliminar el comentario." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="font-display text-2xl font-bold text-brand-blue mb-1">
        Noticias
      </h2>
      <p className="text-sm text-neutral-text mb-6">
        Publica novedades de la fundación y modera los comentarios de las
        estudiantes.
      </p>

      {!editandoId && (
        <>
          <button
            onClick={abrirNueva}
            className="mb-6 rounded-lg bg-brand-pink text-white text-sm px-4 py-2 font-medium hover:opacity-90"
          >
            + Nueva noticia
          </button>

          {cargando && <p className="text-sm text-neutral-text">Cargando...</p>}

          <div className="grid gap-4">
            {noticias.map((noticia) => (
              <div
                key={noticia._id}
                className="rounded-xl bg-white border border-neutral-bg p-5"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-display font-semibold text-brand-blue">
                      {noticia.titulo}
                    </p>
                    <p className="text-xs text-neutral-text">
                      {noticia.likes?.length || 0} me gusta ·{" "}
                      {noticia.comentarios?.length || 0} comentarios
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => abrirEdicion(noticia)}
                      className="text-xs font-medium px-3 py-1.5 rounded-full bg-brand-blueLight text-white hover:opacity-90"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => eliminar(noticia)}
                      className="text-xs font-medium px-3 py-1.5 rounded-full bg-white border border-brand-pink text-brand-pink hover:bg-brand-pinkLight"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                {noticia.comentarios?.length > 0 && (
                  <button
                    onClick={() =>
                      setComentariosAbiertos((prev) =>
                        prev === noticia._id ? null : noticia._id,
                      )
                    }
                    className="text-xs text-brand-blueLight hover:underline"
                  >
                    {comentariosAbiertos === noticia._id
                      ? "Ocultar comentarios"
                      : "Ver comentarios"}
                  </button>
                )}

                {comentariosAbiertos === noticia._id && (
                  <div className="mt-3 grid gap-2 border-t border-neutral-bg pt-3">
                    {noticia.comentarios.map((c) => (
                      <div
                        key={c._id}
                        className="flex items-start justify-between gap-2 text-sm"
                      >
                        <p className="text-neutral-text">
                          <span className="font-medium text-brand-blue">
                            {typeof c.userId === "object"
                              ? `${c.userId.nombre} ${c.userId.apellido}`
                              : "Estudiante"}
                            :
                          </span>{" "}
                          {c.texto}
                        </p>
                        <button
                          onClick={() => eliminarComentario(noticia, c._id)}
                          className="text-xs text-brand-pink hover:underline shrink-0"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {!cargando && (
            <Paginacion
              paginaActual={pagina}
              totalPaginas={totalPaginas}
              onCambiarPagina={irAPagina}
            />
          )}
        </>
      )}

      {editandoId && (
        <form onSubmit={guardar} className="grid gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-brand-blue">
              {editandoId === "nueva" ? "Nueva noticia" : "Editar noticia"}
            </h3>
            <button
              type="button"
              onClick={() => setEditandoId(null)}
              className="text-xs text-brand-blueLight hover:underline"
            >
              Cancelar
            </button>
          </div>

          <label className="text-sm text-neutral-text">
            Título
            <input
              type="text"
              required
              value={form.titulo}
              onChange={(e) => setForm((prev) => ({ ...prev, titulo: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
            />
          </label>

          <label className="text-sm text-neutral-text">
            Contenido
            <textarea
              required
              rows={6}
              value={form.contenido}
              onChange={(e) => setForm((prev) => ({ ...prev, contenido: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
            />
          </label>

          <div className="text-sm text-neutral-text">
            Imagen (opcional)
            <input
              type="file"
              accept="image/*"
              onChange={subirImagen}
              className="mt-1 w-full text-sm"
            />
            {subiendoImagen && <p className="text-xs text-brand-blueLight mt-1">Subiendo...</p>}
            {form.imagenUrl && !subiendoImagen && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.imagenUrl}
                alt="Vista previa"
                className="mt-2 rounded-lg max-h-40 object-cover"
              />
            )}
          </div>

          <label className="text-sm text-neutral-text">
            Link de video embebido (opcional — YouTube/Instagram)
            <input
              type="url"
              value={form.videoEmbedUrl}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, videoEmbedUrl: e.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
            />
          </label>

          <button
            type="submit"
            disabled={guardando || subiendoImagen}
            className="rounded-xl bg-brand-blue text-white p-4 font-display font-semibold hover:opacity-90 disabled:opacity-60"
          >
            {guardando ? "Guardando..." : "Publicar"}
          </button>
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