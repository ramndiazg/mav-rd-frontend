"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, ExternalLink, FileText } from "lucide-react";
import RutaProtegidaUS from "@/components/us/RutaProtegidaUS";
import { BotonPrimario, MensajeError } from "@/components/us/FormUI";
import { useUsAuth } from "@/contexts/UsAuthContext";
import { useUsLocale } from "@/contexts/UsLocaleContext";
import { API_URL, ApiErrorUS, usFetch } from "@/lib/us/api";
import {
  MAX_INTENTOS,
  TOTAL_MODULOS,
  formatearRestante,
  type ContenidoUS,
  type IntentoHistorial,
  type ProgresoUS,
  type ResultadoMarcarVisto,
  type SesionUS,
} from "@/lib/us/aula";
import type { DictKey } from "@/lib/us/dict";
import { nombreEstado } from "@/lib/us/estados";
import { useAhora } from "@/lib/us/useAhora";

// NUEVO (24/10/2026): un módulo del curso = una Sesion del backend.
// Replica el aula de RD (aula-virtual/[sesion]) con tres diferencias:
//  - usa /api/us/sesiones, /api/us/contenido/... (sin el test psicológico y con
//    los materiales filtrados por el estado de la estudiante);
//  - todo el texto es bilingüe;
//  - solo muestra PDF, enlace y video (el tipo "texto" con HTML no se usa).
// El PDF se abre con ?token= porque un enlace <a> no puede mandar cabeceras.

function youtubeEmbed(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (u.hostname.includes("youtube.com") && u.pathname === "/watch") {
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }
    return url;
  } catch {
    return url;
  }
}

function CursoContenido() {
  const router = useRouter();
  const params = useParams<{ module: string }>();
  const numero = Number(params.module);
  const moduloValido = Number.isInteger(numero) && numero >= 1 && numero <= TOTAL_MODULOS;

  const { t, locale, mensajeError } = useUsLocale();
  const { token } = useUsAuth();

  const [progreso, setProgreso] = useState<ProgresoUS | null>(null);
  const [sesion, setSesion] = useState<SesionUS | null>(null);
  const [contenidos, setContenidos] = useState<ContenidoUS[]>([]);
  const [historial, setHistorial] = useState<IntentoHistorial[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [recarga, setRecarga] = useState(0);
  const [marcandoId, setMarcandoId] = useState<string | null>(null);
  const [buscandoExamen, setBuscandoExamen] = useState(false);
  const [disponibleEn, setDisponibleEn] = useState<Date | null>(null);

  useEffect(() => {
    if (!moduloValido) router.replace("/us/dashboard");
  }, [moduloValido, router]);

  // Carga progreso → módulo → materiales → historial de intentos.
  useEffect(() => {
    if (!moduloValido) return;
    let cancelado = false;

    async function traer() {
      try {
        const prog = await usFetch<ProgresoUS>("/progreso/me", { locale, cache: "no-store" });
        if (cancelado) return;
        setProgreso(prog);

        if (numero > prog.sesionActualDesbloqueada) {
          setSesion(null); // módulo bloqueado: no se pide nada más
          return;
        }
        const ses = await usFetch<SesionUS>(`/us/sesiones/${numero}`, { locale, cache: "no-store" });
        const [conts, hist] = await Promise.all([
          usFetch<ContenidoUS[]>(`/us/contenido/sesion/${ses._id}`, { locale, cache: "no-store" }),
          usFetch<IntentoHistorial[]>(`/intentos-examen/historial/${ses._id}`, { locale, cache: "no-store" }),
        ]);
        if (cancelado) return;
        setSesion(ses);
        setContenidos(conts);
        setHistorial(hist);
        setError("");
      } catch (e) {
        if (!cancelado) setError(mensajeError(e));
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    void traer();
    return () => {
      cancelado = true;
    };
  }, [moduloValido, numero, locale, mensajeError, recarga]);

  async function marcarVisto(item: ContenidoUS) {
    setMarcandoId(item._id);
    setError("");
    try {
      const resultado = await usFetch<ResultadoMarcarVisto>(`/us/contenido/${item._id}/marcar-visto`, {
        method: "POST",
        locale,
      });
      if (resultado.esperaActiva && resultado.disponibleEn) {
        setDisponibleEn(new Date(resultado.disponibleEn));
      }
      setRecarga((n) => n + 1); // trae progreso e intento actualizados
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setMarcandoId(null);
    }
  }

  async function irAlExamen() {
    if (!sesion) return;
    setBuscandoExamen(true);
    setError("");
    try {
      const intento = await usFetch<{ _id: string }>(`/intentos-examen/activo/${sesion._id}`, { locale });
      router.push(`/us/exam/${intento._id}`);
    } catch {
      setError(t("course.sinExamen"));
    } finally {
      setBuscandoExamen(false);
    }
  }

  // Sirve para el primer examen tras la espera de 24 h y para reintentar.
  async function reintentar() {
    if (!sesion) return;
    setBuscandoExamen(true);
    setError("");
    try {
      const intento = await usFetch<{ _id: string }>(`/intentos-examen/reintentar/${sesion._id}`, {
        method: "POST",
        locale,
      });
      router.push(`/us/exam/${intento._id}`);
    } catch (e) {
      // Si todavía no pasan las 24 h desde el módulo anterior, el servidor
      // responde esperaActiva + disponibleEn: se muestra la cuenta regresiva.
      const cuerpo = e instanceof ApiErrorUS ? e.cuerpo : null;
      if (cuerpo?.esperaActiva && typeof cuerpo.disponibleEn === "string") {
        setDisponibleEn(new Date(cuerpo.disponibleEn));
      } else {
        setError(mensajeError(e));
      }
    } finally {
      setBuscandoExamen(false);
    }
  }

  const hayEspera = !!disponibleEn;
  const ahora = useAhora(hayEspera);
  const restanteMs = disponibleEn && ahora !== null ? Math.max(0, disponibleEn.getTime() - ahora) : null;
  const esperaActiva = restanteMs !== null && restanteMs > 0;

  if (!moduloValido || cargando) {
    return (
      <p role="status" className="mx-auto max-w-md px-4 py-20 text-center text-neutral-text/70">
        {t("course.cargando")}
      </p>
    );
  }

  const titulo = t(`land.mod.${numero}.t` as DictKey);
  const bloqueado = !!progreso && numero > progreso.sesionActualDesbloqueada;
  const aprobado = !!progreso?.sesionesAprobadas.includes(numero);
  const vistos = new Set((progreso?.contenidosVistos ?? []).map(String));
  const todosVistos = contenidos.length > 0 && contenidos.every((c) => vistos.has(c._id));

  const ultimo = historial[historial.length - 1];
  const intentosUsados = historial.length;
  const puedeReintentar =
    !aprobado && !!ultimo?.fechaFin && ultimo.aprobado === false && intentosUsados < MAX_INTENTOS;
  const sinIntentos =
    !aprobado && !!ultimo?.fechaFin && ultimo.aprobado === false && intentosUsados >= MAX_INTENTOS;
  const primerIntentoTrasEspera = !aprobado && todosVistos && historial.length === 0;
  const hayIntentoActivo = !!ultimo && !ultimo.fechaFin;

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <Link href="/us/dashboard" className="text-sm font-medium text-brand-blue underline">
        {t("course.volver")}
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold text-brand-blue">{titulo}</h1>

      {error && <div className="mt-4"><MensajeError>{error}</MensajeError></div>}

      {bloqueado && (
        <p role="status" className="mt-6 rounded-lg bg-status-warning/15 px-4 py-3 text-neutral-text">
          {t("course.bloqueado")}
        </p>
      )}

      {!bloqueado && sesion && (
        <>
          {aprobado ? (
            <div role="status" className="mt-6 rounded-2xl bg-status-success/10 p-4 ring-1 ring-status-success/30">
              <p className="flex items-center gap-2 font-semibold text-brand-blue">
                <CheckCircle2 aria-hidden className="text-status-success" />
                {t("course.aprobado")}
              </p>
              <p className="mt-1 text-sm text-neutral-text">{t("course.aprobadoTexto")}</p>
              {numero < TOTAL_MODULOS && (
                <Link
                  href={`/us/course/${numero + 1}`}
                  className="mt-3 inline-flex min-h-11 items-center rounded-full bg-brand-pink px-5 text-sm font-semibold text-white hover:bg-brand-pink/90"
                >
                  {t("course.sigModulo", { n: numero + 1 })}
                </Link>
              )}
            </div>
          ) : (
            <p className="mt-3 text-neutral-text/80">{t("course.instruccion")}</p>
          )}

          <h2 className="mt-8 font-semibold text-brand-blue">{t("course.materiales")}</h2>
          {contenidos.length === 0 ? (
            <p className="mt-2 text-neutral-text/80">{t("course.sinMateriales")}</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {contenidos.map((item) => {
                const visto = vistos.has(item._id);
                const enlacePdf = item.publicIdCloudinary
                  ? `${API_URL}/contenido-sesion/${item._id}/archivo?token=${token ?? ""}`
                  : item.url;
                return (
                  <li
                    key={item._id}
                    className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ${visto ? "ring-status-success/40" : "ring-neutral-bg"}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="min-w-0 break-words font-semibold text-brand-blue">{item.titulo}</p>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <span className="rounded-full bg-neutral-bg px-2 py-0.5 text-xs text-neutral-text">
                          {item.estado
                            ? t("course.badgeEstado", { estado: nombreEstado(item.estado, locale) })
                            : t("course.badgeGeneral")}
                        </span>
                        {visto && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-status-success px-2 py-0.5 text-xs font-medium text-white">
                            <CheckCircle2 aria-hidden size={12} />
                            {t("course.visto")}
                          </span>
                        )}
                      </div>
                    </div>

                    {item.tipo === "video" && item.url && (
                      <div className="mt-3 aspect-video">
                        <iframe
                          className="size-full rounded-lg"
                          src={youtubeEmbed(item.url)}
                          title={item.titulo}
                          allowFullScreen
                        />
                      </div>
                    )}

                    {item.tipo === "pdf" && enlacePdf && (
                      <a
                        href={enlacePdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-lg border border-brand-blue/20 bg-neutral-bg px-4 py-3 font-medium text-brand-blue hover:bg-brand-blue/5 focus-visible:outline-2 focus-visible:outline-brand-blue"
                      >
                        <FileText aria-hidden size={18} />
                        {t("course.abrirPdf")}
                        <ExternalLink aria-hidden size={14} />
                      </a>
                    )}

                    {item.tipo === "enlace" && item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-lg border border-brand-blue/20 bg-neutral-bg px-4 py-3 font-medium text-brand-blue hover:bg-brand-blue/5"
                      >
                        {t("course.abrirEnlace")}
                        <ExternalLink aria-hidden size={14} />
                      </a>
                    )}

                    {!visto && !aprobado && (
                      <div className="mt-3 flex justify-center">
                        <BotonPrimario
                          type="button"
                          onClick={() => marcarVisto(item)}
                          cargando={marcandoId === item._id}
                          textoCargando={t("course.marcando")}
                          className="bg-brand-blue hover:bg-brand-blue/90"
                        >
                          {t("course.marcar")}
                        </BotonPrimario>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {/* Examen */}
          {!aprobado && todosVistos && (
            <div className="mt-8 space-y-3">
              {intentosUsados > 0 && (
                <p className="text-sm text-neutral-text/80">
                  {t("course.intentos", { usados: intentosUsados, max: MAX_INTENTOS })}
                  {ultimo?.fechaFin && ultimo.calificacion !== null
                    ? ` · ${t("course.ultimaNota", { nota: ultimo.calificacion })}`
                    : ""}
                </p>
              )}

              {esperaActiva && restanteMs !== null && (
                <div role="status" className="rounded-2xl bg-white p-5 text-center ring-1 ring-brand-blue/20">
                  <p className="text-sm text-neutral-text">{t("course.espera")}</p>
                  <p className="mt-1 font-display text-2xl font-bold text-brand-blue">
                    {formatearRestante(restanteMs)}
                  </p>
                </div>
              )}

              {sinIntentos && (
                <p role="alert" className="rounded-lg bg-brand-pink/5 px-4 py-3 text-neutral-text ring-1 ring-brand-pink/40">
                  {t("course.sinIntentos", { max: MAX_INTENTOS })}
                </p>
              )}

              {!esperaActiva && !sinIntentos && !puedeReintentar && (
                <BotonPrimario
                  type="button"
                  onClick={primerIntentoTrasEspera ? reintentar : irAlExamen}
                  cargando={buscandoExamen}
                  textoCargando={t("course.buscando")}
                  className="w-full"
                >
                  {t("course.irExamen")}
                </BotonPrimario>
              )}

              {puedeReintentar && !esperaActiva && !hayIntentoActivo && (
                <BotonPrimario
                  type="button"
                  onClick={reintentar}
                  cargando={buscandoExamen}
                  textoCargando={t("course.preparando")}
                  className="w-full bg-brand-blue hover:bg-brand-blue/90"
                >
                  {t("course.reintentar")}
                </BotonPrimario>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default function CoursePage() {
  return (
    <RutaProtegidaUS requiereCorreo>
      <CursoContenido />
    </RutaProtegidaUS>
  );
}