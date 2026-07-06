"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function manejarSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setEnviando(true);

    const resultado = await login(email, password);

    setEnviando(false);

    if (!resultado.ok) {
      setError(resultado.error || "No se pudo iniciar sesion.");
      return;
    }

    // Cada rol tiene su propio punto de entrada — antes esto siempre
    // mandaba a /dashboard, que solo existe para estudiante.
    if (resultado.rol === "coordinadora" || resultado.rol === "admin") {
      router.push("/panel/pagos");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <main className="bg-neutral-bg min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm bg-white rounded-xl p-8">
        <h1 className="font-display text-2xl font-bold text-brand-blue mb-1 text-center">
          Iniciar sesion
        </h1>
        <p className="text-sm text-neutral-text text-center mb-8">
          Ingresa con tu correo y contrasena.
        </p>

        <form onSubmit={manejarSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-neutral-text mb-1">
              Correo
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-neutral-bg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-text mb-1">
              Contrasena
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-neutral-bg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          {error && <p className="text-sm text-brand-pink">{error}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="mt-2 bg-brand-pink text-white py-2.5 rounded-full font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {enviando ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="text-sm text-neutral-text text-center mt-6">
          No tienes cuenta?{" "}
          <Link href="/registro" className="text-brand-pink underline">
            Registrate
          </Link>
        </p>
      </div>
    </main>
  );
}
