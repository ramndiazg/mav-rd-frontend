"use client";

import { useState } from "react";
import RutaProtegida from "@/components/auth/RutaProtegida";
import { useAuth } from "@/contexts/AuthContext";

function CambiarPasswordContenido() {
  const { token } = useAuth();

  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [confirmarNueva, setConfirmarNueva] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  async function manejarSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMensaje(null);

    if (passwordNueva.length < 8) {
      setMensaje({ tipo: "error", texto: "La nueva contraseña debe tener al menos 8 caracteres." });
      return;
    }
    if (passwordNueva !== confirmarNueva) {
      setMensaje({ tipo: "error", texto: "Las contraseñas nuevas no coinciden." });
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/cambiar-password`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ passwordActual, passwordNueva }),
        },
      );
      const json = await res.json();

      if (json.success) {
        setMensaje({ tipo: "ok", texto: "Contraseña actualizada correctamente." });
        setPasswordActual("");
        setPasswordNueva("");
        setConfirmarNueva("");
      } else {
        setMensaje({ tipo: "error", texto: json.error || "No se pudo cambiar la contraseña." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No pudimos conectar con el servidor." });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="bg-neutral-bg min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm bg-white rounded-xl p-8">
        <h1 className="font-display text-2xl font-bold text-brand-blue mb-1 text-center">
          Cambiar contraseña
        </h1>
        <p className="text-sm text-neutral-text text-center mb-8">
          Escribe tu contraseña actual y la nueva que quieres usar.
        </p>

        <form onSubmit={manejarSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-neutral-text mb-1">
              Contraseña actual
            </label>
            <input
              type="password"
              required
              value={passwordActual}
              onChange={(e) => setPasswordActual(e.target.value)}
              className="w-full rounded-lg border border-neutral-bg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-text mb-1">
              Contraseña nueva
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={passwordNueva}
              onChange={(e) => setPasswordNueva(e.target.value)}
              className="w-full rounded-lg border border-neutral-bg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
            <p className="text-xs text-neutral-text mt-1">Mínimo 8 caracteres.</p>
          </div>

          <div>
            <label className="block text-sm text-neutral-text mb-1">
              Confirmar contraseña nueva
            </label>
            <input
              type="password"
              required
              value={confirmarNueva}
              onChange={(e) => setConfirmarNueva(e.target.value)}
              className="w-full rounded-lg border border-neutral-bg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          {mensaje && (
            <p
              className={`text-sm ${mensaje.tipo === "ok" ? "text-status-success" : "text-brand-pink"
                }`}
            >
              {mensaje.texto}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="mt-2 bg-brand-pink text-white py-2.5 rounded-full font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {enviando ? "Guardando..." : "Cambiar contraseña"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function CambiarPasswordPage() {
  return (
    <RutaProtegida rolesPermitidos={["estudiante", "coordinadora", "admin"]}>
      <CambiarPasswordContenido />
    </RutaProtegida>
  );
}