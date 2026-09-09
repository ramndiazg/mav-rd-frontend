"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, School, Building2, Clock, CheckCircle2 } from "lucide-react";
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
  cantidadEstudiantesReal: number;
  pendienteRoster: boolean;
  activo: boolean;
  fechaInicio: string | null;
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

function EtiquetaEstado({ grupo }: { grupo: Grupo }) {
  if (grupo.pendienteRoster) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
        <Clock size={12} /> Falta cargar roster
      </span>
    );
  }
  if (!grupo.activo) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-neutral-bg text-neutral-text">
        <CheckCircle2 size={12} /> Finalizado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-status-success/15 text-status-success">
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
        onCreado({ ...json.data, cantidadEstudiantesReal: 0 });
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

      <div className="grid grid-cols-2 gap-3">
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

      <div className="grid grid-cols-3 gap-3">
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

      <div className="grid grid-cols-2 gap-3">
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
        <div className="rounded-lg bg-brand-pinkLight border border-brand-pink p-3 text-sm text-brand-blue">
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

export default function PanelGruposPage() {
  const { token } = useAuth();
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

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
      // silencioso — la tabla se queda vacía, no es crítico bloquear la pantalla
    } finally {
      setCargando(false);
    }
  }, [token]);

  useEffect(() => {
    // NUEVO (09/09/2026): mismo fix ya usado en panel/estudiantes/page.tsx
    // para el warning react-hooks/set-state-in-effect — cargar() hace
    // setState (setCargando) antes del primer await, lo que el linter
    // trata como "setState síncrono dentro de un efecto". queueMicrotask
    // saca esa llamada del cuerpo síncrono del efecto sin cambiar el
    // comportamiento (sigue disparando en el mismo ciclo de renderizado).
    queueMicrotask(() => cargar());
  }, [cargar]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-xl font-bold text-brand-blue">Grupos</h1>
          <p className="text-sm text-neutral-text mt-1">
            Colegios y empresas inscritos en bloque (Escolar/Empresarial)
          </p>
        </div>
        {!mostrarFormulario && (
          <button
            onClick={() => setMostrarFormulario(true)}
            className="inline-flex items-center gap-2 rounded-full bg-brand-pink text-white px-5 py-2.5 font-medium hover:opacity-90"
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

      {cargando ? (
        <p className="text-sm text-neutral-text">Cargando...</p>
      ) : grupos.length === 0 ? (
        <p className="text-sm text-neutral-text">Todavía no hay grupos creados.</p>
      ) : (
        <div className="grid gap-4">
          {grupos.map((g) => (
            <Link
              key={g._id}
              href={`/panel/grupos/${g._id}`}
              className="rounded-xl bg-white border border-neutral-bg p-5 flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                {g.tipo === "colegio" ? (
                  <School className="text-brand-blue" size={22} />
                ) : (
                  <Building2 className="text-brand-blue" size={22} />
                )}
                <div>
                  <p className="font-display font-semibold text-brand-blue">
                    {g.nombreInstitucion}
                  </p>
                  <p className="text-xs text-neutral-text">
                    {g.contactoNombre} — {g.contactoEmail}
                  </p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-1.5">
                <EtiquetaEstado grupo={g} />
                <p className="text-xs text-neutral-text">
                  {g.pendienteRoster
                    ? `~${g.cantidadEstudiantesEstimada} estudiantes (estimado)`
                    : `${g.cantidadEstudiantesReal} estudiantes`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
