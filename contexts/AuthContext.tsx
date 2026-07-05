"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

type Rol = "estudiante" | "coordinadora" | "admin";

type Usuario = {
  _id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: Rol;
  activo: boolean;
};

type DatosRegistro = {
  nombre: string;
  apellido: string;
  cedula: string;
  telefono: string;
  email: string;
  password: string;
  provincia: string;
  fechaNacimiento: string;
};

type ResultadoAuth = {
  ok: boolean;
  error?: string;
  autoLogueado?: boolean;
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

  // Al montar la app, si hay un token guardado, lo validamos contra el
  // backend (GET /api/auth/perfil). Si el token expiro (401), lo borramos.
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

        if (json.success) {
          setToken(tokenGuardado);
          setUsuario(json.data);
        } else {
          window.localStorage.removeItem("token");
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
      return { ok: true };
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

      // No esta confirmado si /api/auth/registro devuelve token como login.
      // Cubrimos ambos casos: si viene token, dejamos a la persona logueada;
      // si no, que inicie sesion manualmente despues.
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
