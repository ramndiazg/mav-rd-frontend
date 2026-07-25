# Arquitectura del Frontend — mav-rd-frontend

> Refleja el estado REAL del código al 25/07/2026. Reemplaza `Arquitectura_Frontend.md`
> + `BITACORA_FRONTEND.md`. Para el historial de cómo se llegó aquí, ver `HISTORIAL_MODIFICACIONES.md`.

**Stack:** Next.js 16 (App Router) + React 19 + Tailwind CSS v4 + lucide-react
(íconos) + despliegue en Vercel (`mav-rd-vial.vercel.app`).

## Infraestructura y despliegue

- **Backend:** `https://mav-rd-backend.onrender.com/api` (variable de entorno
  obligatoria en Vercel: `NEXT_PUBLIC_API_URL`).
- **CORS:** el backend necesita `FRONTEND_URL` en Render apuntando exactamente
  a la URL de Vercel (sin `/` al final) — si Vercel asigna una URL de preview
  distinta a la de producción, usar la real, no asumir el patrón.
- **Dominio:** el proyecto de Vercel se renombró de `mav-rd-frontend` a
  `mav-rd-vial.vercel.app` (decisión final, ya aplicada).

## Estructura de carpetas (real, no la planeada originalmente)

> El proyecto NO usa grupos de rutas `(publico)/(auth)/(estudiante)/(compartido)`
> — esos quedaron solo como plan. Las páginas públicas, de auth y de estudiante
> viven en carpetas planas. Los únicos grupos de ruta reales son `(coordinadora)`
> y `(admin)`, que sí existen tal cual.

```
mav-rd-frontend/
├── app/
│   ├── page.tsx                          # Inicio
│   ├── acerca-de-nosotros/page.tsx
│   ├── kit-preparacion/page.tsx
│   ├── noticias/page.tsx                 # listado público, paginado
│   ├── noticias/[id]/page.tsx            # detalle — like, comentarios, compartir, OG dinámico
│   ├── testimonios/page.tsx
│   ├── faq/page.tsx
│   ├── verificar-diploma/page.tsx
│   ├── login/page.tsx
│   ├── registro/page.tsx
│   ├── dashboard/page.tsx                # protegida, rol estudiante
│   ├── inscripcion/page.tsx              # NUEVO — auto-inscripción con voucher
│   ├── aula-virtual/[sesion]/page.tsx
│   ├── examen/[intentoId]/page.tsx
│   ├── diploma/page.tsx
│   ├── perfil/cambiar-password/page.tsx
│   ├── (coordinadora)/
│   │   ├── panel/layout.tsx              # header simple + link "volver" (sin barra de pills)
│   │   ├── panel/page.tsx                # NUEVO — pantalla de tarjetas (home del panel)
│   │   ├── panel/pagos/page.tsx          # nueva inscripción manual + cola de verificación de vouchers
│   │   ├── panel/estudiantes/page.tsx
│   │   ├── panel/aula-virtual/page.tsx   # pestañas: Desbloquear exámenes (override) / Contenido de estudio
│   │   ├── panel/examenes/page.tsx
│   │   ├── panel/diplomas/page.tsx
│   │   ├── panel/noticias/page.tsx
│   │   ├── panel/testimonios/page.tsx
│   │   └── panel/faq/page.tsx
│   ├── (admin)/
│   │   ├── admin/layout.tsx              # header simple + link "volver a /panel" (sin barra de pills)
│   │   ├── admin/page.tsx                # NUEVO — redirige a /panel (la sección admin ya vive ahí)
│   │   ├── admin/contabilidad/page.tsx
│   │   └── admin/contenido-pagina/page.tsx
│   ├── layout.tsx                        # metadata general + Open Graph + Twitter Card
│   └── globals.css
├── components/
│   ├── ui/Paginacion.tsx
│   ├── layout/Navbar.tsx, Footer.tsx
│   ├── noticias/NoticiaAcciones.tsx, CompartirBotones.tsx
│   ├── auth/RutaProtegida.tsx
│   └── contabilidad/
├── contexts/AuthContext.tsx
├── public/
│   ├── logo-mav-rd.png
│   ├── og-image.png                      # NUEVO — imagen Open Graph 1200×630
│   └── inscripcion/                      # NUEVO — imágenes de la página de auto-inscripción
│       ├── teoria-1.jpg, teoria-2.jpg, teoria-3.jpg
│       ├── practica-vip.jpg
│       └── practica-normal-ilustracion.jpg
├── app/favicon.ico
├── tailwind.config.ts
├── .env.local.example
└── package.json
```

## Tokens de color (Tailwind)

```js
colors: {
  brand: {
    blue: '#1B3A6B',
    blueLight: '#4A7FC9',
    pink: '#D6336C',
    pinkLight: '#FBE4EC',
  },
  neutral: { bg: '#F7F8FA', text: '#1F2937' },
  status: { success: '#2F9E44', warning: '#F0A500' },
}
```

Tipografía: `Poppins` (títulos), `Inter` (cuerpo) — Google Fonts.

## Autenticación

El backend devuelve el JWT en el body (no cookie). Estrategia:

- Login/registro guardan `token` + `usuario` en `AuthContext` (React Context)
  + `localStorage` (persistencia entre recargas).
- Cada request protegido agrega `Authorization: Bearer <token>` a mano.
- Como no hay cookie, **no se puede usar `middleware.ts`** de Next.js para
  proteger rutas en servidor. En su lugar: `<RutaProtegida rolesPermitidos={[...]}>`,
  componente cliente que verifica `AuthContext` y redirige con
  `useRouter().push('/login')` si no hay sesión o el rol no encaja.
- Al montar la app, si hay token guardado, se valida con `GET /api/auth/perfil`.
- Logout = borrar token de `localStorage` + limpiar `AuthContext`.

Redirección post-login por rol: `estudiante` → `/dashboard`, `coordinadora`/`admin`
→ `/panel` (la pantalla de tarjetas).

## Variables de entorno
```
NEXT_PUBLIC_API_URL=https://mav-rd-backend.onrender.com/api
```

## Flujo del Aula Virtual (contenido antes que examen)

1. `dashboard/page.tsx` llama a `GET /api/inscripciones/me` para saber el
   estado de pago (4 posibles: sin inscripción, `pendiente`, `pendiente_verificacion`,
   `rechazado`, `pagado` — ver sección de Inscripción más abajo).
2. `aula-virtual/[sesion]/page.tsx` solo es visible si
   `sesion <= sesionActualDesbloqueada`. Lista materiales de
   `GET /api/contenido-sesion/sesion/:sesionId`; la estudiante marca cada uno
   con `POST /api/contenido-sesion/:id/marcar-visto`.
3. El backend desbloquea el examen solo cuando detecta que ya se vieron todos
   los materiales activos — no requiere acción de la coordinadora. El botón
   "Ir al examen" se activa cuando el frontend detecta `contenidos.every(vistos)`.
4. Al hacer clic en "Ir al examen": `GET /api/intentos-examen/activo/:sesionId`
   para obtener el `id` real del intento — nunca se asume o guarda a mano.
5. Con ese `id`: `POST /:id/iniciar` → responder → `POST /:id/entregar`.
   Tras entregar, `GET /:id/detalle` pinta correctas/incorrectas en verde/rojo.
6. Si reprueba y le quedan intentos: `POST /api/intentos-examen/reintentar/:sesionId`
   (autoservicio, sin pasar por la coordinadora).

El desbloqueo manual (`POST /api/examenes/:sesionId/desbloquear`) sigue
existiendo como override, en `panel/aula-virtual/page.tsx` → pestaña
"Desbloquear exámenes". La gestión de contenido vive en la pestaña "Contenido
de estudio" de la misma página.

## Inscripción y pagos (autoservicio con voucher)

Antes, la inscripción y el pago los creaba y confirmaba la coordinadora
manualmente. Ahora existen **dos flujos en paralelo**:

**Flujo manual (efectivo/presencial)** — sin cambios: la coordinadora crea la
inscripción desde `panel/pagos/page.tsx` y confirma el pago ahí mismo.

**Flujo de auto-inscripción (transferencia/depósito)** — nuevo:
1. La estudiante entra a `/inscripcion` (enlazada desde el dashboard cuando no
   tiene inscripción, o cuando le rechazaron una). La página muestra contenido
   de marketing (fotos reales del curso, comparación Normal vs VIP con precios
   traídos en vivo de `GET /api/configuracion`, pasos del proceso) y termina en
   un formulario.
2. Elige plan, banco emisor, número de referencia, fecha de depósito, y sube
   una foto del voucher (`POST /api/uploads/imagen`, rol estudiante habilitado).
3. Envía todo a `POST /api/inscripciones/mia` — el backend calcula el monto
   real, nunca confía en el del cliente.
4. `dashboard/page.tsx` refleja el estado real vía `GET /api/inscripciones/me`:
   sin inscripción (CTA a `/inscripcion`), `pendiente_verificacion` (aviso de
   espera), `rechazado` (muestra motivo + botón para reenviar), `pagado`
   (acceso normal al Aula Virtual).
5. La coordinadora ve la cola de verificación en `panel/pagos/page.tsx`
   (pestaña/filtro "Por verificar"), con el comprobante como miniatura
   clickeable, banco/referencia/fecha, y dos botones: **Confirmar** (mismo
   endpoint de siempre) o **Rechazar** (`PATCH /:id/rechazar-pago`, pide motivo
   con `window.prompt`).
6. Si se rechaza, la estudiante puede reenviar desde `/inscripcion` —
   el backend actualiza la MISMA inscripción en vez de duplicarla.

**Pendiente real (Plan B, si se implementa igual sin importar la pasarela de pago):**
contador visible de "pendientes por verificar" en la tarjeta "Pagos" del panel,
e índice único en `numeroReferencia` para evitar reuso de comprobantes (esto
último ya está aplicado en el modelo `Inscripcion`, ver `ARQUITECTURA_BACKEND.md`).

**Pasarela de pago automática:** en evaluación por la fundadora — ver
`ANALISIS_FACTIBILIDAD_PASARELA_PAGO.md` para el análisis completo (Azul como
opción principal, Stripe descartado por no operar para comercios domiciliados
en RD).

## Panel de coordinadora/admin — pantalla de tarjetas

Reemplaza la barra de navegación horizontal (pills) que existía antes.
`app/(coordinadora)/panel/page.tsx` es ahora la pantalla de inicio del panel:
tarjetas agrupadas en "Gestión del curso" (Pagos, Estudiantes, Aula virtual,
Exámenes, Diplomas), "Contenido público" (Noticias, Testimonios, FAQ) y "Solo
fundadora" (Contabilidad, Contenido de página — solo si `usuario.rol === "admin"`),
cada una con ícono de `lucide-react`. `panel/layout.tsx` y `admin/layout.tsx`
quedaron simplificados a solo header + link "volver". `admin/page.tsx` es
nuevo y solo redirige a `/panel`, ya que la sección admin vive ahí mismo.

## Open Graph / metadata para compartir en redes

`app/layout.tsx` tiene `metadataBase`, `openGraph` y `twitter` (Twitter Card)
generales, con `public/og-image.png` (1200×630, logo + fondo de marca) como
imagen por defecto. `app/noticias/[id]/page.tsx` tiene `generateMetadata`
dinámico — título/descripción reales de cada noticia + su propia imagen como
preview, o el OG genérico si no tiene imagen. Verificado funcionando en
Facebook y WhatsApp.

> Nota: esta misma página (`noticias/[id]/page.tsx`) había perdido por
> completo su lógica de detalle (like, comentarios, compartir) durante una
> sesión anterior de paginación — un cruce de copy-paste dejó ahí el código
> del listado en vez del detalle. Se restauró desde git y se le agregó el
> metadata dinámico de una vez. Ver `HISTORIAL_MODIFICACIONES.md`.

## Contenido editable por la fundadora

Inicio, Acerca de Nosotros, Kit de Preparación y Contacto se renderizan desde
`GET /api/contenido` (clave/valor) en vez de texto hardcodeado. El editor
(`admin/contenido-pagina/page.tsx`) es un menú de áreas (`AREAS`, definido en
el propio archivo) con etiquetas en español; si un campo definido ahí no
existe todavía en la base, muestra un mini-formulario para crearlo en el
momento. Imágenes (`acerca_de_historia_imagen`, `acerca_de_fundadora_imagen`)
se suben con el mismo `POST /api/uploads/imagen`.

## Notas de diseño
- Estilo institucional pero cálido: paleta rosa+azul de forma intencional
  (azul = estructura/confianza, rosa = acentos y CTAs).
- Mobile-first: la mayoría de las estudiantes acceden desde el celular.
- Botones de compartir en noticias: Facebook, WhatsApp, X + Web Share API
  nativo (fallback: copiar link).

## Testing antes de cada commit importante
- `npm run build` local sin errores antes de push.
- Probar flujo completo contra el backend real (el local casi no se usa,
  el flujo se prueba directo en producción): registro → login → inscripción
  (voucher o efectivo) → pago confirmado → aula virtual → examen → diploma.
- Verificar responsive en móvil antes de desplegar a Vercel.
- Toda ruta **nueva** (a diferencia de editar un archivo existente) requiere
  reiniciar `npm run dev` para que Next.js la detecte — Fast Refresh no
  alcanza para rutas nuevas.

## Pendiente real (frontend)
- "Me gusta" en comentarios individuales de noticias (no en la noticia).
- Conectar Kit de Preparación y Contacto a `contenidoPagina` (Inicio y Acerca
  de Nosotros ya están conectados).
- Badge con conteo de pendientes de verificar en la tarjeta "Pagos" del panel.
- Decidir si `/verificar-diploma` sigue siendo pública o se mueve dentro del
  panel de la estudiante logueada (pregunta abierta, sin resolver).
