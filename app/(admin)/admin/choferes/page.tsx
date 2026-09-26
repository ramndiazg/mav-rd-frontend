"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

type Dia = "lunes" | "martes" | "miercoles" | "jueves" | "viernes" | "sabado" | "domingo";

const DIAS: { valor: Dia; etiqueta: string }[] = [
  { valor: "lunes", etiqueta: "Lunes" },
  { valor: "martes", etiqueta: "Martes" },
  { valor: "miercoles", etiqueta: "Miércoles" },
  { valor: "jueves", etiqueta: "Jueves" },
  { valor: "viernes", etiqueta: "Viernes" },
  { valor: "sabado", etiqueta: "Sábado" },
  { valor: "domingo", etiqueta: "Domingo" },
];

type DiaDisponible = { dia: Dia; horario: string };

// FIX (bug reportado): antes había un solo input de texto libre para el
// horario completo ("Ej: 2:00 PM - 5:00 PM") y nada obligaba a escribir la
// hora de fin — así quedó Ramón D. con "lunes 2:00" sin fin, sin que la
// estudiante pueda saber hasta qué hora está disponible. El formulario
// ahora pide hora de inicio y fin por separado (<input type="time">, sin
// ambigüedad de AM/PM) y arma el string "HH:MM - HH:MM" al guardar — el
// modelo de datos (Instructor.diasDisponibles[].horario) no cambia, sigue
// siendo un string libre en el backend, solo se estructura desde el
// formulario.
type DiaDisponibleForm = { dia: Dia; horaInicio: string; horaFin: string };

function horarioAForm(horario: string): { horaInicio: string; horaFin: string } {
  const [horaInicio, horaFin] = horario.split(" - ").map((p) => p?.trim() ?? "");
  return { horaInicio: horaInicio || "", horaFin: horaFin || "" };
}

function formAHorario(horaInicio: string, horaFin: string): string {
  return `${horaInicio} - ${horaFin}`;
}

// NUEVO: zona (provincia+municipio) donde el chofer da práctica — ver
// models/Instructor.js (municipiosCubiertos). Distinta de la provincia
// personal del chofer, que sigue siendo el input de texto libre de abajo.
type ZonaCubierta = { provincia: string; municipio: string };
type ProvinciaConMunicipios = { provincia: string; municipios: string[] };

type Instructor = {
  _id: string;
  diasDisponibles: DiaDisponible[];
  municipiosCubiertos: ZonaCubierta[];
  activo: boolean;
  userId: {
    _id: string;
    nombre: string;
    apellido: string;
    telefono: string;
    email: string;
    activo: boolean;
  };
};

function formularioCrearVacio() {
  return {
    nombre: "",
    apellido: "",
    cedula: "",
    telefono: "",
    email: "",
    password: "",
    provincia: "",
    fechaNacimiento: "",
  };
}

export default function ChoferesPage() {
  const { token } = useAuth();

  const [instructores, setInstructores] = useState<Instructor[]>([]);
  const [cargando, setCargando] = useState(true);

  const [creando, setCreando] = useState(false);
  const [formCrear, setFormCrear] = useState(formularioCrearVacio());
  const [diasNuevo, setDiasNuevo] = useState<DiaDisponibleForm[]>([]);
  const [guardandoCreacion, setGuardandoCreacion] = useState(false);

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [diasEdicion, setDiasEdicion] = useState<DiaDisponibleForm[]>([]);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  // NUEVO: mismo select en cascada provincia→municipio que ya usa
  // /admin/cobertura-practica, para elegir las zonas donde el chofer da
  // práctica (municipiosCubiertos).
  const [referencia, setReferencia] = useState<ProvinciaConMunicipios[]>([]);
  const [zonasNuevo, setZonasNuevo] = useState<ZonaCubierta[]>([]);
  const [provinciaZonaNueva, setProvinciaZonaNueva] = useState("");
  const [municipioZonaNueva, setMunicipioZonaNueva] = useState("");
  const [zonasEdicion, setZonasEdicion] = useState<ZonaCubierta[]>([]);
  const [provinciaZonaEdicion, setProvinciaZonaEdicion] = useState("");
  const [municipioZonaEdicion, setMunicipioZonaEdicion] = useState("");

  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  async function cargar() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/instructores`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setInstructores(json.data);
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos cargar los choferes." });
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    let cancelado = false;

    (async () => {
      try {
        const [resInstructores, resRef] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/instructores`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/ubicaciones/provincias-municipios`,
          ),
        ]);
        const json = await resInstructores.json();
        const jsonRef = await resRef.json();
        if (!cancelado) {
          if (json.success) setInstructores(json.data);
          if (jsonRef.success) setReferencia(jsonRef.data);
        }
      } catch {
        if (!cancelado) {
          setMensaje({ tipo: "error", texto: "No pudimos cargar los choferes." });
        }
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [token]);

  // NUEVO: municipios de la provincia elegida que todavía no están en la
  // lista de zonas — evita agregar la misma zona dos veces.
  function municipiosDisponiblesPara(
    provinciaElegida: string,
    zonasActuales: ZonaCubierta[],
  ) {
    const municipiosDeProvincia =
      referencia.find((p) => p.provincia === provinciaElegida)?.municipios ??
      [];
    return municipiosDeProvincia.filter(
      (m) =>
        !zonasActuales.some(
          (z) => z.provincia === provinciaElegida && z.municipio === m,
        ),
    );
  }

  function agregarZonaNueva() {
    if (!provinciaZonaNueva || !municipioZonaNueva) return;
    setZonasNuevo((prev) => [
      ...prev,
      { provincia: provinciaZonaNueva, municipio: municipioZonaNueva },
    ]);
    setMunicipioZonaNueva("");
  }

  function quitarZonaNueva(indice: number) {
    setZonasNuevo((prev) => prev.filter((_, i) => i !== indice));
  }

  function agregarZonaEdicion() {
    if (!provinciaZonaEdicion || !municipioZonaEdicion) return;
    setZonasEdicion((prev) => [
      ...prev,
      { provincia: provinciaZonaEdicion, municipio: municipioZonaEdicion },
    ]);
    setMunicipioZonaEdicion("");
  }

  function quitarZonaEdicion(indice: number) {
    setZonasEdicion((prev) => prev.filter((_, i) => i !== indice));
  }

  function agregarDiaNuevo() {
    setDiasNuevo((prev) => [...prev, { dia: "lunes", horaInicio: "", horaFin: "" }]);
  }

  function quitarDiaNuevo(indice: number) {
    setDiasNuevo((prev) => prev.filter((_, i) => i !== indice));
  }

  function actualizarDiaNuevo(indice: number, campo: keyof DiaDisponibleForm, valor: string) {
    setDiasNuevo((prev) =>
      prev.map((d, i) => (i === indice ? { ...d, [campo]: valor } : d)),
    );
  }

  function agregarDiaEdicion() {
    setDiasEdicion((prev) => [...prev, { dia: "lunes", horaInicio: "", horaFin: "" }]);
  }

  function quitarDiaEdicion(indice: number) {
    setDiasEdicion((prev) => prev.filter((_, i) => i !== indice));
  }

  function actualizarDiaEdicion(indice: number, campo: keyof DiaDisponibleForm, valor: string) {
    setDiasEdicion((prev) =>
      prev.map((d, i) => (i === indice ? { ...d, [campo]: valor } : d)),
    );
  }

  // FIX: valida que cada día tenga hora de inicio Y fin, y que el fin sea
  // después del inicio, antes de dejar guardar — antes no había ningún
  // control y se podía guardar un horario incompleto o invertido.
  function validarDias(dias: DiaDisponibleForm[]): string | null {
    for (const d of dias) {
      if (!d.horaInicio || !d.horaFin) {
        return "Cada día necesita hora de inicio y hora de fin.";
      }
      if (d.horaFin <= d.horaInicio) {
        return "La hora de fin debe ser después de la hora de inicio.";
      }
    }
    return null;
  }

  async function crearChofer(e: React.FormEvent) {
    e.preventDefault();

    const errorDias = validarDias(diasNuevo);
    if (errorDias) {
      setMensaje({ tipo: "error", texto: errorDias });
      return;
    }

    setGuardandoCreacion(true);
    setMensaje(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/conductor`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formCrear,
          diasDisponibles: diasNuevo.map((d) => ({
            dia: d.dia,
            horario: formAHorario(d.horaInicio, d.horaFin),
          })),
          municipiosCubiertos: zonasNuevo,
        }),
      });
      const json = await res.json();

      if (json.success) {
        setMensaje({ tipo: "ok", texto: "Chofer creado." });
        setCreando(false);
        setFormCrear(formularioCrearVacio());
        setDiasNuevo([]);
        setZonasNuevo([]);
        setProvinciaZonaNueva("");
        setMunicipioZonaNueva("");
        cargar();
      } else {
        setMensaje({ tipo: "error", texto: json.error || "No se pudo crear el chofer." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    } finally {
      setGuardandoCreacion(false);
    }
  }

  function abrirEdicion(instructor: Instructor) {
    setEditandoId(instructor._id);
    setDiasEdicion(
      instructor.diasDisponibles.map((d) => ({
        dia: d.dia,
        ...horarioAForm(d.horario),
      })),
    );
    setZonasEdicion(instructor.municipiosCubiertos || []);
    setProvinciaZonaEdicion("");
    setMunicipioZonaEdicion("");
    setMensaje(null);
  }

  async function guardarEdicion(e: React.FormEvent) {
    e.preventDefault();
    if (!editandoId) return;

    const errorDias = validarDias(diasEdicion);
    if (errorDias) {
      setMensaje({ tipo: "error", texto: errorDias });
      return;
    }

    setGuardandoEdicion(true);
    setMensaje(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/instructores/${editandoId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            diasDisponibles: diasEdicion.map((d) => ({
              dia: d.dia,
              horario: formAHorario(d.horaInicio, d.horaFin),
            })),
            municipiosCubiertos: zonasEdicion,
          }),
        },
      );
      const json = await res.json();

      if (json.success) {
        setMensaje({ tipo: "ok", texto: "Horarios y zonas actualizados." });
        setEditandoId(null);
        cargar();
      } else {
        setMensaje({ tipo: "error", texto: json.error || "No se pudo guardar." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    } finally {
      setGuardandoEdicion(false);
    }
  }

  async function toggleActivo(instructor: Instructor) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/instructores/${instructor._id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ activo: !instructor.activo }),
        },
      );
      const json = await res.json();
      if (json.success) {
        cargar();
      } else {
        setMensaje({ tipo: "error", texto: json.error || "No se pudo actualizar." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="font-display text-2xl font-bold text-brand-blue mb-1">
        Choferes
      </h2>
      <p className="text-sm text-neutral-text mb-6">
        Instructores de práctica — sus datos y horarios se muestran a las
        estudiantes cuando terminan la teoría.
      </p>

      {!creando && !editandoId && (
        <button
          onClick={() => setCreando(true)}
          className="mb-6 rounded-lg bg-brand-pink text-white text-sm px-4 py-2 font-medium hover:opacity-90"
        >
          + Agregar chofer
        </button>
      )}

      {creando && (
        <form onSubmit={crearChofer} className="grid gap-4 mb-8 rounded-xl bg-white border border-neutral-bg p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-brand-blue">Nuevo chofer</h3>
            <button
              type="button"
              onClick={() => {
                setCreando(false);
                setFormCrear(formularioCrearVacio());
                setDiasNuevo([]);
                setZonasNuevo([]);
                setProvinciaZonaNueva("");
                setMunicipioZonaNueva("");
              }}
              className="text-xs text-brand-blue-light hover:underline"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-neutral-text">
              Nombre
              <input
                type="text"
                required
                value={formCrear.nombre}
                onChange={(e) => setFormCrear((p) => ({ ...p, nombre: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm text-neutral-text">
              Apellido
              <input
                type="text"
                required
                value={formCrear.apellido}
                onChange={(e) => setFormCrear((p) => ({ ...p, apellido: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm text-neutral-text">
              Cédula
              <input
                type="text"
                required
                value={formCrear.cedula}
                onChange={(e) => setFormCrear((p) => ({ ...p, cedula: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm text-neutral-text">
              Teléfono
              <input
                type="text"
                required
                value={formCrear.telefono}
                onChange={(e) => setFormCrear((p) => ({ ...p, telefono: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm text-neutral-text col-span-2">
              Correo
              <input
                type="email"
                required
                value={formCrear.email}
                onChange={(e) => setFormCrear((p) => ({ ...p, email: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm text-neutral-text col-span-2">
              Contraseña
              <input
                type="password"
                required
                value={formCrear.password}
                onChange={(e) => setFormCrear((p) => ({ ...p, password: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm text-neutral-text">
              Provincia
              <input
                type="text"
                required
                value={formCrear.provincia}
                onChange={(e) => setFormCrear((p) => ({ ...p, provincia: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm text-neutral-text">
              Fecha de nacimiento
              <input
                type="date"
                required
                value={formCrear.fechaNacimiento}
                onChange={(e) => setFormCrear((p) => ({ ...p, fechaNacimiento: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-neutral-bg px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div>
            <p className="text-sm text-neutral-text mb-2">Días y horarios de práctica</p>
            <div className="grid gap-2">
              {diasNuevo.map((d, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select
                    value={d.dia}
                    onChange={(e) => actualizarDiaNuevo(i, "dia", e.target.value)}
                    className="rounded-lg border border-neutral-bg px-2 py-1.5 text-sm"
                  >
                    {DIAS.map((opcion) => (
                      <option key={opcion.valor} value={opcion.valor}>
                        {opcion.etiqueta}
                      </option>
                    ))}
                  </select>
                  <input
                    type="time"
                    required
                    value={d.horaInicio}
                    onChange={(e) => actualizarDiaNuevo(i, "horaInicio", e.target.value)}
                    className="rounded-lg border border-neutral-bg px-3 py-1.5 text-sm"
                  />
                  <span className="text-xs text-neutral-text">a</span>
                  <input
                    type="time"
                    required
                    value={d.horaFin}
                    onChange={(e) => actualizarDiaNuevo(i, "horaFin", e.target.value)}
                    className="rounded-lg border border-neutral-bg px-3 py-1.5 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => quitarDiaNuevo(i)}
                    className="text-xs text-brand-pink px-2"
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={agregarDiaNuevo}
              className="mt-2 text-xs font-medium text-brand-blue-light hover:underline"
            >
              + Agregar día
            </button>
          </div>

          <div>
            <p className="text-sm text-neutral-text mb-2">
              Zonas donde da práctica
            </p>
            <p className="text-xs text-neutral-text mb-2">
              Municipio(s) donde este chofer realmente da la práctica
              presencial — no tiene que ser su provincia personal. Esto es
              lo que lo conecta con /admin/cobertura-practica.
            </p>
            {zonasNuevo.length > 0 && (
              <div className="grid gap-1 mb-2">
                {zonasNuevo.map((z, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-neutral-bg px-3 py-1.5 text-sm"
                  >
                    <span>
                      {z.municipio}, {z.provincia}
                    </span>
                    <button
                      type="button"
                      onClick={() => quitarZonaNueva(i)}
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
                value={provinciaZonaNueva}
                onChange={(e) => {
                  setProvinciaZonaNueva(e.target.value);
                  setMunicipioZonaNueva("");
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
                value={municipioZonaNueva}
                onChange={(e) => setMunicipioZonaNueva(e.target.value)}
                disabled={!provinciaZonaNueva}
                className="flex-1 rounded-lg border border-neutral-bg px-3 py-2 text-sm bg-white disabled:opacity-60"
              >
                <option value="">
                  {provinciaZonaNueva ? "Municipio" : "Elige provincia"}
                </option>
                {municipiosDisponiblesPara(provinciaZonaNueva, zonasNuevo).map(
                  (m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ),
                )}
              </select>
              <button
                type="button"
                onClick={agregarZonaNueva}
                disabled={!provinciaZonaNueva || !municipioZonaNueva}
                className="rounded-lg bg-brand-blue-light text-white text-sm px-3 disabled:opacity-50"
              >
                + Agregar
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={guardandoCreacion}
            className="rounded-xl bg-brand-blue text-white p-4 font-display font-semibold hover:opacity-90 disabled:opacity-60"
          >
            {guardandoCreacion ? "Creando..." : "Crear chofer"}
          </button>
        </form>
      )}

      {cargando && <p className="text-sm text-neutral-text">Cargando...</p>}

      {!cargando && instructores.length === 0 && (
        <p className="text-sm text-neutral-text">Todavía no hay choferes registrados.</p>
      )}

      <div className="grid gap-3">
        {instructores.map((instructor) => (
          <div key={instructor._id} className="rounded-lg bg-white border border-neutral-bg p-4">
            {editandoId === instructor._id ? (
              <form onSubmit={guardarEdicion} className="grid gap-3">
                <p className="font-medium text-brand-blue text-sm">
                  {instructor.userId.nombre} {instructor.userId.apellido} — editar horarios y zonas
                </p>
                <div className="grid gap-2">
                  {diasEdicion.map((d, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <select
                        value={d.dia}
                        onChange={(e) => actualizarDiaEdicion(i, "dia", e.target.value)}
                        className="rounded-lg border border-neutral-bg px-2 py-1.5 text-sm"
                      >
                        {DIAS.map((opcion) => (
                          <option key={opcion.valor} value={opcion.valor}>
                            {opcion.etiqueta}
                          </option>
                        ))}
                      </select>
                      <input
                        type="time"
                        required
                        value={d.horaInicio}
                        onChange={(e) => actualizarDiaEdicion(i, "horaInicio", e.target.value)}
                        className="rounded-lg border border-neutral-bg px-3 py-1.5 text-sm"
                      />
                      <span className="text-xs text-neutral-text">a</span>
                      <input
                        type="time"
                        required
                        value={d.horaFin}
                        onChange={(e) => actualizarDiaEdicion(i, "horaFin", e.target.value)}
                        className="rounded-lg border border-neutral-bg px-3 py-1.5 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => quitarDiaEdicion(i)}
                        className="text-xs text-brand-pink px-2"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={agregarDiaEdicion}
                  className="text-xs font-medium text-brand-blue-light hover:underline text-left"
                >
                  + Agregar día
                </button>

                <div>
                  <p className="text-sm text-neutral-text mb-2">
                    Zonas donde da práctica
                  </p>
                  {zonasEdicion.length > 0 && (
                    <div className="grid gap-1 mb-2">
                      {zonasEdicion.map((z, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-lg bg-neutral-bg px-3 py-1.5 text-sm"
                        >
                          <span>
                            {z.municipio}, {z.provincia}
                          </span>
                          <button
                            type="button"
                            onClick={() => quitarZonaEdicion(i)}
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
                      value={provinciaZonaEdicion}
                      onChange={(e) => {
                        setProvinciaZonaEdicion(e.target.value);
                        setMunicipioZonaEdicion("");
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
                      value={municipioZonaEdicion}
                      onChange={(e) => setMunicipioZonaEdicion(e.target.value)}
                      disabled={!provinciaZonaEdicion}
                      className="flex-1 rounded-lg border border-neutral-bg px-3 py-2 text-sm bg-white disabled:opacity-60"
                    >
                      <option value="">
                        {provinciaZonaEdicion ? "Municipio" : "Elige provincia"}
                      </option>
                      {municipiosDisponiblesPara(
                        provinciaZonaEdicion,
                        zonasEdicion,
                      ).map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={agregarZonaEdicion}
                      disabled={!provinciaZonaEdicion || !municipioZonaEdicion}
                      className="rounded-lg bg-brand-blue-light text-white text-sm px-3 disabled:opacity-50"
                    >
                      + Agregar
                    </button>
                  </div>
                  <p className="text-xs text-neutral-text mt-2">
                    Si quitas la única zona activa que cubre un municipio (o
                    desactivas este chofer), ese municipio se desactiva
                    también en /admin/cobertura-practica.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={guardandoEdicion}
                    className="text-xs font-medium px-4 py-2 rounded-full bg-brand-blue text-white hover:opacity-90 disabled:opacity-60"
                  >
                    {guardandoEdicion ? "Guardando..." : "Guardar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditandoId(null)}
                    className="text-xs font-medium px-4 py-2 rounded-full bg-neutral-bg text-neutral-text"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-brand-blue text-sm">
                      {instructor.userId.nombre} {instructor.userId.apellido}
                    </p>
                    {!instructor.activo && (
                      <span className="text-[10px] text-neutral-text">(inactivo)</span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-text">
                    {instructor.userId.telefono} · {instructor.userId.email}
                  </p>
                  {instructor.diasDisponibles.length > 0 && (
                    <p className="text-xs text-neutral-text mt-1">
                      {instructor.diasDisponibles
                        .map((d) => `${d.dia} ${d.horario}`)
                        .join(" · ")}
                    </p>
                  )}
                  {instructor.municipiosCubiertos?.length > 0 ? (
                    <p className="text-xs text-brand-blue-light mt-1">
                      Zonas:{" "}
                      {instructor.municipiosCubiertos
                        .map((z) => `${z.municipio}, ${z.provincia}`)
                        .join(" · ")}
                    </p>
                  ) : (
                    <p className="text-xs text-brand-pink mt-1">
                      Sin zonas de práctica asignadas
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => toggleActivo(instructor)}
                    className="text-xs font-medium px-3 py-1.5 rounded-full bg-neutral-bg text-neutral-text hover:bg-brand-pink-light"
                  >
                    {instructor.activo ? "Desactivar" : "Activar"}
                  </button>
                  <button
                    onClick={() => abrirEdicion(instructor)}
                    className="text-xs font-medium px-3 py-1.5 rounded-full bg-brand-blue-light text-white hover:opacity-90"
                  >
                    Editar horarios y zonas
                  </button>
                </div>
              </div>
            )}
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