"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useUsAuth } from "@/contexts/UsAuthContext";
import { useUsLocale } from "@/contexts/UsLocaleContext";
import {
  BotonPrimario,
  Campo,
  CampoPassword,
  MensajeError,
  TarjetaAuth,
} from "@/components/us/FormUI";
import { siguienteSegura } from "@/lib/us/rutas";

// NUEVO (24/10/2026): inicio de sesión de EE. UU. Solo entran cuentas del
// curso (el backend responde "credenciales inválidas" a cualquier otra).
function LoginContenido() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useUsLocale();
  const { usuario, cargando, login } = useUsAuth();

  const siguiente = siguienteSegura(params.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Navega cuando `usuario` ya está confirmado (evita la carrera de navegar
  // justo después de login(), que RD ya tuvo y corrigió).
  useEffect(() => {
    if (!cargando && usuario) router.replace(siguiente);
  }, [cargando, usuario, siguiente, router]);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setError("");
    setEnviando(true);
    const resultado = await login(email, password);
    setEnviando(false);
    if (!resultado.ok) setError(resultado.mensaje);
  }

  return (
    <TarjetaAuth titulo={t("login.titulo")} subtitulo={t("login.sub")}>
      <form onSubmit={enviar} className="flex flex-col gap-4">
        <Campo
          etiqueta={t("campo.email")}
          required
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <CampoPassword
          etiqueta={t("campo.password")}
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <MensajeError>{error}</MensajeError>

        <BotonPrimario type="submit" cargando={enviando} textoCargando={t("login.enviando")}>
          {t("login.enviar")}
        </BotonPrimario>

        <Link
          href="/us/forgot-password"
          className="text-center text-sm text-brand-blue underline"
        >
          {t("login.olvide")}
        </Link>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-text">
        {t("login.noTienes")}{" "}
        <Link href="/us/register" className="font-medium text-brand-pink underline">
          {t("nav.crearCuenta")}
        </Link>
      </p>
    </TarjetaAuth>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContenido />
    </Suspense>
  );
}