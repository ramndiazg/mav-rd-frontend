"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRevalidar } from "@/hooks/useRevalidar";
import { useUsLocale } from "@/contexts/UsLocaleContext";
import {
  ApiErrorUS,
  EVENTO_SESION_VENCIDA,
  guardarTokenUS,
  leerTokenUS,
  usFetch,
} from "@/lib/us/api";
import type { EstadoUS } from "@/lib/us/estados";
import type { Locale } from "@/lib/us/i18n";

// NUEVO (24/10/2026): sesión del estudiante de EE. UU. Replica el contrato del
// AuthContext de RD (que NO se modifica) pero con su propio token
// (localStorage["us_token"]) y los endpoints /api/us/auth/*.

export type UsUsuario = {
  _id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  rol: "estudiante" | "coordinadora" | "admin" | "conductor";
  activo: boolean;
  emailVerificado: boolean;
  pais: string; // "US" para las cuentas de este curso
  estadoUS: EstadoUS | null;
  idioma: Locale;
};

export type DatosRegistroUS = {
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  password: string;
  estadoUS: EstadoUS;
  ciudad?: string;
  fechaNacimiento: string; // YYYY-MM-DD
  captchaToken?: string;
  sitioWeb?: string; // honeypot — siempre vacío
};

export type ResultadoAuthUS =
  | { ok: true; autoLogueado: boolean }
  | { ok: false; code: string | null; mensaje: string };

type UsAuthContextType = {
  usuario: UsUsuario | null;
  token: string | null;
  cargando: boolean;
  login: (email: string, password: string) => Promise<ResultadoAuthUS>;
  registro: (datos: DatosRegistroUS) => Promise<ResultadoAuthUS>;
  logout: () => void;
  refrescarUsuario: () => Promise<boolean>;
  notificarEmailVerificado: () => void;
};

const CANAL_AUTH = "muvo-us-auth";

const UsAuthContext = createContext<UsAuthContextType | undefined>(undefined);

// Una cuenta sirve para este curso solo si es una estudiante de EE. UU.
function esCuentaUS(u: UsUsuario | null | undefined): u is UsUsuario {
  return !!u && u.pais === "US" && u.rol === "estudiante";
}

export function UsAuthProvider({ children }: { children: ReactNode }) {
  const { locale, mensajeError } = useUsLocale();
  const [usuario, setUsuario] = useState<UsUsuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const cerrarSesionLocal = useCallback(() => {
    guardarTokenUS(null);
    setToken(null);
    setUsuario(null);
  }, []);

  // Al montar: valida el token guardado (si hay).
  useEffect(() => {
    let cancelado = false;

    async function verificarSesion() {
      const guardado = leerTokenUS();
      if (!guardado) {
        if (!cancelado) setCargando(false);
        return;
      }
      try {
        const datos = await usFetch<{ usuario: UsUsuario }>("/auth/perfil", {
          token: guardado,
          cache: "no-store",
        });
        if (cancelado) return;
        // Si mientras tanto se hizo login/logout con otra cuenta, esta
        // respuesta quedó vieja y se descarta (mismo guard que RD).
        if (leerTokenUS() !== guardado) return;

        if (esCuentaUS(datos.usuario)) {
          setToken(guardado);
          setUsuario(datos.usuario);
        } else {
          // Token válido pero de otra clase de cuenta (p. ej. de RD): no sirve aquí.
          cerrarSesionLocal();
        }
      } catch (error) {
        // 401 → el token ya no sirve. Error de red → se conserva por si es temporal.
        if (error instanceof ApiErrorUS && error.status === 401 && !cancelado) {
          cerrarSesionLocal();
        }
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    verificarSesion();
    return () => {
      cancelado = true;
    };
  }, [cerrarSesionLocal]);

  // usFetch avisa cuando el servidor responde 401 con un token puesto.
  useEffect(() => {
    const alVencer = () => cerrarSesionLocal();
    window.addEventListener(EVENTO_SESION_VENCIDA, alVencer);
    return () => window.removeEventListener(EVENTO_SESION_VENCIDA, alVencer);
  }, [cerrarSesionLocal]);

  const refrescarUsuario = useCallback(async (): Promise<boolean> => {
    const actual = leerTokenUS();
    if (!actual) return false;
    try {
      const datos = await usFetch<{ usuario: UsUsuario }>("/auth/perfil", {
        token: actual,
        cache: "no-store",
      });
      if (leerTokenUS() !== actual) return false;
      if (!esCuentaUS(datos.usuario)) {
        cerrarSesionLocal();
        return false;
      }
      // Si nada cambió se conserva el mismo objeto (evita re-renders).
      setUsuario((previo) =>
        previo && JSON.stringify(previo) === JSON.stringify(datos.usuario)
          ? previo
          : datos.usuario,
      );
      return true;
    } catch {
      return false; // red caída o 401 (ya manejado por el evento)
    }
  }, [cerrarSesionLocal]);

  // Mientras el correo siga sin verificar se pregunta cada 6 s (pestaña
  // visible) y al volver a la pestaña — igual que en RD.
  const esperandoVerificacion = !!usuario && !usuario.emailVerificado;
  useRevalidar(refrescarUsuario, {
    activo: !!usuario,
    intervaloMs: esperandoVerificacion ? 6000 : null,
    minEntreEventosMs: 15000,
  });

  // Otra pestaña confirmó el correo: refrescar ya.
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const canal = new BroadcastChannel(CANAL_AUTH);
    canal.onmessage = (evento) => {
      if (evento.data?.tipo === "email-verificado") void refrescarUsuario();
    };
    return () => canal.close();
  }, [refrescarUsuario]);

  const notificarEmailVerificado = useCallback(() => {
    void refrescarUsuario();
    if (typeof BroadcastChannel === "undefined") return;
    const canal = new BroadcastChannel(CANAL_AUTH);
    canal.postMessage({ tipo: "email-verificado" });
    canal.close();
  }, [refrescarUsuario]);

  function iniciarSesion(datos: { usuario: UsUsuario; token: string }) {
    guardarTokenUS(datos.token);
    setToken(datos.token);
    setUsuario(datos.usuario);
  }

  async function login(email: string, password: string): Promise<ResultadoAuthUS> {
    try {
      const datos = await usFetch<{ usuario: UsUsuario; token: string }>(
        "/us/auth/login",
        { method: "POST", body: { email, password, idioma: locale }, locale, token: null },
      );
      iniciarSesion(datos);
      return { ok: true, autoLogueado: true };
    } catch (error) {
      return {
        ok: false,
        code: error instanceof ApiErrorUS ? error.code : null,
        mensaje: mensajeError(error),
      };
    }
  }

  async function registro(datos: DatosRegistroUS): Promise<ResultadoAuthUS> {
    try {
      const respuesta = await usFetch<{ usuario: UsUsuario | null; token: string | null }>(
        "/us/auth/registro",
        { method: "POST", body: { ...datos, idioma: locale }, locale, token: null },
      );
      if (respuesta.token && respuesta.usuario) {
        iniciarSesion({ usuario: respuesta.usuario, token: respuesta.token });
        return { ok: true, autoLogueado: true };
      }
      return { ok: true, autoLogueado: false };
    } catch (error) {
      return {
        ok: false,
        code: error instanceof ApiErrorUS ? error.code : null,
        mensaje: mensajeError(error),
      };
    }
  }

  return (
    <UsAuthContext.Provider
      value={{
        usuario,
        token,
        cargando,
        login,
        registro,
        logout: cerrarSesionLocal,
        refrescarUsuario,
        notificarEmailVerificado,
      }}
    >
      {children}
    </UsAuthContext.Provider>
  );
}

export function useUsAuth() {
  const contexto = useContext(UsAuthContext);
  if (!contexto) {
    throw new Error("useUsAuth debe usarse dentro de un UsAuthProvider");
  }
  return contexto;
}