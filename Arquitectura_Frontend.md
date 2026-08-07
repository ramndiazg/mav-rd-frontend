# Arquitectura del Frontend — mav-rd-frontend

> Refleja el estado REAL del código al 07/08/2026. Reemplaza la versión
> anterior de este mismo archivo. Para el historial de cómo se llegó aquí,
> ver HISTORIAL_MODIFICACIONES.md.

Stack: Next.js 16 (App Router) + React 19 + Tailwind CSS v4 + lucide-react
(íconos) + `qrcode` (NUEVO — QR generado en el navegador, ver Diploma
compartible abajo) + despliegue en Vercel (muvo-rd.vercel.app).

## Infraestructura y despliegue

- Backend: https://mav-rd-backend.onrender.com/api (variable de entorno
  NEXT_PUBLIC_API_URL).
- CORS: el backend necesita FRONTEND_URL en Render apuntando exactamente
  a la URL de Vercel (sin / al final).
- Dominio: muvo-rd.vercel.app.

## ⚠️ Corrección pendiente (sin cambios esta sesión, sigue abierta)

Al pasar `app/(estudiante)/diploma/page.tsx` se confirmó que esa página
vive bajo un grupo de ruta `(estudiante)` que **no estaba documentado**
en el árbol de carpetas. **Sigue sin saberse** si `dashboard`,
`aula-virtual/[sesion]`, `examen/[intentoId]`, `inscripcion` y
`perfil/cambiar-password` también están bajo ese mismo grupo, o si
`diploma` es la única excepción. Tratar el árbol de abajo como
aproximado para esas rutas específicas.

## Audiencia del curso (cambio de alcance, 06/08/2026)

El curso **ya no es exclusivo para mujeres** — ahora también incluye
adolescentes de ambos sexos. Esto significa que todo texto nuevo o
tocado de aquí en adelante debe usar lenguaje neutral (no "mujer",
"lista", "otras estudiantes", etc.). Ya se corrigió en los archivos que
se tocaron esta sesión (ver detalle en cada sección abajo); **quedan
pendientes de revisar** las páginas que todavía no se han vuelto a tocar
(`testimonios`, `registro`, correos transaccionales en el backend, y
cualquier imagen/foto que muestre solo participantes de un género — las
fotos actuales en `public/inscripcion/` son de clases anteriores,
probablemente solo mujeres; reemplazarlas es trabajo de contenido, no de
código).

## Estructura de carpetas (real)

```
mav-rd-frontend/
├── app/
│   ├── page.tsx                          # Inicio — lenguaje neutral, marca actualizada (06/08/2026)
│   ├── acerca-de-nosotros/page.tsx
│   ├── kit-preparacion/page.tsx          # metadata + copy actualizados (06/08/2026)
│   ├── noticias/page.tsx
│   ├── noticias/[id]/page.tsx
│   ├── testimonios/page.tsx              # sin revisar esta sesión — pendiente
│   ├── faq/page.tsx                      # confirmado sin cambios necesarios
│   ├── verificar-diploma/page.tsx
│   ├── login/page.tsx
│   ├── registro/page.tsx                 # sin revisar esta sesión — pendiente
│   ├── olvide-password/page.tsx
│   ├── restablecer-password/page.tsx
│   ├── verificar-email/page.tsx
│   ├── dashboard/page.tsx                # SESIONES = [1,2,3,4] (06/08/2026)
│   ├── inscripcion/page.tsx              # lenguaje neutral (06/08/2026)
│   ├── aula-virtual/[sesion]/page.tsx    # confirmado: sin conteo quemado, sin lenguaje de género
│   ├── examen/[intentoId]/page.tsx       # confirmado: sin conteo quemado, sin lenguaje de género
│   ├── (estudiante)/
│   │   └── diploma/page.tsx              # diploma compartible construido (06/08/2026, ver detalle abajo)
│   ├── perfil/cambiar-password/page.tsx
│   ├── (coordinadora)/
│   │   ├── panel/layout.tsx
│   │   ├── panel/page.tsx
│   │   ├── panel/pagos/page.tsx
│   │   ├── panel/estudiantes/page.tsx
│   │   ├── panel/aula-virtual/page.tsx   # sin cambios de código; su selector de sesión depende de que existan Sesion — ver nota abajo
│   │   ├── panel/examenes/page.tsx       # sin cambios de código; mismo caso
│   │   ├── panel/diplomas/page.tsx
│   │   ├── panel/noticias/page.tsx
│   │   ├── panel/testimonios/page.tsx
│   │   └── panel/faq/page.tsx
│   ├── (admin)/
│   │   ├── admin/layout.tsx
│   │   ├── admin/page.tsx
│   │   ├── admin/contabilidad/page.tsx
│   │   ├── admin/contenido-pagina/page.tsx
│   │   └── admin/notificaciones/page.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/Paginacion.tsx
│   ├── layout/Navbar.tsx, Footer.tsx
│   ├── noticias/NoticiaAcciones.tsx, CompartirBotones.tsx
│   ├── auth/RutaProtegida.tsx
│   ├── dashboard/ProgresoCarretera.tsx   # rediseñado para 7 paradas (06/08/2026, ver detalle abajo)
│   └── contabilidad/
├── contexts/AuthContext.tsx
├── public/
│   ├── logo-mav-rd.png                   # logo real: azul marino #08244B, dorado #F8CB1A, rojo #D11523
│   ├── diploma-compartir.jpg             # NUEVO — foto de Unsplash (licencia libre, uso comercial permitido), usada en el diploma compartible
│   ├── og-image.png
│   └── inscripcion/
│       ├── teoria-1.jpg, teoria-2.jpg, teoria-3.jpg
│       ├── practica-vip.jpg
│       └── practica-normal-ilustracion.jpg
├── app/favicon.ico
├── tailwind.config.ts
├── .env.local.example
└── package.json
```

## Tokens de color (Tailwind) — sin cambios

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

Tipografía: Poppins (títulos), Inter (cuerpo). El logo real usa una
paleta distinta (azul marino, dorado, rojo) — se decidió mantener la
paleta azul/rosa de Tailwind para toda la UI de la app, y usar los
colores reales del logo solo donde el logo aparece embebido de forma
prominente (ver diploma compartible abajo, que combina ambas: degradado
azul→rosa de fondo, logo real superpuesto).

## Autenticación — sin cambios

## Sesiones — ahora son 4, no 3 (06/08/2026)

`dashboard/page.tsx`: `const SESIONES = [1, 2, 3, 4]`. Corregido también
el copy que decía "acceso a las 3 sesiones del curso".

**Nota importante para la próxima sesión de trabajo:** justo después de
este cambio se purgó la base de datos (ver DATABASE.md) y quedaron 0
documentos `Sesion`. Mientras no se recreen (con
`scripts/crearSesionesIniciales.js` en el backend), el dashboard va a
seguir marcando "Sesión 1: Disponible" para estudiantes nuevas — porque
esa lógica depende solo de `progreso.sesionActualDesbloqueada`, no
verifica si el documento `Sesion` existe — pero al entrar va a mostrar
"Sesión no encontrada". Comportamiento esperado dado el estado actual,
no es un bug.

También quedó expuesto que **el panel de coordinadora no tiene forma de
crear sesiones nuevas** (`panel/aula-virtual/page.tsx` y
`panel/examenes/page.tsx` solo _listan_ sesiones existentes vía
`GET /sesiones` — si esa lista viene vacía, no hay pestañas de sesión
que mostrar, y por lo tanto tampoco aparece el botón de "+ Agregar
material" ni se puede asignar un examen a una sesión). Ver
ARQUITECTURA_BACKEND.md para la solución adoptada (script de terminal,
no un endpoint nuevo).

## Barra de progreso ilustrada — rediseñada para 4 sesiones (06/08/2026)

`components/dashboard/ProgresoCarretera.tsx` — ahora tiene **7 paradas**
en vez de 6: Inicio, Sesión 1, Sesión 2, Sesión 3, Sesión 4, Práctica,
Diploma. Los extremos (Inicio en x=39, Diploma en x=630) se mantuvieron
en el mismo lugar a propósito, para no tener que tocar la carretera, la
línea de arrancada ni la zona de no rebasar — solo se recalcularon las 5
posiciones intermedias con espaciado parejo (~98-99px). El carrito sigue
el mismo patrón que ya tenía con la Sesión 3: al aprobar la última
sesión de teoría (ahora la 4), salta directo a la parada "Práctica" en
vez de pausar visualmente en la Sesión 4. Mensaje motivacional ampliado
para cubrir el caso de 2 sesiones aprobadas (antes solo cubría 0 y 1,
porque con 3 sesiones ese era el único hueco).

## Diploma compartible en redes sociales — CONSTRUIDO (06/08/2026)

`app/(estudiante)/diploma/page.tsx` — pasó de "diseñado, sin construir" a
implementado y entregado. Genera una imagen vertical tipo "historia"
(1080×1920, formato 9:16, pensado para WhatsApp Status/Instagram
Stories) 100% en el navegador con `<canvas>`, sin backend ni Cloudinary.

**Composición final de la imagen:**

- Franja de foto real arriba (`public/diploma-compartir.jpg`, foto libre
  de Unsplash, recortada tipo "cover" a 1080×700), con degradado oscuro
  en la base para legibilidad.
- Logo real (`public/logo-mav-rd.png`) recortado en círculo, superpuesto
  en la transición foto → fondo.
- Fondo degradado azul (`#1B3A6B`) → rosa oscuro (`#4A1236`) para el
  resto de la tarjeta.
- Nombre de la estudiante en grande (con wrap automático para nombres
  largos).
- **Sin código de diploma ni fecha en la imagen** — se decidió a
  propósito que esos datos se queden solo en la tarjeta del PDF, no en
  la imagen para compartir.
- Mensaje motivador enmarcado como oportunidad: "Tu oportunidad de
  aprender a manejar con confianza empieza aquí".
- Bloque blanco al fondo con QR + link de texto, ambos apuntando a
  `https://muvo-rd.vercel.app` (la página de inicio).

**Decisiones de diseño que se descartaron en el camino** (para que no se
vuelvan a proponer sin motivo): un ícono de volante dibujado a mano en
vez del logo real (descartado al conseguir el logo), y una paleta
tomada directo de los colores del logo — azul marino/dorado/rojo — para
toda la tarjeta (descartada porque la paleta azul/rosa de marca gustó
más; los colores del logo real solo se usan en el logo mismo, no en el
fondo).

**Dependencia nueva:** `qrcode` + `@types/qrcode` — el QR se genera
100% en el navegador con `QRCode.toDataURL()`, sin ningún servicio
externo.

**Detalle técnico importante:** tanto la foto como el logo tienen que
cargarse desde `public/` (mismo origen) — si el `<canvas>` carga una
imagen de otro dominio sin CORS configurado, el canvas queda
"contaminado" y `toBlob()` falla en silencio. Por eso la foto de
Unsplash se descargó y se guardó localmente en vez de referenciarla en
vivo.

**Botón "Compartir mi logro"**: usa `navigator.share()` con el archivo
PNG si el navegador lo soporta (celular), con fallback a descarga
directa si no (la mayoría de navegadores de escritorio). Maneja
`AbortError` (la estudiante cierra el diálogo sin elegir nada) sin
mostrar error falso.

**Pendiente para retomar**: agregar de vuelta una sección "Lo que
aprendiste" con los 3-4 temas reales del curso dentro de la imagen —
se dejó fuera a propósito porque los temas todavía no están definidos
(ver ARQUITECTURA_BACKEND.md, sección de sesiones).

## Testing antes de cada commit importante — sin cambios

## Pendiente real (frontend)

- Agregar la sección "Lo que aprendiste" (temas reales) a la imagen del
  diploma compartible, cuando estén definidos los 4 temas.
- Confirmar y corregir el alcance real del grupo de ruta (estudiante) —
  sigue sin resolverse.
- Revisar lenguaje de género en `testimonios/page.tsx` y
  `registro/page.tsx` — no se tocaron esta sesión.
- Reemplazar las fotos de `public/inscripcion/` cuando haya material
  nuevo que refleje la audiencia ampliada (adolescentes + mujeres) —
  trabajo de contenido/fotografía, no de código.
- Construir un formulario en `panel/aula-virtual/page.tsx` (o donde
  tenga más sentido) para renombrar sesiones desde el panel, en vez de
  requerir una petición manual a `PATCH /sesiones/:numero` — pospuesto a
  propósito, se retoma cuando haga falta.
- "Me gusta" en comentarios individuales de noticias.
