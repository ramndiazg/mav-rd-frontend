Correcciones a aplicar en FRONTEND.md (el que ya está en el repo)

El documento original asumía JWT en cookie httpOnly + middleware de Next.js
verificándola. Eso no existe en el backend real. Reemplazar la sección
"Rutas protegidas por rol" por esto:

Autenticación real (reemplaza la sección anterior)

El backend devuelve el JWT en el body de la respuesta de login/registro, no en
una cookie. Estrategia recomendada para el frontend:

Al hacer login/registro, guardar token y usuario en un Context de React
(AuthContext) + localStorage (para persistir entre recargas).
Un lib/api.ts centralizado agrega el header automáticamente:

ts const token = localStorage.getItem('token');
fetch(`${API_URL}${path}`, {
...options,
headers: { ...options.headers, Authorization: token ? `Bearer ${token}` : '' },
});

Como no hay cookie, no se puede usar middleware.ts de Next.js para proteger
rutas en el servidor (el middleware corre antes de que el JS del cliente
lea localStorage). En su lugar:

Usar un componente <RutaProtegida rolesPermitidos={[...]}> que en el
cliente ('use client') verifique el AuthContext y redirija con
useRouter().push('/login') si no hay sesión o el rol no encaja.
Al montar la app, si hay token guardado, llamar a GET /api/auth/perfil
para validar que sigue siendo válido antes de confiar en el localStorage.

Logout = borrar token de localStorage y limpiar el AuthContext.

Esta es una limitación conocida y aceptable para el tamaño de este proyecto —
si en el futuro se quiere proteger rutas a nivel de servidor, habría que migrar
el backend a emitir cookies httpOnly, lo cual es un cambio de arquitectura, no
un ajuste menor.

**Dos bugs reales de auth encontrados y corregidos (Sesión 6-8):**

1. `AuthContext.tsx` → `verificarSesion()` hacía `setUsuario(json.data)`, pero
   `GET /api/auth/perfil` responde `{ success, data: { usuario: {...} } }` —
   el usuario va anidado en `data.usuario`. Esto dejaba `usuario.rol` en
   `undefined` en cualquier recarga de página o entrada por URL directa
   (no en el login manual, que sí usaba `json.data.usuario` correctamente) —
   y `RutaProtegida` expulsaba a la persona a `/login` sin razón aparente.
   **Corregido**, ahora usa `json.data.usuario` también en `verificarSesion()`.
2. `login/page.tsx` hacía siempre `router.push("/dashboard")` después de un
   login exitoso, sin mirar el rol — coordinadora/admin caían en una ruta
   protegida solo para estudiante y quedaban rebotadas a `/login`. **Corregido**:
   `login()` en `AuthContext.tsx` ahora devuelve `rol` en su resultado, y
   `login/page.tsx` redirige a `/panel/pagos` si el rol es coordinadora/admin,
   o a `/dashboard` si es estudiante. El mismo problema existía en
   `Navbar.tsx` (`destinoPanel` mandaba a `/` para esos roles porque las
   rutas de panel no existían cuando se escribió) — también corregido para
   apuntar a `/panel/pagos`.

# Arquitectura del Frontend — `mav-rd-frontend`

**Stack:** Next.js (App Router) + Tailwind CSS + despliegue en Vercel

## Estructura de carpetas

> **Nota de la Sesión 6-8 (construcción real):** las páginas públicas, de auth
> y de estudiante que ya existen en el repo real están en carpetas planas
> (`app/dashboard/page.tsx`, `app/login/page.tsx`, `app/noticias/page.tsx`,
> etc.), **sin** los grupos de rutas con paréntesis `(publico)`/`(auth)`/`(estudiante)`
> que muestra el árbol de abajo — esos paréntesis solo se usaron de verdad para
> `(coordinadora)` y `(admin)`, que sí existen tal cual en el repo. El árbol
> completo de abajo sigue siendo la referencia de qué páginas existen y qué
> falta, solo ignora los paréntesis en las secciones que no sean coordinadora/admin.

```
mav-rd-frontend/
├── app/
│   ├── (publico)/
│   │   ├── page.tsx                    # Inicio
│   │   ├── acerca-de-nosotros/page.tsx
│   │   ├── kit-preparacion/page.tsx    # videos + libro + link INTRANT
│   │   ├── noticias/page.tsx
│   │   ├── noticias/[id]/page.tsx
│   │   ├── testimonios/page.tsx
│   │   ├── faq/page.tsx
│   │   └── verificar-diploma/page.tsx
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── registro/page.tsx
│   ├── (estudiante)/
│   │   ├── dashboard/page.tsx
│   │   ├── aula-virtual/[sesion]/page.tsx   # ✅ construida (Sesión 6)
│   │   ├── examen/[intentoId]/page.tsx       # ✅ construida (Sesión 6)
│   │   └── diploma/page.tsx                  # ✅ construida (Sesión 7)
│   ├── (compartido)/
│   │   └── perfil/cambiar-password/page.tsx   # pendiente de construir
│   ├── (coordinadora)/                         # ✅ existe tal cual, con paréntesis
│   │   ├── panel/layout.tsx        # header + nav entre las 7 páginas de abajo
│   │   ├── panel/pagos/page.tsx           # ✅ construida (Sesión 7)
│   │   ├── panel/aula-virtual/page.tsx    # ✅ construida (Sesión 7) — desbloquear sesiones (ya no elige versión de examen, es al azar)
│   │   ├── panel/examenes/page.tsx        # ✅ construida (Sesión 7) — CRUD del banco de preguntas por sesión
│   │   ├── panel/diplomas/page.tsx        # ✅ construida (Sesión 7)
│   │   ├── panel/noticias/page.tsx        # ✅ construida (Sesión 7)
│   │   ├── panel/testimonios/page.tsx     # ✅ construida (Sesión 7)
│   │   └── panel/faq/page.tsx             # ✅ construida (Sesión 7)
│   ├── (admin)/                                # ✅ existe tal cual, con paréntesis
│   │   ├── admin/layout.tsx        # header + link de vuelta a /panel/pagos
│   │   ├── admin/contabilidad/page.tsx         # pendiente de construir
│   │   └── admin/contenido-pagina/page.tsx     # ✅ construida (Sesión 7)
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                 # botones, cards, inputs (design system propio)
│   ├── layout/              # Navbar, Footer, Sidebar de panel
│   ├── noticias/
│   ├── aula-virtual/
│   └── contabilidad/
├── lib/
│   ├── api.ts               # cliente fetch hacia el backend
│   ├── auth.ts               # helpers de sesión/JWT
│   └── constants.ts
├── public/
│   └── logo.svg
├── tailwind.config.ts        # tokens de color de marca
├── .env.local.example
├── package.json
└── README.md
```

## Tokens de color (Tailwind config)

```js
colors: {
  brand: {
    blue: '#1B3A6B',
    blueLight: '#4A7FC9',
    pink: '#D6336C',
    pinkLight: '#FBE4EC',
  },
  neutral: {
    bg: '#F7F8FA',
    text: '#1F2937',
  },
  status: {
    success: '#2F9E44',
    warning: '#F0A500',
  }
}
```

Tipografía: `Poppins` (títulos) importada de Google Fonts, `Inter` (cuerpo).

## Rutas protegidas por rol

> Esta sección reemplaza una versión anterior que asumía JWT en cookie httpOnly
> con `middleware.ts` — eso nunca existió en el backend real (ver la corrección
> de autenticación al inicio de este documento). Queda una sola versión, sin
> ambigüedad: protección en cliente vía `<RutaProtegida>`, no middleware de servidor.

- `<RutaProtegida rolesPermitidos={[...]}>` (componente cliente) verifica el
  `AuthContext` y redirige con `useRouter().push('/login')`:
  - Sin sesión → `/login`
  - `estudiante` sin pago confirmado (según `GET /api/inscripciones/me`) →
    dashboard con aviso, sin acceso a aula-virtual
  - `coordinadora` → acceso a `(coordinadora)`
  - `admin` → acceso a `(coordinadora)` + `(admin)`

## Variables de entorno (`.env.local.example`)

```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## Notas de diseño (ver frontend-design para dirección visual completa)

- Estilo institucional pero cálido: no plano/genérico, usar la paleta rosa+azul de
  forma intencional (azul para estructura/confianza, rosa para acentos y CTAs).
- Botones de compartir en noticias: Facebook, WhatsApp, X + Web Share API nativo
  (fallback en desktop: copiar link).
- Mobile-first: la mayoría de las estudiantes probablemente acceden desde el celular.

## Flujo corregido del Aula Virtual (para evitar reconstruirlo mal)

1. `dashboard/page.tsx` llama a `GET /api/inscripciones/me` para saber si hay
   pago confirmado — ya no se infiere por si existe `ProgresoEstudiante`.
2. `aula-virtual/[sesion]/page.tsx` muestra teoría/videos si
   `sesion <= sesionActualDesbloqueada` (viene de `GET /api/progreso/me`).
3. Al llegar el momento del examen (presencial, la coordinadora ya desbloqueó
   con `POST /api/examenes/:sesionId/desbloquear`), la página del examen llama
   primero a `GET /api/intentos-examen/activo/:sesionId` para obtener el `id`
   del intento — **nunca asumir o guardar el id manualmente**, siempre pedirlo.
4. Con ese `id`: `POST /:id/iniciar` → responder → `POST /:id/entregar`.

## Contenido editable por la fundadora

Las páginas públicas de Inicio, Acerca de Nosotros, Kit de Preparación y
Contacto ya no deben tener texto hardcodeado para los bloques cubiertos por
`GET /api/contenido` — se renderizan a partir de esas claves para que la
fundadora los edite desde `admin/contenido-pagina/page.tsx` sin pedir despliegue.

## Testing antes de cada commit importante

- `npm run build` local sin errores antes de hacer push.
- Probar flujo completo en local contra el backend local: registro → login →
  (simular pago confirmado) → aula virtual → examen → diploma.
- Verificar responsive en móvil (Chrome DevTools) antes de desplegar a Vercel.
