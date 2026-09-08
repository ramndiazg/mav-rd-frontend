"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Save } from "lucide-react";
import RutaProtegida from "@/components/auth/RutaProtegida";
import { useAuth } from "@/contexts/AuthContext";

type Plan = {
  _id: string;
  programa: string;
  codigo: "fundacion" | "normal" | "vip";
  nombre: string;
  precio: number;
  fraseDestacada: string;
  modalidadPractica: "grupal" | "individual";
  cantidadSesionesPractica: number | null;
  duracionSesionMinutos: number;
  costoPorSesion: number;
  caracteristicas: string[];
  activo: boolean;
  orden: number;
};

// Estado editable de un plan — igual que Plan pero con caracteristicas como
// texto plano (una por línea) mientras se edita, más fácil que un editor de
// lista con botones de agregar/quitar.
type PlanEnEdicion = Omit<Plan, "caracteristicas"> & {
  caracteristicasTexto: string;
};

function aPlanEnEdicion(plan: Plan): PlanEnEdicion {
  return { ...plan, caracteristicasTexto: plan.caracteristicas.join("\n") };
}

function EditorDePlan({
  plan,
  onGuardado,
}: {
  plan: Plan;
  onGuardado: (actualizado: Plan) => void;
}) {
  const { token } = useAuth();
  const [form, setForm] = useState<PlanEnEdicion>(aPlanEnEdicion(plan));
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(
    null,
  );

  function actualizarCampo<K extends keyof PlanEnEdicion>(
    campo: K,
    valor: PlanEnEdicion[K],
  ) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);

    const cuerpo = {
      nombre: form.nombre,
      precio: form.precio,
      fraseDestacada: form.fraseDestacada,
      modalidadPractica: form.modalidadPractica,
      cantidadSesionesPractica: form.cantidadSesionesPractica,
      duracionSesionMinutos: form.duracionSesionMinutos,
      costoPorSesion: form.costoPorSesion,
      caracteristicas: form.caracteristicasTexto
        .split("\n")
        .map((linea) => linea.trim())
        .filter(Boolean),
      activo: form.activo,
    };

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/planes/${plan.codigo}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(cuerpo),
        },
      );
      const json = await res.json();

      if (json.success) {
        setMensaje({ tipo: "ok", texto: "Guardado." });
        onGuardado(json.data);
      } else {
        setMensaje({ tipo: "error", texto: json.error || "No se pudo guardar." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form
      onSubmit={guardar}
      className={`rounded-lg bg-white border p-5 ${form.activo ? "border-neutral-bg" : "border-neutral-bg opacity-60"
        }`}
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-text/60">
          {plan.codigo}
        </p>
        <label className="flex items-center gap-2 text-xs text-neutral-text">
          <input
            type="checkbox"
            checked={form.activo}
            onChange={(e) => actualizarCampo("activo", e.target.checked)}
          />
          Visible en el sitio
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-neutral-text">
          Nombre
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => actualizarCampo("nombre", e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
          />
        </label>

        <label className="text-sm text-neutral-text">
          Precio (RD$)
          <input
            type="number"
            min={0}
            value={form.precio}
            onChange={(e) => actualizarCampo("precio", Number(e.target.value))}
            required
            className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
          />
        </label>

        <label className="text-sm text-neutral-text sm:col-span-2">
          Frase destacada (se muestra en el Home)
          <input
            type="text"
            value={form.fraseDestacada}
            onChange={(e) => actualizarCampo("fraseDestacada", e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
          />
        </label>

        <label className="text-sm text-neutral-text">
          Modalidad de práctica
          <select
            value={form.modalidadPractica}
            onChange={(e) =>
              actualizarCampo(
                "modalidadPractica",
                e.target.value as PlanEnEdicion["modalidadPractica"],
              )
            }
            className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
          >
            <option value="grupal">Grupal</option>
            <option value="individual">Individual</option>
          </select>
        </label>

        <label className="text-sm text-neutral-text">
          Duración por sesión (min)
          <input
            type="number"
            min={0}
            value={form.duracionSesionMinutos}
            onChange={(e) =>
              actualizarCampo("duracionSesionMinutos", Number(e.target.value))
            }
            required
            className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
          />
        </label>

        <label className="text-sm text-neutral-text">
          Cantidad de sesiones de práctica
          <input
            type="number"
            min={0}
            placeholder="Vacío = grupal, sin número fijo"
            value={form.cantidadSesionesPractica ?? ""}
            onChange={(e) =>
              actualizarCampo(
                "cantidadSesionesPractica",
                e.target.value === "" ? null : Number(e.target.value),
              )
            }
            className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
          />
        </label>

        <label className="text-sm text-neutral-text">
          Combustible por sesión (RD$)
          <input
            type="number"
            min={0}
            value={form.costoPorSesion}
            onChange={(e) =>
              actualizarCampo("costoPorSesion", Number(e.target.value))
            }
            required
            className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
          />
        </label>

        <label className="text-sm text-neutral-text sm:col-span-2">
          Características (una por línea, para el detalle en /inscripcion)
          <textarea
            value={form.caracteristicasTexto}
            onChange={(e) =>
              actualizarCampo("caracteristicasTexto", e.target.value)
            }
            rows={5}
            className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={guardando}
          className="text-xs font-medium px-4 py-2 rounded-full bg-brand-blue text-white hover:opacity-90 disabled:opacity-60 flex items-center gap-1.5"
        >
          <Save size={14} />
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>

        {mensaje && (
          <span
            className={`text-xs flex items-center gap-1 ${mensaje.tipo === "ok" ? "text-status-success" : "text-brand-pink"
              }`}
          >
            {mensaje.tipo === "ok" && <CheckCircle2 size={14} />}
            {mensaje.texto}
          </span>
        )}
      </div>
    </form>
  );
}

function PantallaPlanes() {
  const { token } = useAuth();
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelado = false;

    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/planes/admin/todos`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const json = await res.json();
        if (cancelado) return;
        if (json.success) {
          setPlanes(json.data);
          setError(false);
        } else {
          setError(true);
        }
      } catch {
        if (!cancelado) setError(true);
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [token]);

  function reemplazarPlan(actualizado: Plan) {
    setPlanes((prev) =>
      prev.map((p) => (p.codigo === actualizado.codigo ? actualizado : p)),
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="font-display text-2xl font-bold text-brand-blue mb-1">
        Planes y precios
      </h2>
      <p className="text-sm text-neutral-text mb-6">
        Estos datos son los que ve el público en el Home y en /inscripcion.
        Los cambios se reflejan de inmediato, sin necesidad de un nuevo
        despliegue.
      </p>

      {cargando && <p className="text-sm text-neutral-text">Cargando...</p>}

      {error && !cargando && (
        <p className="text-sm text-brand-pink">
          No pudimos cargar los planes. Intenta de nuevo en unos minutos.
        </p>
      )}

      <div className="grid gap-4">
        {planes.map((plan) => (
          <EditorDePlan key={plan.codigo} plan={plan} onGuardado={reemplazarPlan} />
        ))}
      </div>
    </div>
  );
}

export default function AdminPlanesPage() {
  return (
    <RutaProtegida rolesPermitidos={["admin"]}>
      <PantallaPlanes />
    </RutaProtegida>
  );
}