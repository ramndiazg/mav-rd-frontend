"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Upload,
  AlertTriangle,
  UserX,
  School,
  Building2,
  Mail,
  Phone,
  Search,
  Download,
  Users,
  GraduationCap,
  Award,
  ClipboardList,
  BarChart3,
  ChevronRight,
  CheckCircle2,
  Clock,
  Send,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  BarraProgreso,
  EtiquetaEstadoEstudiante,
  Indicador,
  formatearFecha,
  haceCuanto,
  type EstadoEstudiante,
} from "@/components/ui/grupos";

// CAMBIO (18/09/2026): esta pantalla pasó de ser "solo cargar roster" a ser
// el centro de gestión de UN grupo, con 3 pestañas:
//   - Estudiantes: resumen de avance + lista con búsqueda/filtros/orden,
//     exportar a CSV, y desactivación en lote (solo admin). Cada fila lleva
//     a la ficha completa de la estudiante.
//   - Cargar roster / Agregar estudiantes: el mismo formulario fila por
//     fila de antes (sin cambios de comportamiento).
//   - Datos del grupo: editar contacto/notas y finalizar o reactivar el
//     grupo.
//
// El modo "CSV / pegado" del roster se eliminó el 10/09/2026 a pedido del
// usuario — ver el comentario original: si se reintroduce una carga
// masiva, mejor como CSV con encabezados reales validados campo por campo.

type Grupo = {
  _id: string;
  tipo: "colegio" | "empresa";
  nombreInstitucion: string;
  contactoNombre: string;
  contactoEmail: string;
  contactoTelefono: string;
  precioAcordado: number;
  cantidadEstudiantesEstimada: number;
  pendienteRoster: boolean;
  activo: boolean;
  fechaInicio: string | null;
  notas: string | null;
};

type FilaEstudiante = {
  _id: string;
  nombre: string;
  apellido: string;
  cedula: string | null;
  email: string;
  telefono: string;
  activo: boolean;
  sesionesAprobadas: number;
  totalSesiones: number;
  materialesVistos: number;
  cursoCompletado: boolean;
  porcentajeAvance: number;
  promedioExamenes: number | null;
  tieneDiploma: boolean;
  cuestionarioCompletado: boolean;
  ultimaActividad: string | null;
  estado: EstadoEstudiante;
  rezagada: boolean;
};

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

type FilaRoster = {
  nombre: string;
  apellido: string;
  cedula: string;
  telefono: string;
  email: string;
  provincia: string;
  fechaNacimiento: string;
};

type ResultadoRoster = {
  creados: number;
  errores: { fila: number; email: string | null; motivo: string }[];
  esPrimeraConfirmacion: boolean;
  discrepancia: boolean;
  cantidadEstimada: number;
  cantidadCreadaEnEsteLote: number;
  cantidadTotalGrupo: number;
};

const FILA_VACIA: FilaRoster = {
  nombre: "",
  apellido: "",
  cedula: "",
  telefono: "",
  email: "",
  provincia: "",
  fechaNacimiento: "",
};

const COLUMNAS: (keyof FilaRoster)[] = [
  "nombre",
  "apellido",
  "cedula",
  "telefono",
  "email",
  "provincia",
  "fechaNacimiento",
];

const ETIQUETAS_COLUMNA: Record<keyof FilaRoster, string> = {
  nombre: "Nombre",
  apellido: "Apellido",
  cedula: "Cédula (opcional para menores)",
  telefono: "Teléfono",
  email: "Correo",
  provincia: "Provincia",
  fechaNacimiento: "Fecha nac. (AAAA-MM-DD)",
};

// Si un estudiante no tiene cédula (menor de un colegio), se deja el campo
// vacío — ya no hace falta escribir "N/A" a mano (chocaba entre sí como
// cédula duplicada). El backend lo trata igual si de todas formas alguien
// escribe "N/A".
const PLACEHOLDER_CEDULA = "Dejar vacío si no tiene";

// ---------------------------------------------------------------------
// Exportar a CSV (solo avance — NUNCA incluye las respuestas de los
// cuestionarios: son información sensible que solo ven coordinadora/admin,
// y este archivo puede terminar en manos de la institución).
// ---------------------------------------------------------------------

function celdaCsv(valor: string | number | null | undefined): string {
  let texto = valor === null || valor === undefined ? "" : String(valor);
  // Evita que Excel interprete texto que empieza con = + - @ como fórmula.
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`;
  return `"${texto.replace(/"/g, '""')}"`;
}

function nombreArchivoSeguro(texto: string): string {
  return (
    texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "grupo"
  );
}

const TEXTO_ESTADO: Record<EstadoEstudiante, string> = {
  completado: "Completó la teoría",
  en_curso: "En curso",
  sin_iniciar: "Sin iniciar",
  inactiva: "Cuenta inactiva",
};

function exportarCsv(grupo: Grupo, filas: FilaEstudiante[]) {
  const encabezado = [
    "Apellido",
    "Nombre",
    "Cédula",
    "Correo",
    "Teléfono",
    "Sesiones aprobadas",
    "Total de sesiones",
    "% de avance",
    "Promedio de exámenes",
    "Estado",
    "Diploma",
    "Última actividad",
  ];
  const lineas = filas.map((f) =>
    [
      celdaCsv(f.apellido),
      celdaCsv(f.nombre),
      celdaCsv(f.cedula),
      celdaCsv(f.email),
      celdaCsv(f.telefono),
      f.sesionesAprobadas,
      f.totalSesiones,
      f.porcentajeAvance,
      f.promedioExamenes ?? "",
      celdaCsv(TEXTO_ESTADO[f.estado]),
      celdaCsv(f.tieneDiploma ? "Sí" : "No"),
      celdaCsv(f.ultimaActividad ? formatearFecha(f.ultimaActividad) : "Sin actividad"),
    ].join(","),
  );
  const contenido = [encabezado.map(celdaCsv).join(","), ...lineas].join("\r\n");

  // \uFEFF (BOM) para que Excel lea bien las tildes y la ñ.
  const blob = new Blob(["\uFEFF" + contenido], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `avance-${nombreArchivoSeguro(grupo.nombreInstitucion)}-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------
// Pestaña: Estudiantes
// ---------------------------------------------------------------------

type FiltroEstudiantes =
  | "activas"
  | "en_curso"
  | "sin_iniciar"
  | "completado"
  | "rezagadas"
  | "inactivas";

type Orden = "apellido" | "avance" | "actividad";

function PestanaEstudiantes({
  grupo,
  estudiantes,
  resumen,
  esAdmin,
  token,
  onCambio,
  onIrARoster,
}: {
  grupo: Grupo;
  estudiantes: FilaEstudiante[];
  resumen: Resumen;
  esAdmin: boolean;
  token: string | null;
  onCambio: () => void;
  onIrARoster: () => void;
}) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<FiltroEstudiantes>("activas");
  const [orden, setOrden] = useState<Orden>("apellido");

  // Soft delete en lote — cuando el roster de la institución cambia
  // (estudiantes que ya no pertenecen al grupo). El endpoint es solo admin
  // (ver "Pendiente real" en ARQUITECTURA_BACKEND.md), por eso solo se
  // muestra al admin.
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [desactivando, setDesactivando] = useState(false);
  const [errorDesactivar, setErrorDesactivar] = useState<string | null>(null);

  const conteos: Record<FiltroEstudiantes, number> = {
    activas: resumen.activas,
    en_curso: resumen.enCurso,
    sin_iniciar: resumen.sinIniciar,
    completado: resumen.completados,
    rezagadas: resumen.rezagadas,
    inactivas: resumen.inactivas,
  };

  const visibles = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    const filtradas = estudiantes.filter((e) => {
      if (filtro === "activas" && !e.activo) return false;
      if (filtro === "inactivas" && e.activo) return false;
      if (filtro === "en_curso" && e.estado !== "en_curso") return false;
      if (filtro === "sin_iniciar" && e.estado !== "sin_iniciar") return false;
      if (filtro === "completado" && e.estado !== "completado") return false;
      if (filtro === "rezagadas" && !e.rezagada) return false;
      if (termino) {
        const texto = `${e.nombre} ${e.apellido} ${e.email} ${e.cedula || ""}`.toLowerCase();
        if (!texto.includes(termino)) return false;
      }
      return true;
    });

    const copia = [...filtradas];
    if (orden === "avance") {
      copia.sort((a, b) => a.porcentajeAvance - b.porcentajeAvance);
    } else if (orden === "actividad") {
      // Sin actividad primero, luego de la más antigua a la más reciente.
      copia.sort((a, b) => {
        const fa = a.ultimaActividad ? new Date(a.ultimaActividad).getTime() : 0;
        const fb = b.ultimaActividad ? new Date(b.ultimaActividad).getTime() : 0;
        return fa - fb;
      });
    }
    return copia;
  }, [estudiantes, filtro, busqueda, orden]);

  const seleccionables = visibles.filter((e) => e.activo);

  function alternarSeleccion(id: string) {
    setSeleccionados((prev) => {
      const copia = new Set(prev);
      if (copia.has(id)) copia.delete(id);
      else copia.add(id);
      return copia;
    });
  }

  function alternarSeleccionTodos() {
    setSeleccionados((prev) =>
      prev.size === seleccionables.length && seleccionables.length > 0
        ? new Set()
        : new Set(seleccionables.map((e) => e._id)),
    );
  }

  async function desactivarSeleccionados() {
    if (seleccionados.size === 0) return;
    if (
      !window.confirm(
        `¿Desactivar ${seleccionados.size} estudiante(s) de este grupo? Sus cuentas quedan inactivas (soft delete), no se borran.`,
      )
    ) {
      return;
    }

    setDesactivando(true);
    setErrorDesactivar(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/usuarios/desactivar-lote`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ids: Array.from(seleccionados) }),
        },
      );
      const json = await res.json();
      if (json.success) {
        setSeleccionados(new Set());
        onCambio();
      } else {
        setErrorDesactivar(json.error || "No se pudo desactivar a las estudiantes.");
      }
    } catch {
      setErrorDesactivar("No pudimos conectar con el servidor. Intenta de nuevo.");
    } finally {
      setDesactivando(false);
    }
  }

  if (grupo.pendienteRoster) {
    return (
      <div className="rounded-xl bg-white border border-neutral-bg p-6 text-sm text-neutral-text">
        Este grupo todavía no tiene estudiantes.{" "}
        <button onClick={onIrARoster} className="text-brand-blue font-medium underline">
          Cargar el roster
        </button>{" "}
        para crear sus cuentas.
      </div>
    );
  }

  const FILTROS: { id: FiltroEstudiantes; etiqueta: string }[] = [
    { id: "activas", etiqueta: "Activas" },
    { id: "en_curso", etiqueta: "En curso" },
    { id: "sin_iniciar", etiqueta: "Sin iniciar" },
    { id: "completado", etiqueta: "Completaron" },
    { id: "rezagadas", etiqueta: "Sin actividad 7+ días" },
    { id: "inactivas", etiqueta: "Inactivas" },
  ];

  return (
    <div>
      <div className="flex flex-col lg:flex-row gap-3 mb-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-text/50"
          />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Nombre, correo o cédula..."
            className="w-full rounded-lg border border-neutral-bg bg-white pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-brand-blue-light"
          />
        </div>
        <select
          value={orden}
          onChange={(e) => setOrden(e.target.value as Orden)}
          className="rounded-lg border border-neutral-bg bg-white px-3 py-2 text-sm"
        >
          <option value="apellido">Orden: apellido (A-Z)</option>
          <option value="avance">Orden: menor avance primero</option>
          <option value="actividad">Orden: sin actividad primero</option>
        </select>
        <button
          onClick={() => exportarCsv(grupo, visibles)}
          disabled={visibles.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-brand-blue text-brand-blue px-4 py-2 text-sm font-medium hover:bg-brand-blue hover:text-white transition-colors disabled:opacity-50"
          title="Descarga lo que se ve en la lista (avance, sin respuestas de cuestionarios)"
        >
          <Download size={16} /> Exportar CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            onClick={() => {
              setFiltro(f.id);
              setSeleccionados(new Set());
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${filtro === f.id
              ? f.id === "rezagadas"
                ? "bg-amber-600 text-white border-amber-600"
                : "bg-brand-blue text-white border-brand-blue"
              : "bg-white text-neutral-text border-neutral-bg hover:border-brand-blue-light"
              }`}
          >
            {f.etiqueta} ({conteos[f.id]})
          </button>
        ))}
      </div>

      {visibles.length === 0 ? (
        <p className="text-sm text-neutral-text">
          Ninguna estudiante coincide con ese filtro.
        </p>
      ) : (
        <div className="rounded-xl bg-white border border-neutral-bg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-text border-b border-neutral-bg">
                {esAdmin && (
                  <th className="pl-4 py-3 w-8">
                    <input
                      type="checkbox"
                      aria-label="Seleccionar todas las visibles"
                      disabled={seleccionables.length === 0}
                      checked={
                        seleccionables.length > 0 &&
                        seleccionados.size === seleccionables.length
                      }
                      onChange={alternarSeleccionTodos}
                    />
                  </th>
                )}
                <th className="px-4 py-3 font-medium">Estudiante</th>
                <th className="px-4 py-3 font-medium min-w-[140px]">Avance</th>
                <th className="px-4 py-3 font-medium">Promedio</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">
                  Última actividad
                </th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((e) => (
                <tr
                  key={e._id}
                  onClick={() =>
                    router.push(`/panel/grupos/${grupo._id}/estudiantes/${e._id}`)
                  }
                  className={`border-b border-neutral-bg last:border-0 hover:bg-neutral-bg/50 cursor-pointer ${e.activo ? "" : "opacity-60"
                    }`}
                >
                  {esAdmin && (
                    <td className="pl-4 py-3" onClick={(ev) => ev.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label={`Seleccionar a ${e.nombre} ${e.apellido}`}
                        disabled={!e.activo}
                        checked={seleccionados.has(e._id)}
                        onChange={() => alternarSeleccion(e._id)}
                      />
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <Link
                      href={`/panel/grupos/${grupo._id}/estudiantes/${e._id}`}
                      onClick={(ev) => ev.stopPropagation()}
                      className="font-medium text-brand-blue hover:underline"
                    >
                      {e.nombre} {e.apellido}
                    </Link>
                    {e.rezagada && (
                      <AlertTriangle
                        size={13}
                        className="inline ml-1.5 text-amber-600"
                        aria-label="Sin actividad en más de 7 días"
                      />
                    )}
                    <p className="text-xs text-neutral-text">{e.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <BarraProgreso porcentaje={e.porcentajeAvance} />
                      <span className="text-xs text-neutral-text whitespace-nowrap">
                        {e.sesionesAprobadas}/{e.totalSesiones}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-text">
                    {e.promedioExamenes !== null ? `${e.promedioExamenes}%` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <EtiquetaEstadoEstudiante estado={e.estado} />
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-text whitespace-nowrap">
                    {haceCuanto(e.ultimaActividad)}
                  </td>
                  <td className="pr-3">
                    <ChevronRight size={16} className="text-neutral-text/40" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {errorDesactivar && (
        <div className="rounded-lg bg-brand-pink-light border border-brand-pink p-3 text-sm text-brand-blue mt-3">
          {errorDesactivar}
        </div>
      )}

      {esAdmin && seleccionados.size > 0 && (
        <button
          type="button"
          onClick={desactivarSeleccionados}
          disabled={desactivando}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-blue text-white px-5 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-60"
        >
          <UserX size={14} />
          {desactivando
            ? "Desactivando..."
            : `Desactivar ${seleccionados.size} seleccionada(s)`}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Pestaña: Cargar roster / Agregar estudiantes (lógica sin cambios)
// ---------------------------------------------------------------------

function PestanaRoster({
  grupo,
  token,
  onCargado,
}: {
  grupo: Grupo;
  token: string | null;
  onCargado: () => void;
}) {
  const [filas, setFilas] = useState<FilaRoster[]>([{ ...FILA_VACIA }]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoRoster | null>(null);

  function actualizarFila(indice: number, campo: keyof FilaRoster, valor: string) {
    setFilas((prev) => {
      const copia = [...prev];
      copia[indice] = { ...copia[indice], [campo]: valor };
      return copia;
    });
  }

  function agregarFila() {
    setFilas((prev) => [...prev, { ...FILA_VACIA }]);
  }

  function quitarFila(indice: number) {
    setFilas((prev) => prev.filter((_, i) => i !== indice));
  }

  async function enviarRoster() {
    const filtrados = filas.filter((f) => f.nombre.trim() || f.email.trim());

    if (filtrados.length === 0) {
      setError("Agrega al menos un estudiante antes de enviar.");
      return;
    }

    setEnviando(true);
    setError(null);
    setResultado(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/grupos/${grupo._id}/roster`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ estudiantes: filtrados }),
        },
      );
      const json = await res.json();
      if (json.success) {
        setResultado(json.data);
        setFilas([{ ...FILA_VACIA }]);
        onCargado();
      } else {
        setError(json.error || "No se pudo cargar el roster.");
      }
    } catch {
      setError("No pudimos conectar con el servidor. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <div className="rounded-xl bg-white border border-neutral-bg p-6">
        <p className="font-display font-semibold text-brand-blue mb-1">
          {grupo.pendienteRoster ? "Cargar roster" : "Agregar más estudiantes"}
        </p>
        <p className="text-xs text-neutral-text mb-4">
          {grupo.pendienteRoster
            ? "Carga el roster real — esto crea las cuentas y registra el pago total en contabilidad."
            : "Este grupo ya inició. Los estudiantes que agregues aquí no generan un cobro nuevo — el pago total ya quedó registrado con el primer roster."}
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs mb-3">
            <thead>
              <tr>
                {COLUMNAS.map((col) => (
                  <th key={col} className="text-left font-medium text-neutral-text pb-2 pr-2">
                    {ETIQUETAS_COLUMNA[col]}
                  </th>
                ))}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filas.map((fila, indice) => (
                <tr key={indice}>
                  {COLUMNAS.map((col) => (
                    <td key={col} className="pr-2 pb-2">
                      <input
                        type={col === "fechaNacimiento" ? "date" : "text"}
                        value={fila[col]}
                        onChange={(e) => actualizarFila(indice, col, e.target.value)}
                        placeholder={col === "cedula" ? PLACEHOLDER_CEDULA : undefined}
                        className="w-full rounded border border-neutral-bg px-2 py-1"
                      />
                    </td>
                  ))}
                  <td>
                    <button
                      type="button"
                      onClick={() => quitarFila(indice)}
                      className="text-neutral-text hover:text-brand-pink"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            type="button"
            onClick={agregarFila}
            className="inline-flex items-center gap-1 text-xs text-brand-blue font-medium"
          >
            <Plus size={14} /> Agregar fila
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-brand-pink-light border border-brand-pink p-3 text-sm text-brand-blue mt-4">
            {error}
          </div>
        )}

        <button
          onClick={enviarRoster}
          disabled={enviando}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-pink text-white px-6 py-2.5 font-medium hover:opacity-90 disabled:opacity-60"
        >
          <Upload size={16} />
          {enviando ? "Enviando..." : "Confirmar roster"}
        </button>
      </div>

      {resultado && (
        <div className="rounded-xl bg-white border border-neutral-bg p-6 mt-6">
          <p className="font-display font-semibold text-brand-blue mb-2">
            {resultado.creados} estudiante(s) creada(s)
          </p>
          {resultado.discrepancia && (
            <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 rounded-lg p-3 mb-3">
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
              <span>
                Se estimaron {resultado.cantidadEstimada} estudiantes pero el roster
                trajo {resultado.cantidadCreadaEnEsteLote}. El grupo se creó igual con
                la cantidad real.
              </span>
            </div>
          )}
          {resultado.errores.length > 0 && (
            <div>
              <p className="text-sm font-medium text-brand-pink mb-1">
                {resultado.errores.length} fila(s) con error:
              </p>
              <ul className="text-xs text-neutral-text list-disc pl-4">
                {resultado.errores.map((err, i) => (
                  <li key={i}>
                    Fila {err.fila} {err.email ? `(${err.email})` : ""}: {err.motivo}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Pestaña: Datos del grupo (editar contacto/notas, finalizar/reactivar)
// ---------------------------------------------------------------------

function PestanaDatos({
  grupo,
  token,
  onActualizado,
}: {
  grupo: Grupo;
  token: string | null;
  onActualizado: (grupo: Grupo) => void;
}) {
  const [form, setForm] = useState({
    nombreInstitucion: grupo.nombreInstitucion,
    contactoNombre: grupo.contactoNombre,
    contactoEmail: grupo.contactoEmail,
    contactoTelefono: grupo.contactoTelefono,
    notas: grupo.notas || "",
    precioAcordado: String(grupo.precioAcordado),
    cantidadEstudiantesEstimada: String(grupo.cantidadEstudiantesEstimada),
  });
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [enviandoReporte, setEnviandoReporte] = useState(false);
  const [mensajeReporte, setMensajeReporte] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  function actualizar(campo: keyof typeof form, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function patch(cuerpo: Record<string, unknown>, textoOk: string) {
    setGuardando(true);
    setMensaje(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/grupos/${grupo._id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cuerpo),
      });
      const json = await res.json();
      if (json.success) {
        onActualizado(json.data);
        setMensaje({ tipo: "ok", texto: textoOk });
      } else {
        setMensaje({ tipo: "error", texto: json.error || "No se pudo guardar." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    } finally {
      setGuardando(false);
    }
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    const cuerpo: Record<string, unknown> = {
      nombreInstitucion: form.nombreInstitucion,
      contactoNombre: form.contactoNombre,
      contactoEmail: form.contactoEmail,
      contactoTelefono: form.contactoTelefono,
      notas: form.notas,
    };
    // El backend solo acepta estos dos mientras no se haya cargado el
    // roster (después ya hay movimientos contables calculados).
    if (grupo.pendienteRoster) {
      cuerpo.precioAcordado = Number(form.precioAcordado);
      cuerpo.cantidadEstudiantesEstimada = Number(form.cantidadEstudiantesEstimada);
    }
    patch(cuerpo, "Cambios guardados.");
  }

  function cambiarActivo() {
    const finalizar = grupo.activo;
    const aviso = finalizar
      ? `¿Finalizar este grupo? Se deja de enviar el reporte de avance diario a ${grupo.contactoEmail}. Las estudiantes conservan su acceso al curso.`
      : `¿Reactivar este grupo? Se vuelve a enviar el reporte de avance diario a ${grupo.contactoEmail}.`;
    if (!window.confirm(aviso)) return;
    patch(
      { activo: !grupo.activo },
      finalizar ? "Grupo finalizado." : "Grupo reactivado.",
    );
  }

  // NUEVO (19/09/2026): manda YA el mismo reporte de avance que el cron
  // envía cada día. No cambia el estado del grupo.
  async function enviarReporteAhora() {
    if (
      !window.confirm(
        `Se enviará ahora el reporte de avance a ${grupo.contactoEmail}. ¿Continuar?`,
      )
    ) {
      return;
    }
    setEnviandoReporte(true);
    setMensajeReporte(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/grupos/${grupo._id}/enviar-reporte`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();
      setMensajeReporte(
        json.success
          ? {
            tipo: "ok",
            texto: `Reporte enviado a ${json.data.email} (${json.data.cantidad} estudiantes).`,
          }
          : { tipo: "error", texto: json.error || "No se pudo enviar el reporte." },
      );
    } catch {
      setMensajeReporte({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    } finally {
      setEnviandoReporte(false);
    }
  }

  const claseInput = "w-full mt-1 rounded-lg border border-neutral-bg px-3 py-2";

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <form
        onSubmit={guardar}
        className="lg:col-span-2 rounded-xl bg-white border border-neutral-bg p-6 grid gap-4"
      >
        <p className="font-display font-semibold text-brand-blue">Datos de la institución</p>

        <label className="text-sm text-neutral-text">
          Nombre de la institución
          <input
            required
            value={form.nombreInstitucion}
            onChange={(e) => actualizar("nombreInstitucion", e.target.value)}
            className={claseInput}
          />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="text-sm text-neutral-text">
            Contacto (nombre)
            <input
              required
              value={form.contactoNombre}
              onChange={(e) => actualizar("contactoNombre", e.target.value)}
              className={claseInput}
            />
          </label>
          <label className="text-sm text-neutral-text">
            Contacto (correo)
            <input
              required
              type="email"
              value={form.contactoEmail}
              onChange={(e) => actualizar("contactoEmail", e.target.value)}
              className={claseInput}
            />
          </label>
          <label className="text-sm text-neutral-text">
            Contacto (teléfono)
            <input
              required
              value={form.contactoTelefono}
              onChange={(e) => actualizar("contactoTelefono", e.target.value)}
              className={claseInput}
            />
          </label>
        </div>

        {grupo.pendienteRoster ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-sm text-neutral-text">
              Precio total acordado (RD$)
              <input
                required
                type="number"
                min={1}
                value={form.precioAcordado}
                onChange={(e) => actualizar("precioAcordado", e.target.value)}
                className={claseInput}
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
                className={claseInput}
              />
            </label>
          </div>
        ) : (
          <p className="text-xs text-neutral-text bg-neutral-bg rounded-lg px-3 py-2">
            Precio acordado: RD${grupo.precioAcordado.toLocaleString("es-DO")} · Estimado
            inicial: {grupo.cantidadEstudiantesEstimada} estudiantes. Ya no se pueden
            editar porque el pago del grupo quedó registrado en contabilidad.
          </p>
        )}

        <label className="text-sm text-neutral-text">
          Notas internas
          <textarea
            rows={3}
            value={form.notas}
            onChange={(e) => actualizar("notas", e.target.value)}
            className={claseInput}
          />
        </label>

        {mensaje && (
          <div
            className={`rounded-lg p-3 text-sm ${mensaje.tipo === "ok"
              ? "bg-status-success/10 border border-status-success text-status-success"
              : "bg-brand-pink-light border border-brand-pink text-brand-blue"
              }`}
          >
            {mensaje.texto}
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={guardando}
            className="rounded-full bg-brand-pink text-white px-6 py-2.5 font-medium hover:opacity-90 disabled:opacity-60"
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>

      {!grupo.pendienteRoster && (
        <div className="rounded-xl bg-white border border-neutral-bg p-6 self-start">
          <p className="font-display font-semibold text-brand-blue mb-1">
            Estado del grupo
          </p>
          <p className="text-sm text-neutral-text mb-4">
            {grupo.activo
              ? "En curso. Cada día a las 10:00 AM se envía un reporte de avance al contacto de la institución, hasta que todas terminen la teoría."
              : "Finalizado. Ya no se envían reportes de avance por correo a la institución."}
          </p>
          <button
            type="button"
            onClick={cambiarActivo}
            disabled={guardando}
            className="rounded-full border border-brand-blue text-brand-blue px-5 py-2 text-sm font-medium hover:bg-brand-blue hover:text-white transition-colors disabled:opacity-60"
          >
            {grupo.activo ? "Finalizar grupo" : "Reactivar grupo"}
          </button>

          <div className="border-t border-neutral-bg mt-5 pt-5">
            <p className="font-display font-semibold text-brand-blue mb-1">
              Reporte a la institución
            </p>
            <p className="text-sm text-neutral-text mb-4">
              Envía ahora el reporte de avance (quién va en qué sesión) a{" "}
              {grupo.contactoEmail}, sin esperar al envío diario.
            </p>
            <button
              type="button"
              onClick={enviarReporteAhora}
              disabled={enviandoReporte}
              className="inline-flex items-center gap-2 rounded-full bg-brand-blue text-white px-5 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-60"
            >
              <Send size={14} />
              {enviandoReporte ? "Enviando..." : "Enviar reporte ahora"}
            </button>
            {mensajeReporte && (
              <div
                className={`rounded-lg p-3 text-sm mt-3 ${mensajeReporte.tipo === "ok"
                  ? "bg-status-success/10 border border-status-success text-status-success"
                  : "bg-brand-pink-light border border-brand-pink text-brand-blue"
                  }`}
              >
                {mensajeReporte.texto}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Pantalla
// ---------------------------------------------------------------------

type Pestana = "estudiantes" | "roster" | "datos";

function PanelGrupoDetalleContenido() {
  const params = useParams();
  const grupoId = params.id as string;
  const { token, usuario } = useAuth();
  const esAdmin = usuario?.rol === "admin";

  const [grupo, setGrupo] = useState<Grupo | null>(null);
  const [estudiantes, setEstudiantes] = useState<FilaEstudiante[]>([]);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [cargando, setCargando] = useState(true);
  const [pestana, setPestana] = useState<Pestana | null>(null);

  const cargar = useCallback(async () => {
    if (!token || !grupoId) return;
    setCargando(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/grupos/${grupoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setGrupo(json.data.grupo);
        setEstudiantes(json.data.estudiantes);
        setResumen(json.data.resumen);
      }
    } catch {
      // silencioso
    } finally {
      setCargando(false);
    }
  }, [token, grupoId]);

  useEffect(() => {
    // Mismo fix que en panel/grupos/page.tsx para react-hooks/set-state-in-effect.
    queueMicrotask(() => cargar());
  }, [cargar]);

  if (cargando && !grupo) {
    return <p className="text-sm text-neutral-text">Cargando...</p>;
  }

  if (!grupo || !resumen) {
    return <p className="text-sm text-neutral-text">Grupo no encontrado.</p>;
  }

  // Si el grupo todavía no tiene roster, se abre directo en esa pestaña.
  const pestanaActiva: Pestana = pestana ?? (grupo.pendienteRoster ? "roster" : "estudiantes");

  const PESTANAS: { id: Pestana; etiqueta: string }[] = [
    { id: "estudiantes", etiqueta: "Estudiantes" },
    {
      id: "roster",
      etiqueta: grupo.pendienteRoster ? "Cargar roster" : "Agregar estudiantes",
    },
    { id: "datos", etiqueta: "Datos del grupo" },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <Link
        href="/panel/grupos"
        className="text-sm text-brand-blue-light hover:underline mb-4 inline-block"
      >
        ← Todos los grupos
      </Link>

      <div className="rounded-xl bg-white border border-neutral-bg p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            {grupo.tipo === "colegio" ? (
              <School className="text-brand-blue mt-1" size={26} />
            ) : (
              <Building2 className="text-brand-blue mt-1" size={26} />
            )}
            <div>
              <p className="font-display font-semibold text-brand-blue text-xl">
                {grupo.nombreInstitucion}
              </p>
              <p className="text-sm text-neutral-text mt-0.5">
                {grupo.tipo === "colegio" ? "Escolar" : "Empresarial"}
                {grupo.fechaInicio && ` · Inició el ${formatearFecha(grupo.fechaInicio)}`}
              </p>
            </div>
          </div>
          <div>
            {grupo.pendienteRoster ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                <Clock size={12} /> Falta cargar roster
              </span>
            ) : grupo.activo ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-status-success/15 text-status-success">
                En curso
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-neutral-bg text-neutral-text">
                <CheckCircle2 size={12} /> Finalizado
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm text-neutral-text">
          <span>Contacto: {grupo.contactoNombre}</span>
          <a
            href={`mailto:${grupo.contactoEmail}`}
            className="inline-flex items-center gap-1.5 hover:text-brand-blue"
          >
            <Mail size={14} /> {grupo.contactoEmail}
          </a>
          <a
            href={`tel:${grupo.contactoTelefono}`}
            className="inline-flex items-center gap-1.5 hover:text-brand-blue"
          >
            <Phone size={14} /> {grupo.contactoTelefono}
          </a>
          <span>
            Acordado: RD${grupo.precioAcordado.toLocaleString("es-DO")}
            {grupo.pendienteRoster && ` · ~${grupo.cantidadEstudiantesEstimada} estudiantes`}
          </span>
        </div>

        {grupo.notas && (
          <p className="text-xs text-neutral-text bg-neutral-bg rounded-lg px-3 py-2 mt-4">
            <span className="font-medium">Notas:</span> {grupo.notas}
          </p>
        )}
      </div>

      {!grupo.pendienteRoster && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Indicador
            Icono={Users}
            valor={resumen.activas}
            etiqueta="Estudiantes activas"
            detalle={resumen.inactivas > 0 ? `+${resumen.inactivas} inactivas` : undefined}
          />
          <Indicador
            Icono={BarChart3}
            valor={`${resumen.porcentajeAvance}%`}
            etiqueta="Avance promedio"
            detalle={
              resumen.promedioExamenes !== null
                ? `Promedio de exámenes ${resumen.promedioExamenes}%`
                : undefined
            }
          />
          <Indicador
            Icono={GraduationCap}
            valor={`${resumen.completados}/${resumen.activas}`}
            etiqueta="Completaron la teoría"
            detalle={`${resumen.enCurso} en curso · ${resumen.sinIniciar} sin iniciar`}
          />
          <Indicador
            Icono={AlertTriangle}
            valor={resumen.rezagadas}
            etiqueta="Sin actividad en 7+ días"
            alerta={resumen.rezagadas > 0}
          />
          <Indicador
            Icono={ClipboardList}
            valor={`${resumen.cuestionariosCompletados}/${resumen.activas}`}
            etiqueta={
              grupo.tipo === "colegio" ? "Cuestionarios completados" : "Perfiles completados"
            }
          />
          <Indicador Icono={Award} valor={resumen.diplomas} etiqueta="Diplomas emitidos" />
        </div>
      )}

      <div className="flex gap-1 mb-6 border-b border-neutral-bg overflow-x-auto">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPestana(p.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${pestanaActiva === p.id
              ? "border-brand-blue text-brand-blue"
              : "border-transparent text-neutral-text hover:text-brand-blue"
              }`}
          >
            {p.etiqueta}
          </button>
        ))}
      </div>

      {pestanaActiva === "estudiantes" && (
        <PestanaEstudiantes
          grupo={grupo}
          estudiantes={estudiantes}
          resumen={resumen}
          esAdmin={esAdmin}
          token={token}
          onCambio={cargar}
          onIrARoster={() => setPestana("roster")}
        />
      )}

      {pestanaActiva === "roster" && (
        <PestanaRoster grupo={grupo} token={token} onCargado={cargar} />
      )}

      {pestanaActiva === "datos" && (
        <PestanaDatos
          // key: si el grupo cambia desde afuera (recarga), el formulario
          // se reinicia con los valores frescos en vez de conservar los viejos.
          key={`${grupo._id}-${grupo.activo}-${grupo.pendienteRoster}`}
          grupo={grupo}
          token={token}
          onActualizado={(g) => setGrupo((prev) => (prev ? { ...prev, ...g } : g))}
        />
      )}
    </div>
  );
}

export default function PanelGrupoDetallePage() {
  return <PanelGrupoDetalleContenido />;
}