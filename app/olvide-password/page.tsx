"use client";

import { useState } from "react";
import Link from "next/link";

export default function OlvidePasswordPage() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");

  async function manejarSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setEnviando(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/olvide-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );
      const json = await res.json();

      if (json.success) {
        setEnviado(true);
      } else {
        setError(json.error || "No se pudo procesar la solicitud.");
      }
    } catch {
      setError("No pudimos conectar con el servidor.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="bg-neutral-bg min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm bg-white rounded-xl p-8">
        <h1 className="font-display text-2xl font-bold text-brand-blue mb-1 text-center">
          Recuperar contraseña
        </h1>

        {!enviado ? (
          <>
            <p className="text-sm text-neutral-text text-center mb-8">
              Escribe tu correo y te enviamos un link para restablecerla.
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

              {error && <p className="text-sm text-brand-pink">{error}</p>}

              <button
                type="submit"
                disabled={enviando}
                className="mt-2 bg-brand-pink text-white py-2.5 rounded-full font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {enviando ? "Enviando..." : "Enviar link de recuperación"}
              </button>
            </form>
          </>
        ) : (
          <p className="text-sm text-neutral-text text-center mt-4">
            Si ese correo está registrado, te enviamos un link para
            restablecer tu contraseña. Revisa tu bandeja de entrada.
          </p>
        )}

        <p className="text-sm text-neutral-text text-center mt-6">
          <Link href="/login" className="text-brand-pink underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  );
}