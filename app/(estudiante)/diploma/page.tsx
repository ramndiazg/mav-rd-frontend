"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import RutaProtegida from "@/components/auth/RutaProtegida";
import { useAuth } from "@/contexts/AuthContext";
import { Share2 } from "lucide-react";

type Diploma = {
  codigoVerificacion: string;
  fechaEmision: string;
  urlPDF: string;
};

// Formato vertical tipo "historia" (9:16) — pensado para compartir desde
// celular a WhatsApp Status / Instagram Stories, que es lo más común entre
// las estudiantes. También se ve razonable como post normal si alguien
// prefiere eso.
const ANCHO_IMAGEN = 1080;
const ALTO_IMAGEN = 1920;

function DiplomaContenido() {
  const { token, usuario } = useAuth();
  const [diploma, setDiploma] = useState<Diploma | null>(null);
  const [cargando, setCargando] = useState(true);
  const [aunNoExiste, setAunNoExiste] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generandoImagen, setGenerandoImagen] = useState(false);
  const [errorCompartir, setErrorCompartir] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/diplomas/me`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const json = await res.json();
        if (cancelado) return;

        if (json.success) {
          setDiploma(json.data);
        } else if (res.status === 404) {
          setAunNoExiste(true);
        } else {
          setError(json.error || "No pudimos cargar tu diploma.");
        }
      } catch {
        if (!cancelado) setError("No pudimos conectar con el servidor.");
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [token]);

  const fechaFormateada = diploma
    ? new Date(diploma.fechaEmision).toLocaleDateString("es-DO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    : "";

  const nombreCompleto = usuario ? `${usuario.nombre} ${usuario.apellido}` : "";

  // Ícono de volante dibujado a mano con arcos/líneas — evita depender de
  // cargar un SVG/imagen externa dentro del canvas (más simple y sin
  // problemas de CORS al exportar a blob).
  function dibujarVolante(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radio: number,
  ) {
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = radio * 0.09;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.arc(cx, cy, radio, 0, Math.PI * 2);
    ctx.stroke();

    const radioCentro = radio * 0.22;
    ctx.beginPath();
    ctx.arc(cx, cy, radioCentro, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 3; i++) {
      const angulo = (Math.PI * 2 * i) / 3 - Math.PI / 2;
      const xInicio = cx + Math.cos(angulo) * radioCentro;
      const yInicio = cy + Math.sin(angulo) * radioCentro;
      const xFin = cx + Math.cos(angulo) * radio;
      const yFin = cy + Math.sin(angulo) * radio;
      ctx.beginPath();
      ctx.moveTo(xInicio, yInicio);
      ctx.lineTo(xFin, yFin);
      ctx.stroke();
    }
  }

  // Envuelve texto largo (ej. nombres compuestos) en varias líneas
  // centradas, respetando un ancho máximo.
  function envolverTexto(
    ctx: CanvasRenderingContext2D,
    texto: string,
    cx: number,
    y: number,
    anchoMax: number,
    alturaLinea: number,
  ) {
    const palabras = texto.split(" ");
    let linea = "";
    const lineas: string[] = [];

    for (const palabra of palabras) {
      const pruebaLinea = linea ? `${linea} ${palabra}` : palabra;
      if (ctx.measureText(pruebaLinea).width > anchoMax && linea) {
        lineas.push(linea);
        linea = palabra;
      } else {
        linea = pruebaLinea;
      }
    }
    if (linea) lineas.push(linea);

    lineas.forEach((l, i) => {
      ctx.fillText(l, cx, y + i * alturaLinea);
    });
  }

  async function generarImagen(): Promise<Blob | null> {
    const canvas = canvasRef.current;
    if (!canvas || !diploma) return null;

    canvas.width = ANCHO_IMAGEN;
    canvas.height = ALTO_IMAGEN;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const cx = ANCHO_IMAGEN / 2;

    // Fondo degradado azul marca
    const degradado = ctx.createLinearGradient(0, 0, 0, ALTO_IMAGEN);
    degradado.addColorStop(0, "#1B3A6B");
    degradado.addColorStop(1, "#122A4E");
    ctx.fillStyle = degradado;
    ctx.fillRect(0, 0, ANCHO_IMAGEN, ALTO_IMAGEN);

    // Marco decorativo sutil
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 4;
    ctx.strokeRect(48, 48, ANCHO_IMAGEN - 96, ALTO_IMAGEN - 96);

    ctx.textAlign = "center";

    // "MUVO RD VIAL" arriba
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "600 42px Poppins, sans-serif";
    ctx.fillText("MUVO RD VIAL", cx, 220);

    // Ícono de volante
    dibujarVolante(ctx, cx, 420, 130);

    // "completó el curso..."
    ctx.font = "400 34px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText("completó el curso de educación vial", cx, 660);

    // Nombre grande al centro
    ctx.font = "700 72px Poppins, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    envolverTexto(ctx, nombreCompleto.toUpperCase(), cx, 800, ANCHO_IMAGEN - 160, 88);

    // Línea rosa decorativa
    ctx.strokeStyle = "#D6336C";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(cx - 80, 1020);
    ctx.lineTo(cx + 80, 1020);
    ctx.stroke();

    // Código + fecha abajo, en chico
    ctx.font = "400 28px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillText("Código de verificación", cx, ALTO_IMAGEN - 260);

    ctx.font = "600 34px monospace";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(diploma.codigoVerificacion, cx, ALTO_IMAGEN - 210);

    ctx.font = "400 28px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillText(fechaFormateada, cx, ALTO_IMAGEN - 150);

    ctx.font = "400 24px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText("Verifica este diploma en muvo-rd.vercel.app", cx, ALTO_IMAGEN - 90);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png", 1);
    });
  }

  async function compartirLogro() {
    setErrorCompartir(null);
    setGenerandoImagen(true);

    try {
      const blob = await generarImagen();
      if (!blob) {
        setErrorCompartir("No pudimos generar la imagen. Intenta de nuevo.");
        return;
      }

      const archivo = new File([blob], "mi-logro-muvo-rd.png", {
        type: "image/png",
      });
      const mensaje =
        "Comparte tu logro y anima a otra mujer a manejar con confianza.";

      const puedeCompartirArchivo =
        typeof navigator !== "undefined" &&
        !!navigator.share &&
        !!navigator.canShare &&
        navigator.canShare({ files: [archivo] });

      if (puedeCompartirArchivo) {
        await navigator.share({
          files: [archivo],
          title: "Mi logro en Muvo RD Vial",
          text: mensaje,
        });
      } else {
        // Fallback: descarga directa de la imagen si el navegador no
        // soporta compartir archivos (ej. la mayoría de navegadores de
        // escritorio).
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement("a");
        enlace.href = url;
        enlace.download = "mi-logro-muvo-rd.png";
        document.body.appendChild(enlace);
        enlace.click();
        document.body.removeChild(enlace);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      // Si la persona cierra el diálogo de compartir sin elegir nada, el
      // navegador lanza AbortError — no es un error real, no mostrar nada.
      if (err instanceof Error && err.name !== "AbortError") {
        setErrorCompartir("No pudimos compartir la imagen. Intenta de nuevo.");
      }
    } finally {
      setGenerandoImagen(false);
    }
  }

  return (
    <main className="bg-neutral-bg min-h-screen px-6 py-16">
      <div className="max-w-xl mx-auto">
        <Link
          href="/dashboard"
          className="text-sm text-brand-blueLight hover:underline"
        >
          ← Volver a mi panel
        </Link>

        {cargando && (
          <p className="text-neutral-text text-sm mt-6">Buscando tu diploma...</p>
        )}

        {!cargando && error && (
          <div className="mt-6 rounded-lg bg-brand-pinkLight border border-brand-pink p-4 text-brand-blue text-sm">
            {error}
          </div>
        )}

        {!cargando && aunNoExiste && (
          <div className="mt-6 rounded-xl bg-white border border-neutral-bg p-8 text-center">
            <p className="text-neutral-text mb-2">
              Todavía no tienes un diploma generado.
            </p>
            <p className="text-sm text-neutral-text">
              Ya completaste y aprobaste las 3 sesiones — pide a tu
              coordinadora que lo genere. En cuanto lo haga, va a aparecer
              aquí automáticamente.
            </p>
          </div>
        )}

        {!cargando && diploma && (
          <>
            <div className="mt-6 rounded-xl bg-white border border-neutral-bg p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-brand-pinkLight flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎓</span>
              </div>
              <h1 className="font-display text-2xl font-bold text-brand-blue mb-1">
                ¡Felicidades!
              </h1>
              <p className="text-neutral-text text-sm mb-6">
                Completaste el curso de Mujeres al Volante RD
              </p>

              <div className="rounded-lg bg-neutral-bg p-4 mb-6 text-left">
                <p className="text-xs text-neutral-text">Código de verificación</p>
                <p className="font-mono font-semibold text-brand-blue mb-3">
                  {diploma.codigoVerificacion}
                </p>
                <p className="text-xs text-neutral-text">Fecha de emisión</p>
                <p className="text-sm text-neutral-text">{fechaFormateada}</p>
              </div>

              <a
                href={`${process.env.NEXT_PUBLIC_API_URL}/diplomas/me/descargar?token=${token}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-full rounded-xl bg-brand-blue text-white p-4 font-display font-semibold hover:opacity-90 transition-opacity mb-3"
              >
                Ver / descargar mi diploma (PDF)
              </a>

              <p className="text-xs text-neutral-text">
                Cualquiera puede confirmar la autenticidad de este diploma en{" "}
                <Link href="/verificar-diploma" className="text-brand-blueLight hover:underline">
                  la página de verificación
                </Link>{" "}
                usando el código de arriba.
              </p>
            </div>

            <div className="mt-6 rounded-xl bg-white border border-neutral-bg p-8 text-center">
              <p className="text-neutral-text text-sm mb-4">
                Comparte tu logro y anima a otra mujer a manejar con confianza.
              </p>

              <button
                onClick={compartirLogro}
                disabled={generandoImagen}
                className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-brand-pink text-white p-4 font-display font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                <Share2 size={20} />
                {generandoImagen ? "Generando imagen..." : "Compartir mi logro"}
              </button>

              {errorCompartir && (
                <p className="text-xs text-brand-pink mt-3">{errorCompartir}</p>
              )}

              {/* Canvas invisible usado solo para generar la imagen — nunca
                  se muestra en pantalla. */}
              <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function DiplomaPage() {
  return (
    <RutaProtegida rolesPermitidos={["estudiante"]}>
      <DiplomaContenido />
    </RutaProtegida>
  );
}