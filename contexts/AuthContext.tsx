"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

type Rol = "estudiante" | "coordinadora" | "admin" | "conductor";

type Usuario = {
  _id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: Rol;
  activo: boolean;
  emailVerificado: boolean;
  // NUEVO (13/09/2026): ver ANALISIS_COBERTURA_PRACTICA.md — decide, junto
  // con MunicipioPractica, si a la estudiante le aplica la práctica de
  // manejo presencial en el programa "estandar". `municipio` es null para
  // cuentas creadas antes de este campo (ver models/User.js en el
  // backend).
  provincia?: string;
  municipio?: string | null;
  // NUEVO (08/09/2026): presente solo para estudiantes inscritas en bloque
  // por un colegio/empresa (ver models/Grupo.js). null para el flujo de
  // autoregistro normal. Determina si a la estudiante le aplica el gate
  // de práctica de manejo (ver ProgresoCarretera y dashboard).
  grupoId: string | null;
  // NUEVO (08/09/2026): "colegio" | "empresa" | null — lo calcula el
  // backend (ver authController.js: conGrupoTipo) para que el frontend
  // no tenga que hacer un segundo fetch a /grupos/:id. Determina qué
  // cuestionario de perfil le toca (TestPsicologico vs
  // CuestionarioEscolar).
  grupoTipo: "colegio" | "empresa" | null;
};

type DatosRegistro = {
  nombre: string;
  apellido: string;
  cedula: string;
  telefono: string;
  email: string;
  password: string;
  provincia: string;
  // NUEVO (13/09/2026): ver ANALISIS_COBERTURA_PRACTICA.md.
  municipio: string;
  fechaNacimiento: string;
  // NUEVO (10/09/2026): protecciones anti-bot, ver ARQUITECTURA_BACKEND.md
  // sección "Seguridad — ataque de registro masivo".
  captchaToken?: string;
  sitioWeb?: string; // honeypot — siempre debe llegar vacío
};

type ResultadoAuth = {
  ok: boolean;
  error?: string;
  autoLogueado?: boolean;
  rol?: Rol;
};

type AuthContextType = {
  usuario: Usuario | null;
  token: string | null;
  cargando: boolean;
  login: (email: string, password: string) => Promise<ResultadoAuth>;
  registro: (datos: DatosRegistro) => Promise<ResultadoAuth>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;

    async function verificarSesion() {
      const tokenGuardado = window.localStorage.getItem("token");

      if (!tokenGuardado) {
        if (!cancelado) setCargando(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/auth/perfil`, {
          headers: { Authorization: `Bearer ${tokenGuardado}` },
        });
        const json = await res.json();

        if (cancelado) return;

        // CORREGIDO (17/09/2026): esta petición se dispara al montar la
        // app para validar el token que ya estuviera en localStorage (de
        // una sesión anterior en el mismo navegador). Si, mientras esta
        // petición seguía en el aire, alguien hizo login() con OTRA
        // cuenta en esa misma pestaña (típico probando varias estudiantes
        // seguidas), login() ya actualizó localStorage y el contexto con
        // la cuenta nueva — y sin este chequeo, la respuesta vieja
        // llegaba después y pisaba el contexto con la cuenta equivocada.
        // Eso hacía que RutaProtegida (que reacciona a cada cambio de
        // `usuario`) rebotara entre rutas según el rol de la cuenta
        // vieja, viéndose como la pantalla parpadeando entre dos vistas.
        // Si el token en localStorage ya no es el mismo por el que
        // preguntamos, esta respuesta quedó obsoleta — se descarta.
        if (window.localStorage.getItem("token") !== tokenGuardado) {
          return;
        }

        if (json.success) {
          setToken(tokenGuardado);
          setUsuario(json.data.usuario);
        } else {
          window.localStorage.removeItem("token");
          setToken(null);
          setUsuario(null);
        }
      } catch {
        // Error de red: dejamos a la persona sin sesion por ahora, pero no
        // borramos el token guardado por si fue algo temporal de conexion.
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    verificarSesion();
    return () => {
      cancelado = true;
    };
  }, []);

  async function login(email: string, password: string): Promise<ResultadoAuth> {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();

      if (!json.success) {
        return { ok: false, error: json.error || "No se pudo iniciar sesion." };
      }

      window.localStorage.setItem("token", json.data.token);
      setToken(json.data.token);
      setUsuario(json.data.usuario);
      return { ok: true, rol: json.data.usuario.rol };
    } catch {
      return { ok: false, error: "No se pudo conectar con el servidor." };
    }
  }

  async function registro(datos: DatosRegistro): Promise<ResultadoAuth> {
    try {
      const res = await fetch(`${API_URL}/auth/registro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      const json = await res.json();

      if (!json.success) {
        return { ok: false, error: json.error || "No se pudo crear la cuenta." };
      }

      if (json.data?.token) {
        window.localStorage.setItem("token", json.data.token);
        setToken(json.data.token);
        setUsuario(json.data.usuario);
        return { ok: true, autoLogueado: true };
      }

      return { ok: true, autoLogueado: false };
    } catch {
      return { ok: false, error: "No se pudo conectar con el servidor." };
    }
  }

  function logout() {
    window.localStorage.removeItem("token");
    setToken(null);
    setUsuario(null);
  }

  return (
    <AuthContext.Provider
      value={{ usuario, token, cargando, login, registro, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return contexto;
}