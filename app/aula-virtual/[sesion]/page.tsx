"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import RutaProtegida from "@/components/auth/RutaProtegida";
import { useAuth } from "@/contexts/AuthContext";

type Progreso = {
  sesionActualDesbloqueada: number;
  sesionesAprobadas: number[];
  cursoCompletado: boolean;
  contenidosVistos: string[];
};

type Sesion = {
  _id: string;
  numero: number;
  titulo: string;
};

type ContenidoItem = {
  _id: string;
  titulo: string;
  tipo: "video" | "pdf" | "enlace" | "texto";
  url?: string;
  contenidoTexto?: string;
  imagenUrl?: string;
};

type IntentoHistorial = {
  _id: string;
  fechaFin: string | null;
  aprobado: boolean | null;
};

function AulaVirtualContenido() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const numeroSesion = Number(params.sesion);

  const [progreso, setProgreso] = useState<Progreso | null>(null);
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [contenidos, setContenidos] = useState<ContenidoItem[]>([]);
  const [historial, setHistorial] = useState<IntentoHistorial[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marcandoId, setMarcandoId] = useState<string | null>(null);
  const [buscandoExamen, setBuscandoExamen] = useState(false);

  async function cargarTodo() {
    try {
      const resProgreso = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/progreso/me`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const jsonProgreso = await resProgreso.json();
      if (!jsonProgreso.success) {
        setError("No pudimos verificar tu progreso.");
        return;
      }
      setProgreso(jsonProgreso.data);

      if (numeroSesion > jsonProgreso.data.sesionActualDesbloqueada) {
        return; // sesión bloqueada, no hace falta pedir nada más
      }

      const resSesion = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/sesiones/${numeroSesion}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const jsonSesion = await resSesion.json();
      if (!jsonSesion.success) {
        setError(jsonSesion.error || "No pudimos cargar esta sesión.");
        return;
      }
      setSesion(jsonSesion.data);

      const resContenidos = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/contenido-sesion/sesion/${jsonSesion.data._id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const jsonContenidos = await resContenidos.json();
      if (jsonContenidos.success) setContenidos(jsonContenidos.data);

      const resHistorial = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/intentos-examen/historial/${jsonSesion.data._id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const jsonHistorial = await resHistorial.json();
      if (jsonHistorial.success) setHistorial(jsonHistorial.data);
    } catch {
      setError("No pudimos conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    if (!token || !numeroSesion) return;
    let cancelado = false;

    (async () => {
      try {
        const resProgreso = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/progreso/me`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const jsonProgreso = await resProgreso.json();
        if (cancelado) return;

        if (!jsonProgreso.success) {
          setError("No pudimos verificar tu progreso.");
          return;
        }
        setProgreso(jsonProgreso.data);

        if (numeroSesion > jsonProgreso.data.sesionActualDesbloqueada) {
          return; // sesión bloqueada, no hace falta pedir nada más
        }

        const resSesion = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/sesiones/${numeroSesion}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const jsonSesion = await resSesion.json();
        if (cancelado) return;

        if (!jsonSesion.success) {
          setError(jsonSesion.error || "No pudimos cargar esta sesión.");
          return;
        }
        setSesion(jsonSesion.data);

        const [resContenidos, resHistorial] = await Promise.all([
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/contenido-sesion/sesion/${jsonSesion.data._id}`,
            { headers: { Authorization: `Bearer ${token}` } },
          ),
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/intentos-examen/historial/${jsonSesion.data._id}`,
            { headers: { Authorization: `Bearer ${token}` } },
          ),
        ]);
        const jsonContenidos = await resContenidos.json();
        const jsonHistorial = await resHistorial.json();
        if (cancelado) return;

        if (jsonContenidos.success) setContenidos(jsonContenidos.data);
        if (jsonHistorial.success) setHistorial(jsonHistorial.data);
      } catch {
        if (!cancelado) setError("No pudimos conectar con el servidor.");
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [token, numeroSesion]);

  async function marcarVisto(item: ContenidoItem) {
    setMarcandoId(item._id);
    setError(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/contenido-sesion/${item._id}/marcar-visto`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();

      if (json.success) {
        // Recargamos todo: si era el último contenido, el backend ya generó
        // el examen solo, y esto trae el progreso/intento actualizados.
        await cargarTodo();
      } else {
        setError(json.error || "No pudimos marcar esto como visto.");
      }
    } catch {
      setError("No pudimos conectar con el servidor.");
    } finally {
      setMarcandoId(null);
    }
  }

  async function irAlExamen() {
    if (!sesion) return;
    setBuscandoExamen(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/intentos-examen/activo/${sesion._id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();
      if (json.success) {
        router.push(`/examen/${json.data._id}`);
      } else {
        setError(
          "Todavía no tienes un examen disponible para esta sesión. Termina de ver todo el contenido de arriba.",
        );
      }
    } catch {
      setError("No pudimos conectar con el servidor.");
    } finally {
      setBuscandoExamen(false);
    }
  }

  async function reintentar() {
    if (!sesion) return;
    setBuscandoExamen(true);
    setError(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/intentos-examen/reintentar/${sesion._id}`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();
      if (json.success) {
        router.push(`/examen/${json.data._id}`);
      } else {
        setError(json.error || "No se pudo iniciar un nuevo intento.");
      }
    } catch {
      setError("No pudimos conectar con el servidor.");
    } finally {
      setBuscandoExamen(false);
    }
  }

  const bloqueada =
    progreso !== null && numeroSesion > progreso.sesionActualDesbloqueada;
  const yaAprobada = progreso?.sesionesAprobadas.includes(numeroSesion);

  const idsVistos = new Set(progreso?.contenidosVistos.map(String) || []);
  const todosVistos =
    contenidos.length > 0 && contenidos.every((c) => idsVistos.has(c._id));

  const ultimoIntento = historial[historial.length - 1];
  const puedeReintentar =
    !yaAprobada &&
    ultimoIntento?.fechaFin &&
    ultimoIntento?.aprobado === false &&
    historial.length < 3;

  return (
    <main className="bg-neutral-bg min-h-screen px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/dashboard"
          className="text-sm text-brand-blueLight hover:underline"
        >
          ← Volver a mi panel
        </Link>

        {cargando && (
          <p className="text-neutral-text text-sm mt-6">Cargando sesión...</p>
        )}

        {!cargando && bloqueada && (
          <div className="mt-6 rounded-xl bg-white border border-neutral-bg p-8 text-center">
            <p className="text-neutral-text">
              Todavía no tienes acceso a esta sesión. Completa las anteriores
              primero.
            </p>
          </div>
        )}

        {!cargando && !bloqueada && error && (
          <div className="mt-6 rounded-lg bg-brand-pinkLight border border-brand-pink p-4 text-brand-blue text-sm">
            {error}
          </div>
        )}

        {!cargando && !bloqueada && sesion && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="font-display text-2xl font-bold text-brand-blue">
                {sesion.titulo}
              </h1>
              {yaAprobada && (
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-status-success text-white">
                  Aprobada
                </span>
              )}
            </div>

            {contenidos.length === 0 && (
              <div className="rounded-xl bg-white border border-neutral-bg p-6 mb-6 text-sm text-neutral-text">
                Todavía no hay material de estudio cargado para esta sesión.
                Contacta a tu coordinadora.
              </div>
            )}

            {contenidos.length > 0 && !yaAprobada && (
              <p className="text-sm text-neutral-text mb-4">
                Revisa todo el material — cuando termines el último, tu examen
                se habilita automáticamente.
              </p>
            )}

            <div className="grid gap-4 mb-8">
              {contenidos.map((item) => {
                const visto = idsVistos.has(item._id);
                return (
                  <div
                    key={item._id}
                    className={`rounded-xl bg-white border p-5 min-w-0 ${visto ? "border-status-success/40" : "border-neutral-bg"
                      }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-display font-semibold text-brand-blue break-words">
                        {item.titulo}
                      </p>
                      {visto && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-status-success text-white">
                          ✓ Visto
                        </span>
                      )}
                    </div>

                    {item.imagenUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imagenUrl}
                        alt=""
                        className="w-full rounded-lg mb-3 max-h-56 object-cover"
                      />
                    )}

                    {item.tipo === "video" && item.url && (
                      <div className="aspect-video mb-3">
                        <iframe
                          className="w-full h-full rounded-lg"
                          src={item.url}
                          title={item.titulo}
                          allowFullScreen
                        />
                      </div>
                    )}

                    {item.tipo === "pdf" && item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-brand-blueLight hover:underline mb-3 inline-block"
                      >
                        Abrir PDF ↗
                      </a>
                    )}

                    {item.tipo === "enlace" && item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-brand-blueLight hover:underline mb-3 inline-block"
                      >
                        Abrir enlace ↗
                      </a>
                    )}

                    {item.tipo === "texto" && item.contenidoTexto && (
                      <div
                        className="text-sm text-neutral-text mb-3 prose prose-sm max-w-none break-words [overflow-wrap:anywhere]"
                        dangerouslySetInnerHTML={{ __html: item.contenidoTexto }}
                      />
                    )}

                    {!visto && (
                      <button
                        onClick={() => marcarVisto(item)}
                        disabled={marcandoId === item._id}
                        className="text-sm rounded-lg bg-brand-blue text-white px-4 py-2 font-medium hover:opacity-90 disabled:opacity-60"
                      >
                        {marcandoId === item._id ? "Marcando..." : "Marcar como visto"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {!yaAprobada && todosVistos && (
              <button
                onClick={irAlExamen}
                disabled={buscandoExamen}
                className="w-full rounded-xl bg-brand-pink text-white p-4 font-display font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {buscandoExamen ? "Buscando tu examen..." : "Ir al examen"}
              </button>
            )}

            {puedeReintentar && (
              <button
                onClick={reintentar}
                disabled={buscandoExamen}
                className="w-full rounded-xl bg-brand-blue text-white p-4 font-display font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 mt-3"
              >
                {buscandoExamen ? "Preparando..." : "Reintentar examen"}
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function AulaVirtualPage() {
  return (
    <RutaProtegida rolesPermitidos={["estudiante"]}>
      <AulaVirtualContenido />
    </RutaProtegida>
  );
}