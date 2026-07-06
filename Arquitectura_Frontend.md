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
fetch(${API_URL}${path}, {
...options,
headers: { ...options.headers, Authorization: token ? Bearer ${token} : '' },
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

Arquitectura del Frontend — mav-rd-frontend

Stack: Next.js (App Router) + Tailwind CSS + despliegue en Vercel

Estructura de carpetas

mav-rd-frontend/
├── app/
│ ├── (publico)/
│ │ ├── page.tsx # Inicio
│ │ ├── acerca-de-nosotros/page.tsx
│ │ ├── kit-preparacion/page.tsx # videos + libro + link INTRANT
│ │ ├── noticias/page.tsx
│ │ ├── noticias/[id]/page.tsx
│ │ ├── testimonios/page.tsx
│ │ ├── faq/page.tsx
│ │ └── verificar-diploma/page.tsx
│ ├── (auth)/
│ │ ├── login/page.tsx
│ │ └── registro/page.tsx
│ ├── (estudiante)/
│ │ ├── dashboard/page.tsx
│ │ ├── aula-virtual/[sesion]/page.tsx
│ │ ├── examen/[intentoId]/page.tsx
│ │ └── diploma/page.tsx
│ ├── (compartido)/
│ │ └── perfil/cambiar-password/page.tsx # cualquier rol autenticado
│ ├── (coordinadora)/
│ │ ├── panel/page.tsx
│ │ ├── panel/pagos/page.tsx
│ │ ├── panel/aula-virtual/page.tsx # desbloquear sesiones (ya no elige versión de examen, es al azar)
│ │ ├── panel/examenes/page.tsx # NUEVO: CRUD del banco de preguntas por sesión
│ │ ├── panel/diplomas/page.tsx
│ │ ├── panel/noticias/page.tsx
│ │ ├── panel/testimonios/page.tsx
│ │ └── panel/faq/page.tsx
│ ├── (admin)/
│ │ ├── admin/contabilidad/page.tsx
│ │ └── admin/contenido-pagina/page.tsx # NUEVO: editar textos de Inicio/Acerca de/Kit/Contacto
│ ├── layout.tsx
│ └── globals.css
├── components/
│ ├── ui/ # botones, cards, inputs (design system propio)
│ ├── layout/ # Navbar, Footer, Sidebar de panel
│ ├── noticias/
│ ├── aula-virtual/
│ └── contabilidad/
├── lib/
│ ├── api.ts # cliente fetch hacia el backend
│ ├── auth.ts # helpers de sesión/JWT
│ └── constants.ts
├── public/
│ └── logo.svg
├── tailwind.config.ts # tokens de color de marca
├── .env.local.example
├── package.json
└── README.md

Tokens de color (Tailwind config)

jscolors: {
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

Tipografía: Poppins (títulos) importada de Google Fonts, Inter (cuerpo).

Rutas protegidas por rol

Esta sección reemplaza una versión anterior que asumía JWT en cookie httpOnly
con middleware.ts — eso nunca existió en el backend real (ver la corrección
de autenticación al inicio de este documento). Queda una sola versión, sin
ambigüedad: protección en cliente vía <RutaProtegida>, no middleware de servidor.

<RutaProtegida rolesPermitidos={[...]}> (componente cliente) verifica el
AuthContext y redirige con useRouter().push('/login'):

Sin sesión → /login
estudiante sin pago confirmado (según GET /api/inscripciones/me) →
dashboard con aviso, sin acceso a aula-virtual
coordinadora → acceso a (coordinadora)
admin → acceso a (coordinadora) + (admin)

Variables de entorno (.env.local.example)

NEXT_PUBLIC_API_URL=http://localhost:4000/api

Notas de diseño (ver frontend-design para dirección visual completa)

Estilo institucional pero cálido: no plano/genérico, usar la paleta rosa+azul de
forma intencional (azul para estructura/confianza, rosa para acentos y CTAs).
Botones de compartir en noticias: Facebook, WhatsApp, X + Web Share API nativo
(fallback en desktop: copiar link).
Mobile-first: la mayoría de las estudiantes probablemente acceden desde el celular.

Flujo corregido del Aula Virtual (para evitar reconstruirlo mal)

dashboard/page.tsx llama a GET /api/inscripciones/me para saber si hay
pago confirmado — ya no se infiere por si existe ProgresoEstudiante.
aula-virtual/[sesion]/page.tsx muestra teoría/videos si
sesion <= sesionActualDesbloqueada (viene de GET /api/progreso/me).
Al llegar el momento del examen (presencial, la coordinadora ya desbloqueó
con POST /api/examenes/:sesionId/desbloquear), la página del examen llama
primero a GET /api/intentos-examen/activo/:sesionId para obtener el id
del intento — nunca asumir o guardar el id manualmente, siempre pedirlo.
Con ese id: POST /:id/iniciar → responder → POST /:id/entregar.

Contenido editable por la fundadora

Las páginas públicas de Inicio, Acerca de Nosotros, Kit de Preparación y
Contacto ya no deben tener texto hardcodeado para los bloques cubiertos por
GET /api/contenido — se renderizan a partir de esas claves para que la
fundadora los edite desde admin/contenido-pagina/page.tsx sin pedir despliegue.

Testing antes de cada commit importante

npm run build local sin errores antes de hacer push.
Probar flujo completo en local contra el backend local: registro → login →
(simular pago confirmado) → aula virtual → examen → diploma.
Verificar responsive en móvil (Chrome DevTools) antes de desplegar a Vercel.
