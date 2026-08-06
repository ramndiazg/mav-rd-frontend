"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import RutaProtegida from "@/components/auth/RutaProtegida";
import { useAuth } from "@/contexts/AuthContext";
import { Share2 } from "lucide-react";
import QRCode from "qrcode";

type Diploma = {
  codigoVerificacion: string;
  fechaEmision: string;
  urlPDF: string;
};

// Formato vertical tipo "historia" (9:16) — pensado para compartir desde
// celular a WhatsApp Status / Instagram Stories.
const ANCHO_IMAGEN = 1080;
const ALTO_IMAGEN = 1920;
const URL_INICIO = "https://muvo-rd.vercel.app";

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

  function cargarImagen(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
      img.src = src;
    });
  }

  // Envuelve texto largo (ej. nombres compuestos) en varias líneas
  // centradas, respetando un ancho máximo. Devuelve la cantidad de líneas
  // usadas, para poder calcular cuánto espacio ocupó.
  function envolverTexto(
    ctx: CanvasRenderingContext2D,
    texto: string,
    cx: number,
    y: number,
    anchoMax: number,
    alturaLinea: number,
  ): number {
    const palabras = texto.split(" ");
    const lineas: string[] = [];
    let linea = "";

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

    return lineas.length;
  }

  async function generarImagen(): Promise<Blob | null> {
    const canvas = canvasRef.current;
    if (!canvas || !diploma) return null;

    canvas.width = ANCHO_IMAGEN;
    canvas.height = ALTO_IMAGEN;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const cx = ANCHO_IMAGEN / 2;

    // Cargamos en paralelo: foto de fondo, logo y QR. Las tres tienen que
    // ser locales (mismo origen) o el canvas queda "contaminado" y
    // toBlob() falla en silencio.
    const qrDataUrl = await QRCode.toDataURL(URL_INICIO, {
      width: 300,
      margin: 1,
      color: { dark: "#1B3A6B", light: "#FFFFFF" },
    });

    const [foto, logo, qr] = await Promise.all([
      cargarImagen("/diploma-compartir.jpg"),
      cargarImagen("/logo-mav-rd.png"),
      cargarImagen(qrDataUrl),
    ]);

    // Fondo degradado azul -> rosa de marca (para toda la tarjeta, la
    // foto va encima en la franja superior)
    const degradado = ctx.createLinearGradient(0, 0, 0, ALTO_IMAGEN);
    degradado.addColorStop(0, "#1B3A6B");
    degradado.addColorStop(1, "#4A1236");
    ctx.fillStyle = degradado;
    ctx.fillRect(0, 0, ANCHO_IMAGEN, ALTO_IMAGEN);

    // Franja de foto arriba, recortada tipo "cover"
    const altoFoto = 700;
    const escala = Math.max(ANCHO_IMAGEN / foto.width, altoFoto / foto.height);
    const anchoRecorte = ANCHO_IMAGEN / escala;
    const altoRecorte = altoFoto / escala;
    const xRecorte = (foto.width - anchoRecorte) / 2;
    const yRecorte = (foto.height - altoRecorte) / 2;
    ctx.drawImage(
      foto,
      xRecorte, yRecorte, anchoRecorte, altoRecorte,
      0, 0, ANCHO_IMAGEN, altoFoto,
    );

    // Degradado oscuro sobre la parte baja de la foto para que el
    // logo/texto de abajo sean legibles
    const overlay = ctx.createLinearGradient(0, altoFoto - 260, 0, altoFoto);
    overlay.addColorStop(0, "rgba(27,58,107,0)");
    overlay.addColorStop(1, "rgba(27,58,107,1)");
    ctx.fillStyle = overlay;
    ctx.fillRect(0, altoFoto - 260, ANCHO_IMAGEN, 260);

    ctx.textAlign = "center";

    // Logo real, superpuesto sobre la transición foto -> fondo
    const logoTam = 130;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, altoFoto - 20, logoTam / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(logo, cx - logoTam / 2, altoFoto - 20 - logoTam / 2, logoTam, logoTam);
    ctx.restore();

    // Nombre grande
    ctx.font = "700 66px Poppins, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    const lineasNombre = envolverTexto(
      ctx, nombreCompleto.toUpperCase(), cx, 830, ANCHO_IMAGEN - 160, 80,
    );

    let y = 830 + lineasNombre * 80 + 20;

    ctx.font = "400 32px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText("completó el curso de educación vial de Muvo RD Vial", cx, y);
    y += 90;

    // Mensaje motivador, presentado como oportunidad
    ctx.font = "700 40px Poppins, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    const lineasCta = envolverTexto(
      ctx,
      "Tu oportunidad de aprender a manejar con confianza empieza aquí",
      cx, y, ANCHO_IMAGEN - 180, 52,
    );
    y += lineasCta * 52 + 60;

    // Bloque blanco con QR + link, al fondo de la tarjeta
    const bloqueAlto = 260;
    const bloqueY = ALTO_IMAGEN - bloqueAlto - 80;
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(80, bloqueY, ANCHO_IMAGEN - 160, bloqueAlto, 24);
    ctx.fill();

    const qrTam = 180;
    ctx.drawImage(qr, 130, bloqueY + (bloqueAlto - qrTam) / 2, qrTam, qrTam);

    ctx.textAlign = "left";
    const textoX = 130 + qrTam + 40;
    ctx.font = "700 34px Poppins, sans-serif";
    ctx.fillStyle = "#1B3A6B";
    ctx.fillText("Anímate tú también", textoX, bloqueY + 100);
    ctx.font = "400 26px Inter, sans-serif";
    ctx.fillStyle = "#5F5E5A";
    ctx.fillText("Escanea o entra a", textoX, bloqueY + 150);
    ctx.font = "700 30px Poppins, sans-serif";
    ctx.fillStyle = "#D6336C";
    ctx.fillText("muvo-rd.vercel.app", textoX, bloqueY + 190);

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
        "Comparte tu logro e inspira a alguien más a aprender a manejar con confianza.";

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
                Completaste el curso de educación vial de Muvo RD Vial
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
                Comparte tu logro e inspira a alguien más a aprender a manejar
                con confianza.
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

              {/* Canvas invisible usado solo para generar la imagen. */}
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