# Arquitectura del Frontend — mav-rd-frontend

> Refleja el estado REAL del código al 04/08/2026. Reemplaza la versión
> anterior de este mismo archivo. Para el historial de cómo se llegó aquí,
> ver HISTORIAL_MODIFICACIONES.md.

Stack: Next.js 16 (App Router) + React 19 + Tailwind CSS v4 + lucide-react
(íconos) + despliegue en Vercel (muvo-rd.vercel.app).

## Infraestructura y despliegue

- Backend: https://mav-rd-backend.onrender.com/api (variable de entorno
  NEXT_PUBLIC_API_URL).
- CORS: el backend necesita FRONTEND_URL en Render apuntando exactamente
  a la URL de Vercel (sin / al final).
- Dominio: muvo-rd.vercel.app.

## ⚠️ Corrección pendiente de esta misma sección

Al pasar `app/(estudiante)/diploma/page.tsx` el 04/08/2026 se confirmó que
esa página vive bajo un grupo de ruta `(estudiante)` que **no estaba
documentado** en el árbol de carpetas de abajo (ahí sigue listada como
`diploma/page.tsx` plana, a la espera de confirmar). **No se sabe todavía**
si `dashboard`, `aula-virtual/[sesion]`, `examen/[intentoId]`,
`inscripcion` y `perfil/cambiar-password` también están bajo ese mismo
grupo, o si `diploma` es la única excepción. Confirmar y corregir el árbol
de abajo la próxima vez que se toque cualquiera de esas páginas — mientras
tanto, tratar el árbol de carpetas de esta sección como aproximado para
esas rutas específicas, no como fuente exacta.

## Estructura de carpetas (real)

Los grupos de ruta confirmados son (coordinadora) y (admin). Existe
además un grupo (estudiante) cuyo alcance real está sin confirmar del
todo — ver corrección arriba.

```
mav-rd-frontend/
├── app/
│   ├── page.tsx                          # Inicio
│   ├── acerca-de-nosotros/page.tsx
│   ├── kit-preparacion/page.tsx
│   ├── noticias/page.tsx                 # listado público, paginado
│   ├── noticias/[id]/page.tsx            # detalle, like, comentarios, compartir, OG dinámico
│   ├── testimonios/page.tsx
│   ├── faq/page.tsx
│   ├── verificar-diploma/page.tsx        # pública a propósito (ya no está en el navbar)
│   ├── login/page.tsx                    # + link "¿Olvidaste tu contraseña?"
│   ├── registro/page.tsx
│   ├── olvide-password/page.tsx
│   ├── restablecer-password/page.tsx     # usa <Suspense> por useSearchParams
│   ├── verificar-email/page.tsx          # usa <Suspense> por useSearchParams
│   ├── dashboard/page.tsx                # protegida, rol estudiante — ¿bajo (estudiante)? sin confirmar
│   ├── inscripcion/page.tsx              # auto-inscripción con voucher, con candado de email verificado
│   ├── aula-virtual/[sesion]/page.tsx
│   ├── examen/[intentoId]/page.tsx
│   ├── (estudiante)/
│   │   └── diploma/page.tsx              # CONFIRMADO bajo este grupo — ver sección de arriba
│   ├── perfil/cambiar-password/page.tsx
│   ├── (coordinadora)/
│   │   ├── panel/layout.tsx              # header simple + link volver
│   │   ├── panel/page.tsx                # pantalla de tarjetas (home del panel)
│   │   ├── panel/pagos/page.tsx          # inscripción manual + cola de verificación de vouchers
│   │   ├── panel/estudiantes/page.tsx    # 3 pestañas + archivar/reactivar (ver detalle abajo)
│   │   ├── panel/aula-virtual/page.tsx
│   │   ├── panel/examenes/page.tsx
│   │   ├── panel/diplomas/page.tsx
│   │   ├── panel/noticias/page.tsx
│   │   ├── panel/testimonios/page.tsx
│   │   └── panel/faq/page.tsx
│   ├── (admin)/
│   │   ├── admin/layout.tsx              # header simple + link volver a /panel
│   │   ├── admin/page.tsx                # redirige a /panel
│   │   ├── admin/contabilidad/page.tsx   # descarga de balance vía endpoint firmado
│   │   ├── admin/contenido-pagina/page.tsx
│   │   └── admin/notificaciones/page.tsx # CRUD de destinatarios email/Telegram
│   ├── layout.tsx                        # metadata general + Open Graph + Twitter Card
│   └── globals.css
├── components/
│   ├── ui/Paginacion.tsx
│   ├── layout/Navbar.tsx, Footer.tsx
│   ├── noticias/NoticiaAcciones.tsx, CompartirBotones.tsx
│   ├── auth/RutaProtegida.tsx
│   ├── dashboard/ProgresoCarretera.tsx   # barra de progreso ilustrada
│   └── contabilidad/
├── contexts/AuthContext.tsx              # Usuario incluye emailVerificado
├── public/
│   ├── logo-mav-rd.png
│   ├── og-image.png
│   └── inscripcion/                      # imágenes de la página de auto-inscripción
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

Tipografía: Poppins (títulos), Inter (cuerpo).

## Autenticación

- Login/registro guardan token + usuario en AuthContext + localStorage.
- Cada request protegido agrega Authorization: Bearer <token> a mano.
- Protección de rutas vía <RutaProtegida rolesPermitidos={[...]}> (cliente),
  no middleware.ts de servidor (no hay cookie).
- Usuario (tipo en AuthContext) incluye emailVerificado: boolean.
- Redirección post-login por rol: estudiante -> /dashboard, coordinadora/admin
  -> /panel.

## Variables de entorno

```
NEXT_PUBLIC_API_URL=https://mav-rd-backend.onrender.com/api
```

## Verificación de email y recuperación de contraseña

Sin cambios desde la versión anterior de este documento. Ambas páginas
públicas que usan `useSearchParams` (`verificar-email`, `restablecer-password`)
están envueltas en `<Suspense>` — obligatorio en Next.js App Router o el
build de producción falla al pre-renderizar.

## Inscripción y pagos (autoservicio con voucher)

Sin cambios desde la versión anterior. Pasarela de pago automática (Azul):
decisión cerrada, no se implementará.

## Panel de coordinadora/admin — pantalla de tarjetas

Sin cambios desde la versión anterior.

## Panel de estudiantes — pestañas (NUEVO 04/08/2026)

`app/(coordinadora)/panel/estudiantes/page.tsx`: 3 pestañas — **Activas**
(`activo:true`, sin diploma), **Graduadas** (`activo:true`, con diploma),
**Inactivas** (`activo:false`, archivadas, tengan o no diploma; se
decidió a propósito **no** combinar Graduadas e Inactivas en una sola
pestaña "Historial"). Cada pestaña hace su propia llamada a
`GET /usuarios` con `activo` y `conDiploma` como query params —
paginación independiente y exacta por pestaña, resuelta en el backend, no
cruzada en el frontend.

Desde el detalle de una estudiante: botón **Archivar cuenta** /
**Reactivar cuenta** (según el estado actual) que llama a
`PATCH /usuarios/:id/estado`, con aviso visible cuando la cuenta está
archivada ("no puede iniciar sesión mientras esté así").

Detalle de implementación (por si se repite el patrón en otra pantalla):
`cargarLista` vive en `useCallback([token])` para tener identidad estable
entre renders, y el `useEffect` de carga inicial depende de
`[token, pestana, cargarLista]` sin resetear estado manualmente dentro
del cuerpo del efecto — el reseteo de página/búsqueda al cambiar de
pestaña ocurre en `cambiarPestana()`, que es un manejador de evento. Este
patrón evita el warning de React `react-hooks/set-state-in-effect`
(llamar a `setState` de forma síncrona dentro de un `useEffect`).

## Diploma compartible en redes sociales (DISEÑADO, sin construir — próxima sesión)

`app/(estudiante)/diploma/page.tsx`: se agregará una segunda sección
debajo del botón actual "Ver / descargar mi diploma (PDF)", con una
**imagen de logro** generada en el navegador (`<canvas>`, no el PDF) a
partir de datos que la página ya tiene cargados (nombre de la estudiante,
código de verificación, fecha de emisión) — **100% frontend, sin cambios
de backend ni Cloudinary**.

Decisiones ya cerradas (ver HISTORIAL_MODIFICACIONES.md para el detalle
completo del acuerdo):

- Mensaje: "Comparte tu logro y anima a otra mujer a manejar con confianza".
- Botón: "Compartir mi logro", usa `navigator.share()` con fallback a
  descarga directa de la imagen si el navegador no lo soporta.
- Estilo: tarjeta azul marca (`#1B3A6B`), ícono de volante, "MUVO RD VIAL"
  arriba, nombre grande al centro, código + fecha abajo en chico, botón
  rosa marca (`#D6336C`).
- Formato/dimensiones exactas: sin definir todavía, solo debe verse bien
  compartida desde celular — decidir proporción (vertical tipo historia
  vs. cuadrada) al momento de construirlo.

## Barra de progreso ilustrada

Sin cambios desde la versión anterior de este documento.
`components/dashboard/ProgresoCarretera.tsx` — camino horizontal
ilustrado con 6 paradas, tramo recorrido pintado de color, transición
suave del carrito, mensaje motivacional dinámico, destello de celebración
al completar el diploma, todo respetando `prefers-reduced-motion`.

## Open Graph / metadata para compartir en redes

Sin cambios desde la versión anterior de este documento.

## Contenido editable por la fundadora

Sin cambios desde la versión anterior. Kit de Preparación y Contacto se
quedan como contenido estático por decisión de Ramon (no es prioridad).

## Notas de diseño

Sin cambios: paleta rosa+azul intencional, mobile-first (la mayoría de las
estudiantes entra desde el celular — motivo por el cual la barra de
progreso separa el texto del SVG, y por el cual el diploma compartible
debe verse bien en formato celular antes que nada).

## Testing antes de cada commit importante

- npm run build local sin errores antes de push — ESPECIAL cuidado con
  cualquier página nueva que use useSearchParams: SIEMPRE envolver en
  <Suspense>, si no el build de producción falla al pre-renderizar.
- Probar flujo completo contra el backend real.
- Verificar responsive en móvil antes de desplegar a Vercel.
- Toda ruta nueva requiere reiniciar npm run dev.
- Cuidado con `react-hooks/set-state-in-effect` en páginas con carga de
  datos + pestañas/filtros: usar `useCallback` para la función de carga y
  dejar que el `useEffect` dependa de ella, en vez de resetear estado a
  mano dentro del cuerpo del efecto (ver "Panel de estudiantes" arriba).

## Pendiente real (frontend)

- Diploma compartible en redes — diseño cerrado, construir la próxima
  sesión (ver sección de arriba).
- Confirmar y corregir el alcance real del grupo de ruta (estudiante) en
  este documento (ver aviso al inicio).
- "Me gusta" en comentarios individuales de noticias.
