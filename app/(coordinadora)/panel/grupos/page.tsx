"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  School,
  Building2,
  Clock,
  CheckCircle2,
  Search,
  AlertTriangle,
  Users,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { BarraProgreso, Indicador, haceCuanto } from "@/components/ui/grupos";

// CAMBIO (18/09/2026): la lista dejó de ser solo "crear grupo + nombres".
// Cada grupo ahora es una tarjeta con su resumen de avance (viene ya
// calculado en `resumen` desde GET /api/grupos), y se puede filtrar por
// tipo/estado y buscar por nombre. El detalle y la ficha de cada
// estudiante viven en /panel/grupos/[id] y
// /panel/grupos/[id]/estudiantes/[userId].

type Resumen = {
  total: number;
  activas: number;
  inactivas: number;
  completados: number;
  enCurso: number;
  sinIniciar: number;
  rezagadas: number;
  diplomas: number;
  cuestionariosCompletados: number;
  porcentajeAvance: number;
  promedioExamenes: number | null;
  ultimaActividad: string | null;
};

type Grupo = {
  _id: string;
  tipo: "colegio" | "empresa";
  nombreInstitucion: string;
  contactoNombre: string;
  contactoEmail: string;
  contactoTelefono: string;
  precioAcordado: number;
  cantidadEstudiantesEstimada: number;
  cantidadEstudiantesReal: number;
  pendienteRoster: boolean;
  activo: boolean;
  fechaInicio: string | null;
  resumen: Resumen;
};

type FormularioGrupo = {
  tipo: "colegio" | "empresa";
  nombreInstitucion: string;
  contactoNombre: string;
  contactoEmail: string;
  contactoTelefono: string;
  precioAcordado: string;
  cantidadEstudiantesEstimada: string;
  notas: string;
};

const FORM_VACIO: FormularioGrupo = {
  tipo: "colegio",
  nombreInstitucion: "",
  contactoNombre: "",
  contactoEmail: "",
  contactoTelefono: "",
  precioAcordado: "",
  cantidadEstudiantesEstimada: "",
  notas: "",
};

const RESUMEN_VACIO: Resumen = {
  total: 0,
  activas: 0,
  inactivas: 0,
  completados: 0,
  enCurso: 0,
  sinIniciar: 0,
  rezagadas: 0,
  diplomas: 0,
  cuestionariosCompletados: 0,
  porcentajeAvance: 0,
  promedioExamenes: null,
  ultimaActividad: null,
};

type EstadoGrupo = "pendiente" | "en_curso" | "finalizado";

function estadoDeGrupo(g: Grupo): EstadoGrupo {
  if (g.pendienteRoster) return "pendiente";
  if (!g.activo) return "finalizado";
  return "en_curso";
}

function EtiquetaEstado({ grupo }: { grupo: Grupo }) {
  const estado = estadoDeGrupo(grupo);
  if (estado === "pendiente") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 whitespace-nowrap">
        <Clock size={12} /> Falta cargar roster
      </span>
    );
  }
  if (estado === "finalizado") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-neutral-bg text-neutral-text whitespace-nowrap">
        <CheckCircle2 size={12} /> Finalizado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-status-success/15 text-status-success whitespace-nowrap">
      En curso
    </span>
  );
}

function FormularioNuevoGrupo({
  onCreado,
  onCancelar,
}: {
  onCreado: (grupo: Grupo) => void;
  onCancelar: () => void;
}) {
  const { token } = useAuth();
  const [form, setForm] = useState<FormularioGrupo>(FORM_VACIO);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function actualizar<K extends keyof FormularioGrupo>(campo: K, valor: FormularioGrupo[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/grupos`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          precioAcordado: Number(form.precioAcordado),
          cantidadEstudiantesEstimada: Number(form.cantidadEstudiantesEstimada),
        }),
      });
      const json = await res.json();
      if (json.success) {
        onCreado({ ...json.data, cantidadEstudiantesReal: 0, resumen: RESUMEN_VACIO });
      } else {
        setError(json.error || "No se pudo crear el grupo.");
      }
    } catch {
      setError("No pudimos conectar con el servidor. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={enviar}
      className="rounded-xl bg-white border border-neutral-bg p-6 mb-6 grid gap-4"
    >
      <p className="font-display font-semibold text-brand-blue">Nuevo grupo</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-sm text-neutral-text">
          Tipo
          <select
            value={form.tipo}
            onChange={(e) => actualizar("tipo", e.target.value as "colegio" | "empresa")}
            className="w-full mt-1 rounded-lg border border-neutral-bg px-3 py-2"
          >
            <option value="colegio">Colegio (Escolar)</option>
            <option value="empresa">Empresa (Empresarial)</option>
          </select>
        </label>
        <label className="text-sm text-neutral-text">
          Nombre de la institución
          <input
            required
            value={form.nombreInstitucion}
            onChange={(e) => actualizar("nombreInstitucion", e.target.value)}
            className="w-full mt-1 rounded-lg border border-neutral-bg px-3 py-2"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="text-sm text-neutral-text">
          Contacto (nombre)
          <input
            required
            value={form.contactoNombre}
            onChange={(e) => actualizar("contactoNombre", e.target.value)}
            className="w-full mt-1 rounded-lg border border-neutral-bg px-3 py-2"
          />
        </label>
        <label className="text-sm text-neutral-text">
          Contacto (correo)
          <input
            required
            type="email"
            value={form.contactoEmail}
            onChange={(e) => actualizar("contactoEmail", e.target.value)}
            className="w-full mt-1 rounded-lg border border-neutral-bg px-3 py-2"
          />
        </label>
        <label className="text-sm text-neutral-text">
          Contacto (teléfono)
          <input
            required
            value={form.contactoTelefono}
            onChange={(e) => actualizar("contactoTelefono", e.target.value)}
            className="w-full mt-1 rounded-lg border border-neutral-bg px-3 py-2"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-sm text-neutral-text">
          Precio total acordado (RD$)
          <input
            required
            type="number"
            min={1}
            value={form.precioAcordado}
            onChange={(e) => actualizar("precioAcordado", e.target.value)}
            className="w-full mt-1 rounded-lg border border-neutral-bg px-3 py-2"
          />
        </label>
        <label className="text-sm text-neutral-text">
          Cantidad estimada de estudiantes
          <input
            required
            type="number"
            min={1}
            value={form.cantidadEstudiantesEstimada}
            onChange={(e) => actualizar("cantidadEstudiantesEstimada", e.target.value)}
            className="w-full mt-1 rounded-lg border border-neutral-bg px-3 py-2"
          />
        </label>
      </div>

      <label className="text-sm text-neutral-text">
        Notas (opcional)
        <textarea
          rows={2}
          value={form.notas}
          onChange={(e) => actualizar("notas", e.target.value)}
          className="w-full mt-1 rounded-lg border border-neutral-bg px-3 py-2"
        />
      </label>

      {error && (
        <div className="rounded-lg bg-brand-pink-light border border-brand-pink p-3 text-sm text-brand-blue">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={enviando}
          className="rounded-full bg-brand-pink text-white px-6 py-2.5 font-medium hover:opacity-90 disabled:opacity-60"
        >
          {enviando ? "Creando..." : "Crear grupo"}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="rounded-full border border-neutral-bg px-6 py-2.5 font-medium text-neutral-text hover:bg-neutral-bg"
        >
          Cancelar
        </button>
      </div>
      <p className="text-xs text-neutral-text">
        Esto solo crea el grupo — el roster de estudiantes se carga aparte, en el
        siguiente paso.
      </p>
    </form>
  );
}

function TarjetaGrupo({ g }: { g: Grupo }) {
  const r = g.resumen;
  const estado = estadoDeGrupo(g);

  return (
    <Link
      href={`/panel/grupos/${g._id}`}
      className="rounded-xl bg-white border border-neutral-bg p-5 flex flex-col gap-4 hover:shadow-md hover:border-brand-blue-light transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {g.tipo === "colegio" ? (
            <School className="text-brand-blue shrink-0 mt-0.5" size={22} />
          ) : (
            <Building2 className="text-brand-blue shrink-0 mt-0.5" size={22} />
          )}
          <div className="min-w-0">
            <p className="font-display font-semibold text-brand-blue leading-tight">
              {g.nombreInstitucion}
            </p>
            <p className="text-xs text-neutral-text mt-0.5">
              {g.tipo === "colegio" ? "Escolar" : "Empresarial"} · {g.contactoNombre}
            </p>
          </div>
        </div>
        <EtiquetaEstado grupo={g} />
      </div>

      {estado === "pendiente" ? (
        <p className="text-sm text-neutral-text">
          ~{g.cantidadEstudiantesEstimada} estudiantes estimados. Entra para
          cargar el roster y crear sus cuentas.
        </p>
      ) : (
        <>
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <p className="text-sm text-neutral-text">
                <span className="font-display text-xl font-bold text-brand-blue">
                  {r.activas}
                </span>{" "}
                estudiante{r.activas === 1 ? "" : "s"}
                {r.inactivas > 0 && (
                  <span className="text-xs text-neutral-text/60">
                    {" "}
                    (+{r.inactivas} inactiva{r.inactivas === 1 ? "" : "s"})
                  </span>
                )}
              </p>
              <p className="text-sm font-medium text-brand-blue">
                {r.porcentajeAvance}%
              </p>
            </div>
            <BarraProgreso porcentaje={r.porcentajeAvance} />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-neutral-bg py-2">
              <p className="font-display font-semibold text-status-success">
                {r.completados}
              </p>
              <p className="text-[11px] text-neutral-text">Completaron</p>
            </div>
            <div className="rounded-lg bg-neutral-bg py-2">
              <p className="font-display font-semibold text-brand-blue">
                {r.enCurso}
              </p>
              <p className="text-[11px] text-neutral-text">En curso</p>
            </div>
            <div className="rounded-lg bg-neutral-bg py-2">
              <p className="font-display font-semibold text-neutral-text">
                {r.sinIniciar}
              </p>
              <p className="text-[11px] text-neutral-text">Sin iniciar</p>
            </div>
          </div>

          {r.rezagadas > 0 && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
              <AlertTriangle size={14} className="shrink-0" />
              {r.rezagadas} sin actividad en más de 7 días
            </p>
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-text border-t border-neutral-bg pt-3">
            <span>
              Cuestionarios {r.cuestionariosCompletados}/{r.activas}
            </span>
            <span>Diplomas {r.diplomas}</span>
            {r.promedioExamenes !== null && (
              <span>Promedio {r.promedioExamenes}%</span>
            )}
            <span className="ml-auto">
              Últ. actividad: {haceCuanto(r.ultimaActividad)}
            </span>
          </div>
        </>
      )}
    </Link>
  );
}

const FILTROS_TIPO: { id: "todos" | "colegio" | "empresa"; etiqueta: string }[] = [
  { id: "todos", etiqueta: "Todos" },
  { id: "colegio", etiqueta: "Colegios" },
  { id: "empresa", etiqueta: "Empresas" },
];

const FILTROS_ESTADO: { id: "todos" | EstadoGrupo; etiqueta: string }[] = [
  { id: "todos", etiqueta: "Cualquier estado" },
  { id: "en_curso", etiqueta: "En curso" },
  { id: "pendiente", etiqueta: "Falta roster" },
  { id: "finalizado", etiqueta: "Finalizados" },
];

export default function PanelGruposPage() {
  const { token } = useAuth();
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [filtroTipo, setFiltroTipo] = useState<"todos" | "colegio" | "empresa">("todos");
  const [filtroEstado, setFiltroEstado] = useState<"todos" | EstadoGrupo>("todos");
  const [busqueda, setBusqueda] = useState("");

  const cargar = useCallback(async () => {
    if (!token) return;
    setCargando(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/grupos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setGrupos(json.data);
    } catch {
      // silencioso — la lista se queda vacía, no es crítico bloquear la pantalla
    } finally {
      setCargando(false);
    }
  }, [token]);

  useEffect(() => {
    // Mismo fix ya usado en panel/estudiantes/page.tsx para el warning
    // react-hooks/set-state-in-effect.
    queueMicrotask(() => cargar());
  }, [cargar]);

  const visibles = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return grupos.filter((g) => {
      if (filtroTipo !== "todos" && g.tipo !== filtroTipo) return false;
      if (filtroEstado !== "todos" && estadoDeGrupo(g) !== filtroEstado) return false;
      if (termino) {
        const texto = `${g.nombreInstitucion} ${g.contactoNombre}`.toLowerCase();
        if (!texto.includes(termino)) return false;
      }
      return true;
    });
  }, [grupos, filtroTipo, filtroEstado, busqueda]);

  // Indicadores globales — solo sobre grupos que ya tienen roster.
  const totales = useMemo(() => {
    const conRoster = grupos.filter((g) => !g.pendienteRoster);
    return {
      gruposEnCurso: grupos.filter((g) => estadoDeGrupo(g) === "en_curso").length,
      estudiantes: conRoster.reduce((a, g) => a + g.resumen.activas, 0),
      completaron: conRoster.reduce((a, g) => a + g.resumen.completados, 0),
      rezagadas: conRoster.reduce((a, g) => a + g.resumen.rezagadas, 0),
    };
  }, [grupos]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-xl font-bold text-brand-blue">Grupos</h1>
          <p className="text-sm text-neutral-text mt-1">
            Colegios y empresas inscritos en bloque (Escolar/Empresarial)
          </p>
        </div>
        {!mostrarFormulario && (
          <button
            onClick={() => setMostrarFormulario(true)}
            className="inline-flex items-center gap-2 rounded-full bg-brand-pink text-white px-5 py-2.5 font-medium hover:opacity-90 shrink-0"
          >
            <Plus size={18} /> Nuevo grupo
          </button>
        )}
      </div>

      {mostrarFormulario && (
        <FormularioNuevoGrupo
          onCreado={(nuevo) => {
            setGrupos((prev) => [nuevo, ...prev]);
            setMostrarFormulario(false);
          }}
          onCancelar={() => setMostrarFormulario(false)}
        />
      )}

      {!cargando && grupos.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Indicador Icono={Building2} valor={totales.gruposEnCurso} etiqueta="Grupos en curso" />
          <Indicador Icono={Users} valor={totales.estudiantes} etiqueta="Estudiantes activas" />
          <Indicador
            Icono={GraduationCap}
            valor={totales.completaron}
            etiqueta="Completaron la teoría"
          />
          <Indicador
            Icono={AlertTriangle}
            valor={totales.rezagadas}
            etiqueta="Sin actividad en 7+ días"
            alerta={totales.rezagadas > 0}
          />
        </div>
      )}

      {!cargando && grupos.length > 0 && (
        <div className="flex flex-col lg:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-text/50"
            />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por institución o contacto..."
              className="w-full rounded-lg border border-neutral-bg bg-white pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-brand-blue-light"
            />
          </div>
          <div className="flex gap-1 bg-white rounded-lg border border-neutral-bg p-1">
            {FILTROS_TIPO.map((f) => (
              <button
                key={f.id}
                onClick={() => setFiltroTipo(f.id)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${filtroTipo === f.id
                  ? "bg-brand-blue text-white"
                  : "text-neutral-text hover:bg-neutral-bg"
                  }`}
              >
                {f.etiqueta}
              </button>
            ))}
          </div>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as "todos" | EstadoGrupo)}
            className="rounded-lg border border-neutral-bg bg-white px-3 py-2 text-sm"
          >
            {FILTROS_ESTADO.map((f) => (
              <option key={f.id} value={f.id}>
                {f.etiqueta}
              </option>
            ))}
          </select>
        </div>
      )}

      {cargando ? (
        <p className="text-sm text-neutral-text">Cargando...</p>
      ) : grupos.length === 0 ? (
        <p className="text-sm text-neutral-text">Todavía no hay grupos creados.</p>
      ) : visibles.length === 0 ? (
        <p className="text-sm text-neutral-text">
          Ningún grupo coincide con esos filtros.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibles.map((g) => (
            <TarjetaGrupo key={g._id} g={g} />
          ))}
        </div>
      )}
    </div>
  );
}