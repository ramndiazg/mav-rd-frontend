"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

const PROVINCIAS = [
  "Azua",
  "Bahoruco",
  "Barahona",
  "Dajabon",
  "Distrito Nacional",
  "Duarte",
  "Elias Pina",
  "El Seibo",
  "Espaillat",
  "Hato Mayor",
  "Hermanas Mirabal",
  "Independencia",
  "La Altagracia",
  "La Romana",
  "La Vega",
  "Maria Trinidad Sanchez",
  "Monsenor Nouel",
  "Monte Cristi",
  "Monte Plata",
  "Pedernales",
  "Peravia",
  "Puerto Plata",
  "Samana",
  "San Cristobal",
  "San Jose de Ocoa",
  "San Juan",
  "San Pedro de Macoris",
  "Sanchez Ramirez",
  "Santiago",
  "Santiago Rodriguez",
  "Santo Domingo",
  "Valverde",
];

type FormularioRegistro = {
  nombre: string;
  apellido: string;
  cedula: string;
  telefono: string;
  email: string;
  password: string;
  provincia: string;
  fechaNacimiento: string;
};

const FORM_INICIAL: FormularioRegistro = {
  nombre: "",
  apellido: "",
  cedula: "",
  telefono: "",
  email: "",
  password: "",
  provincia: "",
  fechaNacimiento: "",
};

export default function RegistroPage() {
  const { registro } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState<FormularioRegistro>(FORM_INICIAL);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  function actualizar(campo: keyof FormularioRegistro, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function manejarSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setEnviando(true);

    const resultado = await registro(form);

    setEnviando(false);

    if (!resultado.ok) {
      setError(resultado.error || "No se pudo crear la cuenta.");
      return;
    }

    if (resultado.autoLogueado) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }

  return (
    <main className="bg-neutral-bg min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md bg-white rounded-xl p-8">
        <h1 className="font-display text-2xl font-bold text-brand-blue mb-1 text-center">
          Crear cuenta
        </h1>
        <p className="text-sm text-neutral-text text-center mb-8">
          Registrate para inscribirte en el curso.
        </p>

        <form onSubmit={manejarSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-neutral-text mb-1">
                Nombre
              </label>
              <input
                required
                value={form.nombre}
                onChange={(e) => actualizar("nombre", e.target.value)}
                className="w-full rounded-lg border border-neutral-bg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-text mb-1">
                Apellido
              </label>
              <input
                required
                value={form.apellido}
                onChange={(e) => actualizar("apellido", e.target.value)}
                className="w-full rounded-lg border border-neutral-bg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-neutral-text mb-1">
              Cedula
            </label>
            <input
              required
              placeholder="000-0000000-0"
              value={form.cedula}
              onChange={(e) => actualizar("cedula", e.target.value)}
              className="w-full rounded-lg border border-neutral-bg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-text mb-1">
              Telefono
            </label>
            <input
              required
              type="tel"
              value={form.telefono}
              onChange={(e) => actualizar("telefono", e.target.value)}
              className="w-full rounded-lg border border-neutral-bg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-text mb-1">
              Correo
            </label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => actualizar("email", e.target.value)}
              className="w-full rounded-lg border border-neutral-bg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-text mb-1">
              Contrasena
            </label>
            <input
              required
              type="password"
              minLength={8}
              value={form.password}
              onChange={(e) => actualizar("password", e.target.value)}
              className="w-full rounded-lg border border-neutral-bg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-text mb-1">
              Provincia
            </label>
            <select
              required
              value={form.provincia}
              onChange={(e) => actualizar("provincia", e.target.value)}
              className="w-full rounded-lg border border-neutral-bg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              <option value="" disabled>
                Selecciona tu provincia
              </option>
              {PROVINCIAS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-neutral-text mb-1">
              Fecha de nacimiento
            </label>
            <input
              required
              type="date"
              value={form.fechaNacimiento}
              onChange={(e) => actualizar("fechaNacimiento", e.target.value)}
              className="w-full rounded-lg border border-neutral-bg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          {error && <p className="text-sm text-brand-pink">{error}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="mt-2 bg-brand-pink text-white py-2.5 rounded-full font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {enviando ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p className="text-sm text-neutral-text text-center mt-6">
          Ya tienes cuenta?{" "}
          <Link href="/login" className="text-brand-pink underline">
            Inicia sesion
          </Link>
        </p>
      </div>
    </main>
  );
}
