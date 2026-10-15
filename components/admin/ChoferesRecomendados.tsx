"use client";

// NUEVO (15/10/2026): gestión de choferes/operadores RECOMENDADOS para los
// cursos teóricos de Camionero (pesados) y Montacargas. No son choferes de
// la fundación: no tienen cuenta ni acceso, solo una ficha de contacto que
// se le muestra a la estudiante al terminar su curso. Se usa dentro de
// /admin/choferes (una pestaña por programa). Backend:
// /api/choferes-recomendados.

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

type Programa = "pesados" | "montacargas";
type Zona = { provincia: string; municipio: string };
type ProvinciaConMunicipios = { provincia: string; municipios: string[] };

type Chofer = {
  _id: string;
  programa: Programa;
  nombre: string;
  telefono: string;
  email: string;
  zonas: Zona[];
  activo: boolean;
};

const formVacio = { nombre: "", telefono: "", email: "" };

export default function ChoferesRecomendados({
  programa,
  etiqueta,
}: {
  programa: Programa;
  etiqueta: string;
}) {
  const { token } = useAuth();

  const [choferes, setChoferes] = useState<Chofer[]>([]);
  const [referencia, setReferencia] = useState<ProvinciaConMunicipios[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  // null = formulario cerrado, "nuevo" = creando, otro valor = id en edición
  const [formAbierto, setFormAbierto] = useState<string | null>(null);
  const [form, setForm] = useState(formVacio);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [provinciaSel, setProvinciaSel] = useState("");
  const [municipioSel, setMunicipioSel] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/choferes-recomendados?programa=${programa}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();
      if (json.success) setChoferes(json.data);
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos cargar la lista." });
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    let cancelado = false;

    (async () => {
      try {
        const [resLista, resRef] = await Promise.all([
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/choferes-recomendados?programa=${programa}`,
            { headers: { Authorization: `Bearer ${token}` } },
          ),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/ubicaciones/provincias-municipios`),
        ]);
        const json = await resLista.json();
        const jsonRef = await resRef.json();
        if (!cancelado) {
          if (json.success) setChoferes(json.data);
          if (jsonRef.success) setReferencia(jsonRef.data);
        }
      } catch {
        if (!cancelado) {
          setMensaje({ tipo: "error", texto: "No pudimos cargar la lista." });
        }
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [token, programa]);

  function municipiosDisponibles() {
    const delaProvincia =
      referencia.find((p) => p.provincia === provinciaSel)?.municipios ?? [];
    return delaProvincia.filter(
      (m) => !zonas.some((z) => z.provincia === provinciaSel && z.municipio === m),
    );
  }

  function agregarZona() {
    if (!provinciaSel || !municipioSel) return;
    setZonas((prev) => [...prev, { provincia: provinciaSel, municipio: municipioSel }]);
    setMunicipioSel("");
  }

  function cerrarForm() {
    setFormAbierto(null);
    setForm(formVacio);
    setZonas([]);
    setProvinciaSel("");
    setMunicipioSel("");
  }

  function abrirNuevo() {
    cerrarForm();
    setMensaje(null);
    setFormAbierto("nuevo");
  }

  function abrirEdicion(c: Chofer) {
    setForm({ nombre: c.nombre, telefono: c.telefono, email: c.email || "" });
    setZonas(c.zonas);
    setProvinciaSel("");
    setMunicipioSel("");
    setMensaje(null);
    setFormAbierto(c._id);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (zonas.length === 0) {
      setMensaje({ tipo: "error", texto: "Agrega al menos una zona (provincia y municipio)." });
      return;
    }

    setGuardando(true);
    setMensaje(null);
    const esNuevo = formAbierto === "nuevo";

    try {
      const res = await fetch(
        esNuevo
          ? `${process.env.NEXT_PUBLIC_API_URL}/choferes-recomendados`
          : `${process.env.NEXT_PUBLIC_API_URL}/choferes-recomendados/${formAbierto}`,
        {
          method: esNuevo ? "POST" : "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...(esNuevo ? { programa } : {}),
            nombre: form.nombre,
            telefono: form.telefono,
            email: form.email,
            zonas,
          }),
        },
      );
      const json = await res.json();
      if (json.success) {
        setMensaje({ tipo: "ok", texto: esNuevo ? "Chofer agregado." : "Cambios guardados." });
        cerrarForm();
        cargar();
      } else {
        setMensaje({ tipo: "error", texto: json.error || "No se pudo guardar." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    } finally {
      setGuardando(false);
    }
  }

  async function toggleActivo(c: Chofer) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/choferes-recomendados/${c._id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ activo: !c.activo }),
        },
      );
      const json = await res.json();
      if (json.success) cargar();
      else setMensaje({ tipo: "error", texto: json.error || "No se pudo actualizar." });
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    }
  }

  async function eliminar(c: Chofer) {
    if (!window.confirm(`¿Eliminar a ${c.nombre} de la lista? Esta acción no se puede deshacer.`)) {
      return;
    }
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/choferes-recomendados/${c._id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();
      if (json.success) cargar();
      else setMensaje({ tipo: "error", texto: json.error || "No se pudo eliminar." });
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    }
  }

  return (
    <div>
      <div className="rounded-lg bg-brand-blue-light/10 border border-brand-blue-light p-4 mb-6">
        <p className="text-sm font-medium text-brand-blue mb-1">
          Choferes recomendados — {etiqueta}
        </p>
        <p className="text-xs text-neutral-text">
          Estos choferes no tienen
          cuenta ni acceso al sistema. Sus datos se muestran como
          recomendación a las estudiantes que terminan este curso, para que
          los contacten si quieren tomar clases prácticas.
        </p>
      </div>

      {formAbierto === null && (
        <button
          onClick={abrirNuevo}
          className="mb-6 rounded-lg bg-brand-blue-light text-white text-sm px-4 py-2 font-medium hover:opacity-90"
        >
          + Agregar chofer recomendado
        </button>
      )}

      {formAbierto !== null && (
        <form
          onSubmit={guardar}
          className="grid gap-4 mb-8 rounded-xl bg-white border-2 border-brand-blue-light p-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-brand-blue">
              {formAbierto === "nuevo" ? "Nuevo chofer recomendado" : "Editar chofer recomendado"}
            </h3>
            <button
              type="button"
              onClick={cerrarForm}
              className="text-xs text-brand-blue-light hover:underline"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-neutral-text col-span-2">
              Nombre completo
              <input
                type="text"
                required
                maxLength={120}
                value={form.nombre}
                onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm text-neutral-text">
              Celular / teléfono
              <input
                type="tel"
                required
                maxLength={30}
                value={form.telefono}
                onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm text-neutral-text">
              Correo (opcional)
              <input
                type="email"
                maxLength={120}
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div>
            <p className="text-sm text-neutral-text mb-2">Zonas donde da clases prácticas</p>
            {zonas.length > 0 && (
              <div className="grid gap-1 mb-2">
                {zonas.map((z, i) => (
                  <div
                    key={`${z.provincia}-${z.municipio}`}
                    className="flex items-center justify-between rounded-lg bg-neutral-bg px-3 py-1.5 text-sm"
                  >
                    <span>
                      {z.municipio}, {z.provincia}
                    </span>
                    <button
                      type="button"
                      onClick={() => setZonas((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-xs text-brand-pink px-2"
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <select
                value={provinciaSel}
                onChange={(e) => {
                  setProvinciaSel(e.target.value);
                  setMunicipioSel("");
                }}
                className="flex-1 rounded-lg border border-neutral-bg px-3 py-2 text-sm bg-white"
              >
                <option value="">Provincia</option>
                {referencia.map((p) => (
                  <option key={p.provincia} value={p.provincia}>
                    {p.provincia}
                  </option>
                ))}
              </select>
              <select
                value={municipioSel}
                onChange={(e) => setMunicipioSel(e.target.value)}
                disabled={!provinciaSel}
                className="flex-1 rounded-lg border border-neutral-bg px-3 py-2 text-sm bg-white disabled:opacity-60"
              >
                <option value="">{provinciaSel ? "Municipio" : "Elige provincia"}</option>
                {municipiosDisponibles().map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={agregarZona}
                disabled={!provinciaSel || !municipioSel}
                className="rounded-lg bg-brand-blue-light text-white text-sm px-3 disabled:opacity-50"
              >
                + Agregar
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={guardando}
            className="rounded-xl bg-brand-blue text-white p-4 font-display font-semibold hover:opacity-90 disabled:opacity-60"
          >
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </form>
      )}

      {cargando && <p className="text-sm text-neutral-text">Cargando...</p>}

      {!cargando && choferes.length === 0 && (
        <p className="text-sm text-neutral-text">
          Todavía no hay choferes recomendados para este curso. Mientras no
          haya ninguno activo, las estudiantes no verán esta sección.
        </p>
      )}

      <div className="grid gap-3">
        {choferes.map((c) => (
          <div
            key={c._id}
            className="rounded-lg bg-white border border-neutral-bg border-l-4 border-l-brand-blue-light p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-brand-blue text-sm">{c.nombre}</p>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand-blue-light/10 text-brand-blue-light">
                    Recomendado
                  </span>
                  {!c.activo && (
                    <span className="text-[10px] text-neutral-text">(inactivo)</span>
                  )}
                </div>
                <p className="text-xs text-neutral-text">
                  {c.telefono}
                  {c.email ? ` · ${c.email}` : ""}
                </p>
                <p className="text-xs text-brand-blue-light mt-1">
                  Zonas: {c.zonas.map((z) => `${z.municipio}, ${z.provincia}`).join(" · ")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-end shrink-0">
                <button
                  onClick={() => toggleActivo(c)}
                  className="text-xs font-medium px-3 py-1.5 rounded-full bg-neutral-bg text-neutral-text hover:bg-brand-pink-light"
                >
                  {c.activo ? "Desactivar" : "Activar"}
                </button>
                <button
                  onClick={() => abrirEdicion(c)}
                  className="text-xs font-medium px-3 py-1.5 rounded-full bg-brand-blue-light text-white hover:opacity-90"
                >
                  Editar
                </button>
                <button
                  onClick={() => eliminar(c)}
                  className="text-xs font-medium px-3 py-1.5 rounded-full bg-brand-pink-light text-brand-pink hover:opacity-90"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {mensaje && (
        <div
          className={`mt-6 rounded-lg p-4 text-sm ${mensaje.tipo === "ok"
            ? "bg-status-success/10 border border-status-success text-status-success"
            : "bg-brand-pink-light border border-brand-pink text-brand-blue"
            }`}
        >
          {mensaje.texto}
        </div>
      )}
    </div>
  );
}