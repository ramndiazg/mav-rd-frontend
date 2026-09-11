"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Trash2, Upload, AlertTriangle, UserX } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// CAMBIO (10/09/2026): se eliminó el modo "CSV / pegado" a pedido del
// usuario — no se entendía bien (formato de columnas por posición, sin
// nombres visibles) y fila por fila es más fácil de seguir aunque sea
// más lento para rosters grandes. Si se necesita reintroducir una carga
// masiva en el futuro, mejor como un CSV con encabezados reales
// validados campo por campo, no este parser posicional.

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
};

type EstudianteExistente = {
  _id: string;
  nombre: string;
  apellido: string;
  cedula: string;
  email: string;
  telefono: string;
  activo: boolean;
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

// NUEVO (10/09/2026): si un estudiante no tiene cédula (menor de un
// colegio), se deja el campo vacío — ya no hace falta escribir "N/A" a
// mano (chocaba entre sí como cédula duplicada). El backend lo trata
// igual si de todas formas alguien escribe "N/A".
const PLACEHOLDER_CEDULA = "Dejar vacío si no tiene";

function PanelGrupoDetalleContenido() {
  const params = useParams();
  const grupoId = params.id as string;
  const { token } = useAuth();

  const [grupo, setGrupo] = useState<Grupo | null>(null);
  const [existentes, setExistentes] = useState<EstudianteExistente[]>([]);
  const [cargando, setCargando] = useState(true);

  const [filas, setFilas] = useState<FilaRoster[]>([{ ...FILA_VACIA }]);

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoRoster | null>(null);

  // NUEVO (10/09/2026): soft delete en lote — cuando el roster de la
  // institución cambia (estudiantes que ya no pertenecen al grupo), la
  // coordinadora puede seleccionarlos aquí y desactivarlos de una vez en
  // vez de ir uno por uno a /panel/estudiantes.
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [desactivando, setDesactivando] = useState(false);
  const [errorDesactivar, setErrorDesactivar] = useState<string | null>(null);

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
        setExistentes(json.data.estudiantes);
      }
    } catch {
      // silencioso
    } finally {
      setCargando(false);
    }
  }, [token, grupoId]);

  useEffect(() => {
    // Mismo fix que en panel/grupos/page.tsx (y originalmente en
    // panel/estudiantes/page.tsx) para react-hooks/set-state-in-effect.
    queueMicrotask(() => cargar());
  }, [cargar]);

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

  function alternarSeleccion(id: string) {
    setSeleccionados((prev) => {
      const copia = new Set(prev);
      if (copia.has(id)) {
        copia.delete(id);
      } else {
        copia.add(id);
      }
      return copia;
    });
  }

  const activos = existentes.filter((e) => e.activo);

  function alternarSeleccionTodos() {
    setSeleccionados((prev) =>
      prev.size === activos.length ? new Set() : new Set(activos.map((e) => e._id)),
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
        cargar();
      } else {
        setErrorDesactivar(json.error || "No se pudo desactivar a las estudiantes.");
      }
    } catch {
      setErrorDesactivar("No pudimos conectar con el servidor. Intenta de nuevo.");
    } finally {
      setDesactivando(false);
    }
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
        `${process.env.NEXT_PUBLIC_API_URL}/grupos/${grupoId}/roster`,
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
        cargar();
      } else {
        setError(json.error || "No se pudo cargar el roster.");
      }
    } catch {
      setError("No pudimos conectar con el servidor. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  if (cargando) {
    return <p className="text-sm text-neutral-text">Cargando...</p>;
  }

  if (!grupo) {
    return <p className="text-sm text-neutral-text">Grupo no encontrado.</p>;
  }

  return (
    <div>
      <div className="rounded-xl bg-white border border-neutral-bg p-6 mb-6">
        <p className="font-display font-semibold text-brand-blue text-lg">
          {grupo.nombreInstitucion}
        </p>
        <p className="text-sm text-neutral-text mt-1">
          {grupo.tipo === "colegio" ? "Escolar" : "Empresarial"} — {grupo.contactoNombre} (
          {grupo.contactoEmail}, {grupo.contactoTelefono})
        </p>
        <p className="text-sm text-neutral-text mt-1">
          Precio acordado: RD${grupo.precioAcordado.toLocaleString("es-DO")} — Estimado:{" "}
          {grupo.cantidadEstudiantesEstimada} estudiantes
        </p>
        {grupo.fechaInicio && (
          <p className="text-xs text-neutral-text mt-1">
            Inicio: {new Date(grupo.fechaInicio).toLocaleDateString("es-DO")}
          </p>
        )}
      </div>

      {existentes.length > 0 && (
        <div className="rounded-xl bg-white border border-neutral-bg p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="font-display font-semibold text-brand-blue">
              Estudiantes ya cargadas ({existentes.length})
            </p>
            {activos.length > 0 && (
              <button
                type="button"
                onClick={alternarSeleccionTodos}
                className="text-xs text-brand-blue font-medium"
              >
                {seleccionados.size === activos.length ? "Deseleccionar todas" : "Seleccionar todas"}
              </button>
            )}
          </div>
          <p className="text-xs text-neutral-text mb-3">
            Si el roster de la institución cambió, marca a las estudiantes que
            ya no pertenecen al grupo y desactívalas — es un soft delete, la
            cuenta no se borra, solo queda inactiva.
          </p>
          <div className="grid gap-2 max-h-64 overflow-y-auto">
            {existentes.map((e) => (
              <label
                key={e._id}
                className={`flex items-center gap-3 text-sm border-b border-neutral-bg pb-1.5 ${e.activo ? "" : "opacity-50"
                  }`}
              >
                <input
                  type="checkbox"
                  disabled={!e.activo}
                  checked={seleccionados.has(e._id)}
                  onChange={() => alternarSeleccion(e._id)}
                  className="shrink-0"
                />
                <span className="flex-1 flex justify-between">
                  <span className="text-neutral-text">
                    {e.nombre} {e.apellido} {!e.activo && "(inactiva)"}
                  </span>
                  <span className="text-neutral-text/70">{e.email}</span>
                </span>
              </label>
            ))}
          </div>

          {errorDesactivar && (
            <div className="rounded-lg bg-brand-pinkLight border border-brand-pink p-3 text-sm text-brand-blue mt-3">
              {errorDesactivar}
            </div>
          )}

          {seleccionados.size > 0 && (
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
      )}

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
          <div className="rounded-lg bg-brand-pinkLight border border-brand-pink p-3 text-sm text-brand-blue mt-4">
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

export default function PanelGrupoDetallePage() {
  return <PanelGrupoDetalleContenido />;
}