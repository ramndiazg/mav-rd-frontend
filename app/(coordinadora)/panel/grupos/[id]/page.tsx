"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Trash2, Upload, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

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
  cedula: "Cédula",
  telefono: "Teléfono",
  email: "Correo",
  provincia: "Provincia",
  fechaNacimiento: "Fecha nac. (AAAA-MM-DD)",
};

// Parser CSV mínimo (sin dependencias): separa por líneas y comas,
// respeta campos entre comillas dobles (con comillas escapadas ""), que es
// lo típico si el archivo viene de Excel/Sheets. La primera línea se
// asume encabezado y se ignora — el orden de columnas esperado es fijo
// (ver COLUMNAS), no se lee por nombre de encabezado.
function parsearCSV(texto: string): string[][] {
  const filas: string[][] = [];
  let fila: string[] = [];
  let campo = "";
  let dentroComillas = false;

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (dentroComillas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          campo += '"';
          i++;
        } else {
          dentroComillas = false;
        }
      } else {
        campo += c;
      }
    } else if (c === '"') {
      dentroComillas = true;
    } else if (c === ",") {
      fila.push(campo.trim());
      campo = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      fila.push(campo.trim());
      campo = "";
      if (fila.some((v) => v !== "")) filas.push(fila);
      fila = [];
    } else {
      campo += c;
    }
  }
  if (campo !== "" || fila.length > 0) {
    fila.push(campo.trim());
    if (fila.some((v) => v !== "")) filas.push(fila);
  }
  return filas;
}

function filasDesdeCSV(texto: string): FilaRoster[] {
  const lineas = parsearCSV(texto);
  if (lineas.length === 0) return [];

  // Si la primera línea parece encabezado (contiene "nombre" o "correo"/
  // "email"), se descarta. Si no, se asume que no hay encabezado y se usa
  // toda la data.
  const primera = lineas[0].join(",").toLowerCase();
  const tieneEncabezado =
    primera.includes("nombre") || primera.includes("correo") || primera.includes("email");
  const datos = tieneEncabezado ? lineas.slice(1) : lineas;

  return datos.map((cols) => ({
    nombre: cols[0] || "",
    apellido: cols[1] || "",
    cedula: cols[2] || "",
    telefono: cols[3] || "",
    email: cols[4] || "",
    provincia: cols[5] || "",
    fechaNacimiento: cols[6] || "",
  }));
}

function PanelGrupoDetalleContenido() {
  const params = useParams();
  const grupoId = params.id as string;
  const { token } = useAuth();

  const [grupo, setGrupo] = useState<Grupo | null>(null);
  const [existentes, setExistentes] = useState<EstudianteExistente[]>([]);
  const [cargando, setCargando] = useState(true);

  const [modo, setModo] = useState<"csv" | "manual">("csv");
  const [textoCSV, setTextoCSV] = useState("");
  const [filas, setFilas] = useState<FilaRoster[]>([{ ...FILA_VACIA }]);

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoRoster | null>(null);

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

  async function enviarRoster() {
    const estudiantes = modo === "csv" ? filasDesdeCSV(textoCSV) : filas;
    const filtrados = estudiantes.filter((f) => f.nombre.trim() || f.email.trim());

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
        setTextoCSV("");
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
          <p className="font-display font-semibold text-brand-blue mb-3">
            Estudiantes ya cargadas ({existentes.length})
          </p>
          <div className="grid gap-2 max-h-64 overflow-y-auto">
            {existentes.map((e) => (
              <div
                key={e._id}
                className="flex justify-between text-sm border-b border-neutral-bg pb-1.5"
              >
                <span className="text-neutral-text">
                  {e.nombre} {e.apellido}
                </span>
                <span className="text-neutral-text/70">{e.email}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl bg-white border border-neutral-bg p-6">
        <p className="font-display font-semibold text-brand-blue mb-1">
          {grupo.pendienteRoster ? "Cargar roster" : "Agregar más estudiantes"}
        </p>
        <p className="text-xs text-neutral-text mb-4">
          {grupo.pendienteRoster
            ? "Carga el roster real — esto crea las cuentas, confirma el pago y activa el prorrateo contable."
            : "Este grupo ya inició. Los estudiantes que agregues aquí se prorratean aparte, sin tocar lo ya cobrado a las demás."}
        </p>

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setModo("csv")}
            className={`text-sm px-4 py-1.5 rounded-full border ${modo === "csv"
              ? "bg-brand-blue text-white border-brand-blue"
              : "border-neutral-bg text-neutral-text"
              }`}
          >
            CSV / pegado
          </button>
          <button
            type="button"
            onClick={() => setModo("manual")}
            className={`text-sm px-4 py-1.5 rounded-full border ${modo === "manual"
              ? "bg-brand-blue text-white border-brand-blue"
              : "border-neutral-bg text-neutral-text"
              }`}
          >
            Fila por fila
          </button>
        </div>

        {modo === "csv" ? (
          <div>
            <p className="text-xs text-neutral-text mb-2">
              Pega filas separadas por comas, una estudiante por línea, en este
              orden: <code>nombre,apellido,cedula,telefono,email,provincia,fechaNacimiento</code>.
              La primera línea puede ser un encabezado, se detecta sola.
            </p>
            <textarea
              value={textoCSV}
              onChange={(e) => setTextoCSV(e.target.value)}
              rows={8}
              placeholder={
                "nombre,apellido,cedula,telefono,email,provincia,fechaNacimiento\nMaría,Pérez,001-1234567-8,809-555-1234,maria@colegio.edu.do,Santo Domingo,2009-03-15"
              }
              className="w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm font-mono"
            />
          </div>
        ) : (
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
        )}

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
