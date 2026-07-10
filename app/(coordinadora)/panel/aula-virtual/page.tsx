"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

type Estudiante = {
  _id: string;
  nombre: string;
  apellido: string;
  cedula: string;
  email: string;
};

type Progreso = {
  sesionActualDesbloqueada: number;
  sesionesAprobadas: number[];
  cursoCompletado: boolean;
};

type Sesion = { _id: string; numero: number; titulo: string };

type TipoContenido = "video" | "pdf" | "enlace" | "texto";
type ContenidoItem = {
  _id: string;
  sesionId: string;
  titulo: string;
  tipo: TipoContenido;
  url?: string;
  contenidoTexto?: string;
  imagenUrl?: string;
  orden: number;
  activo: boolean;
};

function contenidoVacio() {
  return {
    titulo: "",
    tipo: "video" as TipoContenido,
    url: "",
    contenidoTexto: "",
    imagenUrl: "",
    orden: 0,
  };
}

export default function PanelAulaVirtualPage() {
  const { token } = useAuth();

  const [vista, setVista] = useState<"desbloquear" | "contenido">("desbloquear");

  const [elegibles, setElegibles] = useState<Estudiante[]>([]);
  const [cargandoElegibles, setCargandoElegibles] = useState(true);

  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<Estudiante[]>([]);
  const [buscando, setBuscando] = useState(false);

  const [seleccionada, setSeleccionada] = useState<Estudiante | null>(null);
  const [progreso, setProgreso] = useState<Progreso | null>(null);
  const [sinPago, setSinPago] = useState(false);
  const [cargandoProgreso, setCargandoProgreso] = useState(false);

  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [desbloqueandoNumero, setDesbloqueandoNumero] = useState<
    number | null
  >(null);
  const [mensaje, setMensaje] = useState<{
    tipo: "ok" | "error";
    texto: string;
  } | null>(null);

  // Cargar el catálogo de sesiones una sola vez (para tener el _id real de cada numero)
  useEffect(() => {
    if (!token) return;
    let cancelado = false;

    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/sesiones`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const json = await res.json();
        if (!cancelado && json.success) setSesiones(json.data);
      } catch {
        // Si esto falla, los botones de desbloqueo simplemente no aparecen
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [token]);

  // Lista de "listas para examen": pagadas + no han completado el curso.
  // No hay un endpoint que devuelva esto directo, así que se arma cruzando
  // inscripciones pagadas con el progreso de cada una.
  useEffect(() => {
    if (!token) return;
    let cancelado = false;

    (async () => {
      try {
        const resIns = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/inscripciones?estadoPago=pagado`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const jsonIns = await resIns.json();
        if (!jsonIns.success) return;

        const estudiantesPagados: Estudiante[] = jsonIns.data.map(
          (ins: { userId: Estudiante }) => ins.userId,
        );

        const progresos = await Promise.all(
          estudiantesPagados.map((est) =>
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/progreso/${est._id}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
              .then((r) => r.json())
              .catch(() => ({ success: false })),
          ),
        );

        const noCompletadas = estudiantesPagados.filter((_, i) => {
          const p = progresos[i];
          return p.success && !p.data.cursoCompletado;
        });

        if (!cancelado) {
          setElegibles(
            noCompletadas.sort((a, b) => a.nombre.localeCompare(b.nombre)),
          );
        }
      } catch {
        // silencioso — la coordinadora igual puede usar la búsqueda de abajo
      } finally {
        if (!cancelado) setCargandoElegibles(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [token]);

  async function buscarEstudiantes(e: React.FormEvent) {
    e.preventDefault();
    setBuscando(true);
    setMensaje(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/usuarios?rol=estudiante&search=${encodeURIComponent(busqueda)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();
      if (json.success) {
        setResultados(json.data);
      } else {
        setMensaje({ tipo: "error", texto: json.error || "Error al buscar." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    } finally {
      setBuscando(false);
    }
  }

  async function seleccionarEstudiante(estudiante: Estudiante) {
    setSeleccionada(estudiante);
    setProgreso(null);
    setSinPago(false);
    setMensaje(null);
    setCargandoProgreso(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/progreso/${estudiante._id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();

      if (json.success) {
        setProgreso(json.data);
      } else {
        // Sin ProgresoEstudiante = sin pago confirmado todavía
        setSinPago(true);
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos cargar su progreso." });
    } finally {
      setCargandoProgreso(false);
    }
  }

  async function desbloquear(sesion: Sesion) {
    if (!seleccionada) return;
    setDesbloqueandoNumero(sesion.numero);
    setMensaje(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/examenes/${sesion._id}/desbloquear`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: seleccionada._id }),
        },
      );
      const json = await res.json();

      if (json.success) {
        setMensaje({
          tipo: "ok",
          texto: `Examen de la Sesión ${sesion.numero} desbloqueado para ${seleccionada.nombre}.`,
        });
        // Refrescar su progreso para reflejar el nuevo estado
        seleccionarEstudiante(seleccionada);
      } else {
        setMensaje({ tipo: "error", texto: json.error || "No se pudo desbloquear." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    } finally {
      setDesbloqueandoNumero(null);
    }
  }

  // --- Gestión de contenido de estudio ---
  const [sesionContenidoId, setSesionContenidoId] = useState<string | null>(null);
  const [contenidos, setContenidos] = useState<ContenidoItem[]>([]);
  const [cargandoContenidos, setCargandoContenidos] = useState(false);
  const [editandoContenidoId, setEditandoContenidoId] = useState<string | "nuevo" | null>(null);
  const [formContenido, setFormContenido] = useState(contenidoVacio());
  const [guardandoContenido, setGuardandoContenido] = useState(false);
  const [subiendoImagenContenido, setSubiendoImagenContenido] = useState(false);

  async function subirImagenContenido(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setSubiendoImagenContenido(true);
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
        setFormContenido((prev) => ({ ...prev, imagenUrl: json.data.url }));
      } else {
        setMensaje({ tipo: "error", texto: json.error || "No se pudo subir la imagen." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    } finally {
      setSubiendoImagenContenido(false);
    }
  }

  async function cargarContenidos(sesionId: string) {
    setCargandoContenidos(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/contenido-sesion/admin/sesion/${sesionId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();
      if (json.success) setContenidos(json.data);
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos cargar el contenido de esta sesión." });
    } finally {
      setCargandoContenidos(false);
    }
  }

  function elegirSesionContenido(sesionId: string) {
    setSesionContenidoId(sesionId);
    setEditandoContenidoId(null);
    cargarContenidos(sesionId);
  }

  function abrirNuevoContenido() {
    setFormContenido(contenidoVacio());
    setEditandoContenidoId("nuevo");
  }

  function abrirEdicionContenido(item: ContenidoItem) {
    setFormContenido({
      titulo: item.titulo,
      tipo: item.tipo,
      url: item.url || "",
      contenidoTexto: item.contenidoTexto || "",
      imagenUrl: item.imagenUrl || "",
      orden: item.orden,
    });
    setEditandoContenidoId(item._id);
  }

  async function guardarContenido(e: React.FormEvent) {
    e.preventDefault();
    if (!sesionContenidoId) return;
    setGuardandoContenido(true);
    setMensaje(null);

    try {
      const esNuevo = editandoContenidoId === "nuevo";
      const url = esNuevo
        ? `${process.env.NEXT_PUBLIC_API_URL}/contenido-sesion`
        : `${process.env.NEXT_PUBLIC_API_URL}/contenido-sesion/${editandoContenidoId}`;
      const body = esNuevo
        ? { sesionId: sesionContenidoId, ...formContenido }
        : { ...formContenido };

      const res = await fetch(url, {
        method: esNuevo ? "POST" : "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (json.success) {
        setMensaje({ tipo: "ok", texto: esNuevo ? "Material agregado." : "Material actualizado." });
        setEditandoContenidoId(null);
        cargarContenidos(sesionContenidoId);
      } else {
        setMensaje({ tipo: "error", texto: json.error || "No se pudo guardar." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    } finally {
      setGuardandoContenido(false);
    }
  }

  async function alternarActivoContenido(item: ContenidoItem) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/contenido-sesion/${item._id}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ activo: !item.activo }),
        },
      );
      const json = await res.json();
      if (json.success && sesionContenidoId) {
        cargarContenidos(sesionContenidoId);
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setVista("desbloquear")}
          className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${vista === "desbloquear"
            ? "bg-brand-blue text-white"
            : "bg-white border border-neutral-bg text-neutral-text"
            }`}
        >
          Desbloquear exámenes
        </button>
        <button
          onClick={() => setVista("contenido")}
          className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${vista === "contenido"
            ? "bg-brand-blue text-white"
            : "bg-white border border-neutral-bg text-neutral-text"
            }`}
        >
          Contenido de estudio
        </button>
      </div>

      {vista === "contenido" && (
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-blue mb-1">
            Contenido de estudio
          </h2>
          <p className="text-sm text-neutral-text mb-6">
            Los materiales que la estudiante ve antes de poder tomar su examen.
            Cuando marca el último como visto, el examen se desbloquea solo —
            ya no hace falta desbloquearlo manualmente en el flujo normal.
          </p>

          <div className="flex gap-2 mb-6">
            {sesiones.map((s) => (
              <button
                key={s._id}
                onClick={() => elegirSesionContenido(s._id)}
                className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${sesionContenidoId === s._id
                  ? "bg-brand-blue text-white"
                  : "bg-white border border-neutral-bg text-neutral-text"
                  }`}
              >
                Sesión {s.numero}
              </button>
            ))}
          </div>

          {sesionContenidoId && !editandoContenidoId && (
            <>
              <button
                onClick={abrirNuevoContenido}
                className="mb-4 rounded-lg bg-brand-pink text-white text-sm px-4 py-2 font-medium hover:opacity-90"
              >
                + Agregar material
              </button>

              {cargandoContenidos && <p className="text-sm text-neutral-text">Cargando...</p>}

              <div className="grid gap-3">
                {contenidos.map((item) => (
                  <div key={item._id} className="rounded-lg bg-white border border-neutral-bg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-brand-blue text-sm">
                          {item.titulo}{" "}
                          <span className="text-xs text-neutral-text">({item.tipo})</span>
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full shrink-0 ml-3 ${item.activo ? "bg-status-success text-white" : "bg-neutral-bg text-neutral-text"
                          }`}
                      >
                        {item.activo ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => abrirEdicionContenido(item)}
                        className="text-xs font-medium px-3 py-1.5 rounded-full bg-brand-blueLight text-white hover:opacity-90"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => alternarActivoContenido(item)}
                        className="text-xs font-medium px-3 py-1.5 rounded-full bg-white border border-neutral-bg text-neutral-text hover:bg-neutral-bg"
                      >
                        {item.activo ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {sesionContenidoId && editandoContenidoId && (
            <form onSubmit={guardarContenido} className="grid gap-4 rounded-xl bg-white border border-neutral-bg p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-brand-blue">
                  {editandoContenidoId === "nuevo" ? "Nuevo material" : "Editar material"}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditandoContenidoId(null)}
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
                  value={formContenido.titulo}
                  onChange={(e) => setFormContenido((p) => ({ ...p, titulo: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
                />
              </label>

              <label className="text-sm text-neutral-text">
                Tipo
                <select
                  value={formContenido.tipo}
                  onChange={(e) =>
                    setFormContenido((p) => ({ ...p, tipo: e.target.value as TipoContenido }))
                  }
                  className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
                >
                  <option value="video">Video</option>
                  <option value="pdf">PDF</option>
                  <option value="enlace">Enlace</option>
                  <option value="texto">Texto</option>
                </select>
              </label>

              {formContenido.tipo === "texto" ? (
                <label className="text-sm text-neutral-text">
                  Contenido
                  <textarea
                    required
                    rows={4}
                    value={formContenido.contenidoTexto}
                    onChange={(e) =>
                      setFormContenido((p) => ({ ...p, contenidoTexto: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
                  />
                </label>
              ) : (
                <label className="text-sm text-neutral-text">
                  {formContenido.tipo === "video" ? "URL de embed de YouTube" : "URL"}
                  <input
                    type="text"
                    required
                    value={formContenido.url}
                    onChange={(e) => setFormContenido((p) => ({ ...p, url: e.target.value }))}
                    placeholder={
                      formContenido.tipo === "video"
                        ? "https://www.youtube.com/embed/XXXXXXXXXXX"
                        : "https://..."
                    }
                    className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
                  />
                </label>
              )}

              <div className="text-sm text-neutral-text">
                Imagen de portada (opcional)
                <input
                  type="file"
                  accept="image/*"
                  onChange={subirImagenContenido}
                  className="mt-1 w-full text-sm"
                />
                {subiendoImagenContenido && (
                  <p className="text-xs text-brand-blueLight mt-1">Subiendo...</p>
                )}
                {formContenido.imagenUrl && !subiendoImagenContenido && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={formContenido.imagenUrl}
                    alt="Vista previa"
                    className="mt-2 rounded-lg max-h-32 object-cover"
                  />
                )}
              </div>

              <label className="text-sm text-neutral-text">
                Orden
                <input
                  type="number"
                  value={formContenido.orden}
                  onChange={(e) =>
                    setFormContenido((p) => ({ ...p, orden: Number(e.target.value) }))
                  }
                  className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
                />
              </label>

              <button
                type="submit"
                disabled={guardandoContenido || subiendoImagenContenido}
                className="rounded-lg bg-brand-pink text-white text-sm px-4 py-2 font-medium hover:opacity-90 disabled:opacity-60 w-fit"
              >
                {guardandoContenido ? "Guardando..." : "Guardar"}
              </button>
            </form>
          )}
        </div>
      )}

      {vista === "desbloquear" && (
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-blue mb-1">
            Aula Virtual — Desbloquear exámenes
          </h2>
          <p className="text-sm text-neutral-text mb-6">
            Busca a la estudiante y desbloquea la sesión correspondiente cuando
            esté lista para tomar su examen presencial.
          </p>

          {!seleccionada && (
            <div className="mb-8">
              <p className="text-sm font-medium text-neutral-text mb-3">
                Listas para examen ({elegibles.length})
              </p>

              {cargandoElegibles && (
                <p className="text-sm text-neutral-text">Cargando...</p>
              )}

              {!cargandoElegibles && elegibles.length === 0 && (
                <p className="text-sm text-neutral-text">
                  No hay estudiantes pagadas con curso pendiente en este momento.
                </p>
              )}

              <div className="grid gap-2 sm:grid-cols-2">
                {elegibles.map((est) => (
                  <button
                    key={est._id}
                    onClick={() => seleccionarEstudiante(est)}
                    className="text-left rounded-lg bg-white border border-neutral-bg p-3 hover:border-brand-blueLight transition-colors"
                  >
                    <p className="font-medium text-brand-blue text-sm">
                      {est.nombre} {est.apellido}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!seleccionada && (
            <p className="text-sm font-medium text-neutral-text mb-3">
              O busca por nombre, cédula o email
            </p>
          )}

          <form onSubmit={buscarEstudiantes} className="flex gap-2 mb-6">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre, cédula o email..."
              className="flex-1 rounded-lg border border-neutral-bg px-4 py-2 text-sm focus:outline-none focus:border-brand-blueLight"
            />
            <button
              type="submit"
              disabled={buscando}
              className="rounded-lg bg-brand-blue text-white px-5 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-60"
            >
              {buscando ? "Buscando..." : "Buscar"}
            </button>
          </form>

          {resultados.length > 0 && !seleccionada && (
            <div className="grid gap-2 mb-8">
              {resultados.map((est) => (
                <button
                  key={est._id}
                  onClick={() => seleccionarEstudiante(est)}
                  className="text-left rounded-lg bg-white border border-neutral-bg p-4 hover:border-brand-blueLight transition-colors"
                >
                  <p className="font-medium text-brand-blue">
                    {est.nombre} {est.apellido}
                  </p>
                  <p className="text-xs text-neutral-text">
                    {est.cedula} · {est.email}
                  </p>
                </button>
              ))}
            </div>
          )}

          {seleccionada && (
            <div className="rounded-xl bg-white border border-neutral-bg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-display font-semibold text-brand-blue">
                    {seleccionada.nombre} {seleccionada.apellido}
                  </p>
                  <p className="text-xs text-neutral-text">{seleccionada.email}</p>
                </div>
                <button
                  onClick={() => {
                    setSeleccionada(null);
                    setProgreso(null);
                    setMensaje(null);
                  }}
                  className="text-xs text-brand-blueLight hover:underline"
                >
                  Cambiar estudiante
                </button>
              </div>

              {cargandoProgreso && (
                <p className="text-sm text-neutral-text">Cargando progreso...</p>
              )}

              {!cargandoProgreso && sinPago && (
                <div className="rounded-lg bg-brand-pinkLight border border-brand-pink p-4 text-sm text-brand-blue">
                  Esta estudiante no tiene un pago confirmado — no se puede
                  desbloquear ninguna sesión todavía. Confírmalo primero desde el
                  panel de Pagos.
                </div>
              )}

              {!cargandoProgreso && progreso && (
                <div className="grid gap-3">
                  {sesiones.map((sesion) => {
                    const aprobada = progreso.sesionesAprobadas.includes(
                      sesion.numero,
                    );
                    const puedeDesbloquear =
                      sesion.numero <= progreso.sesionActualDesbloqueada + 1;

                    return (
                      <div
                        key={sesion._id}
                        className="flex items-center justify-between rounded-lg border border-neutral-bg p-4"
                      >
                        <div>
                          <p className="font-medium text-neutral-text">
                            Sesión {sesion.numero}
                          </p>
                          {aprobada && (
                            <span className="text-xs text-status-success font-medium">
                              Aprobada
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => desbloquear(sesion)}
                          disabled={
                            !puedeDesbloquear ||
                            desbloqueandoNumero === sesion.numero
                          }
                          className="rounded-lg bg-brand-pink text-white text-sm px-4 py-2 font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {desbloqueandoNumero === sesion.numero
                            ? "Desbloqueando..."
                            : aprobada
                              ? "Repetir examen"
                              : "Desbloquear examen"}
                        </button>
                      </div>
                    );
                  })}
                  {progreso.cursoCompletado && (
                    <p className="text-sm text-status-success font-medium mt-2">
                      ✓ Esta estudiante ya completó el curso.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
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