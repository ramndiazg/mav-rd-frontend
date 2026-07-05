"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";

// Lee el token de localStorage sin el warning "set-state-in-effect".
// Ademas queda suscrito: si el token cambia en otra pestana, se actualiza.
// TODO: cuando exista AuthContext, esto se puede reemplazar por el token
// que venga directo del contexto.
function suscribirse(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function obtenerSnapshot() {
  return window.localStorage.getItem("token");
}

function obtenerSnapshotServidor() {
  return null;
}

function useToken() {
  return useSyncExternalStore(suscribirse, obtenerSnapshot, obtenerSnapshotServidor);
}

type Comentario = {
  _id: string;
  userId?: { _id: string; nombre: string; apellido: string };
  texto: string;
  fecha: string;
};

export default function NoticiaAcciones({
  noticiaId,
  totalLikesInicial,
  comentariosIniciales,
}: {
  noticiaId: string;
  totalLikesInicial: number;
  comentariosIniciales: Comentario[];
}) {
  const token = useToken();
  const [totalLikes, setTotalLikes] = useState(totalLikesInicial);
  const [leDioLike, setLeDioLike] = useState(false);
  const [comentarios, setComentarios] = useState(comentariosIniciales);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [errorLike, setErrorLike] = useState("");
  const [errorComentario, setErrorComentario] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  async function manejarLike() {
    if (!token) return;
    setErrorLike("");
    try {
      const res = await fetch(`${apiUrl}/noticias/${noticiaId}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!json.success) {
        setErrorLike(json.error || "No se pudo procesar el like.");
        return;
      }
      setTotalLikes(json.data.totalLikes);
      setLeDioLike(json.data.leDioLike);
    } catch {
      setErrorLike("No se pudo conectar con el servidor.");
    }
  }

  async function manejarComentario(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !texto.trim()) return;
    setEnviando(true);
    setErrorComentario("");
    try {
      const res = await fetch(`${apiUrl}/noticias/${noticiaId}/comentarios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ texto: texto.trim() }),
      });
      const json = await res.json();
      if (!json.success) {
        setErrorComentario(json.error || "No se pudo publicar el comentario.");
        return;
      }
      setComentarios((prev) => [...prev, json.data]);
      setTexto("");
    } catch {
      setErrorComentario("No se pudo conectar con el servidor.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={manejarLike}
          disabled={!token}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${leDioLike
            ? "bg-brand-pink text-white"
            : "bg-brand-pinkLight text-brand-blue hover:bg-brand-pink hover:text-white"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Me gusta ({totalLikes})
        </button>
        {!token && (
          <span className="text-xs text-neutral-text">
            <Link href="/login" className="text-brand-pink underline">
              Inicia sesion
            </Link>{" "}
            para dar like o comentar
          </span>
        )}
      </div>
      {errorLike && <p className="text-sm text-brand-pink mb-4">{errorLike}</p>}

      <h3 className="font-display font-semibold text-brand-blue mb-4">
        Comentarios ({comentarios.length})
      </h3>

      <div className="space-y-4 mb-6">
        {comentarios.length === 0 && (
          <p className="text-sm text-neutral-text">Se la primera en comentar.</p>
        )}
        {comentarios.map((c) => (
          <div key={c._id} className="bg-neutral-bg rounded-lg p-4">
            <p className="text-sm font-medium text-brand-blue mb-1">
              {c.userId ? `${c.userId.nombre} ${c.userId.apellido}` : "Usuaria"}
            </p>
            <p className="text-sm text-neutral-text">{c.texto}</p>
          </div>
        ))}
      </div>

      {token && (
        <form onSubmit={manejarComentario} className="flex flex-col gap-3">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribe un comentario..."
            rows={3}
            className="rounded-lg border border-neutral-bg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
          {errorComentario && (
            <p className="text-sm text-brand-pink">{errorComentario}</p>
          )}
          <button
            type="submit"
            disabled={enviando || !texto.trim()}
            className="self-start bg-brand-blue text-white px-5 py-2 rounded-full text-sm font-medium disabled:opacity-50"
          >
            {enviando ? "Publicando..." : "Publicar comentario"}
          </button>
        </form>
      )}
    </div>
  );
}
