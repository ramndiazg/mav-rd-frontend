"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Link from "next/link";

function RestablecerPasswordContenido() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState("");

  async function manejarSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Falta el token del link de recuperación.");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/restablecer-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, passwordNueva: password }),
        },
      );
      const json = await res.json();

      if (json.success) {
        setExito(true);
      } else {
        setError(json.error || "No se pudo restablecer la contraseña.");
      }
    } catch {
      setError("No pudimos conectar con el servidor.");
    } finally {
      setEnviando(false);
    }
  }

  if (exito) {
    return (
      <div className="w-full max-w-sm bg-white rounded-xl p-8 text-center">
        <p className="font-display font-semibold text-brand-blue text-lg mb-2">
          Contraseña actualizada
        </p>
        <p className="text-sm text-neutral-text mb-6">
          Ya puedes iniciar sesión con tu nueva contraseña.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="inline-block rounded-full bg-brand-blue text-white px-6 py-3 font-medium hover:opacity-90"
        >
          Ir a iniciar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm bg-white rounded-xl p-8">
      <h1 className="font-display text-2xl font-bold text-brand-blue mb-1 text-center">
        Nueva contraseña
      </h1>
      <p className="text-sm text-neutral-text text-center mb-8">
        Elige una contraseña nueva para tu cuenta.
      </p>

      <form onSubmit={manejarSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm text-neutral-text mb-1">
            Contraseña nueva
          </label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-neutral-bg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-text mb-1">
            Confirmar contraseña
          </label>
          <input
            type="password"
            required
            minLength={8}
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            className="w-full rounded-lg border border-neutral-bg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>

        {error && <p className="text-sm text-brand-pink">{error}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="mt-2 bg-brand-pink text-white py-2.5 rounded-full font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {enviando ? "Guardando..." : "Restablecer contraseña"}
        </button>
      </form>

      <p className="text-sm text-neutral-text text-center mt-6">
        <Link href="/login" className="text-brand-pink underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </div>
  );
}

export default function RestablecerPasswordPage() {
  return (
    <main className="bg-neutral-bg min-h-screen flex items-center justify-center px-6 py-16">
      <Suspense
        fallback={
          <div className="w-full max-w-sm bg-white rounded-xl p-8 text-center">
            <p className="text-sm text-neutral-text">Cargando...</p>
          </div>
        }
      >
        <RestablecerPasswordContenido />
      </Suspense>
    </main>
  );
}