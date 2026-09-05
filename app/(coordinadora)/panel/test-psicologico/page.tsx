
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  ESCALA_LIKERT,
  SECCIONES,
  PREGUNTAS_REFLEXION,
} from "@/lib/bancoPreguntasTest";

type ItemLista = {
  _id: string;
  userId: { _id: string; nombre: string; apellido: string; cedula: string; email: string };
  createdAt: string;
};

type Detalle = {
  test: { respuestas: number[]; reflexiones: string[]; createdAt: string };
  estudiante: { nombre: string; apellido: string; cedula: string; email: string };
};

function etiquetaDeValor(valor: number) {
  return ESCALA_LIKERT.find((e) => e.valor === valor)?.etiqueta || valor;
}

export default function PanelTestPsicologicoPage() {
  const { token } = useAuth();
  const [lista, setLista] = useState<ItemLista[]>([]);
  const [cargando, setCargando] = useState(true);
  const [userIdAbierto, setUserIdAbierto] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<Detalle | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/test-psicologico`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) setLista(json.data);
      } finally {
        setCargando(false);
      }
    })();
  }, [token]);

  async function alternarDetalle(userId: string) {
    if (userIdAbierto === userId) {
      setUserIdAbierto(null);
      setDetalle(null);
      return;
    }

    setUserIdAbierto(userId);
    setCargandoDetalle(true);
    setDetalle(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/test-psicologico/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();
      if (json.success) setDetalle(json.data);
    } finally {
      setCargandoDetalle(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="font-display text-2xl font-bold text-brand-blue mb-1">
        Cuestionario de perfil conductual
      </h2>
      <p className="text-sm text-neutral-text mb-6">
        Respuestas tal como las completó cada estudiante — sin ningún
        puntaje calculado por el sistema.
      </p>

      {cargando && <p className="text-sm text-neutral-text">Cargando...</p>}

      {!cargando && lista.length === 0 && (
        <p className="text-sm text-neutral-text">
          Todavía ninguna estudiante ha completado el cuestionario.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {lista.map((item) => (
          <div key={item._id} className="rounded-xl bg-white border border-neutral-bg overflow-hidden">
            <button
              onClick={() => alternarDetalle(item.userId._id)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-bg/50"
            >
              <div>
                <p className="font-display font-semibold text-brand-blue">
                  {item.userId.nombre} {item.userId.apellido}
                </p>
                <p className="text-xs text-neutral-text">
                  {item.userId.cedula} — {item.userId.email}
                </p>
              </div>
              <span className="text-xs text-neutral-text">
                {new Date(item.createdAt).toLocaleDateString("es-DO")}
              </span>
            </button>

            {userIdAbierto === item.userId._id && (
              <div className="border-t border-neutral-bg p-4">
                {cargandoDetalle && (
                  <p className="text-sm text-neutral-text">Cargando respuestas...</p>
                )}

                {detalle && (
                  <div className="flex flex-col gap-6">
                    {SECCIONES.map((seccion, indiceSeccion) => {
                      const offset = SECCIONES.slice(0, indiceSeccion).reduce(
                        (acc, s) => acc + s.preguntas.length,
                        0,
                      );
                      return (
                        <div key={seccion.clave}>
                          <p className="text-sm font-semibold text-brand-blue mb-2">
                            {seccion.clave}. {seccion.titulo}
                          </p>
                          <div className="flex flex-col gap-1">
                            {seccion.preguntas.map((texto, i) => (
                              <div
                                key={i}
                                className="flex justify-between gap-4 text-sm py-1 border-b border-neutral-bg last:border-0"
                              >
                                <span className="text-neutral-text">{texto}</span>
                                <span className="font-medium text-brand-blue whitespace-nowrap">
                                  {etiquetaDeValor(detalle.test.respuestas[offset + i])}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    <div>
                      <p className="text-sm font-semibold text-brand-blue mb-2">
                        H. Preguntas de reflexión
                      </p>
                      <div className="flex flex-col gap-3">
                        {PREGUNTAS_REFLEXION.map((pregunta, i) => (
                          <div key={i}>
                            <p className="text-sm text-neutral-text">{pregunta}</p>
                            <p className="text-sm text-brand-blue mt-1">
                              {detalle.test.reflexiones[i] || (
                                <span className="italic text-neutral-text/60">
                                  Sin respuesta
                                </span>
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}