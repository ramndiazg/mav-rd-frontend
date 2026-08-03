# Arquitectura del Frontend — mav-rd-frontend

> Refleja el estado REAL del código al 03/08/2026. Reemplaza la versión
> anterior de este mismo archivo. Para el historial de cómo se llegó aquí,
> ver HISTORIAL_MODIFICACIONES.md.

Stack: Next.js 16 (App Router) + React 19 + Tailwind CSS v4 + lucide-react
(íconos) + despliegue en Vercel (mav-rd-vial.vercel.app).

## Infraestructura y despliegue

- Backend: https://mav-rd-backend.onrender.com/api (variable de entorno
  NEXT_PUBLIC_API_URL).
- CORS: el backend necesita FRONTEND_URL en Render apuntando exactamente
  a la URL de Vercel (sin / al final).
- Dominio: mav-rd-vial.vercel.app (ya renombrado, definitivo).

## Estructura de carpetas (real)

Los únicos grupos de ruta reales son (coordinadora) y (admin). El resto de
páginas públicas/auth/estudiante viven en carpetas planas.

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
│   ├── olvide-password/page.tsx          # NUEVO
│   ├── restablecer-password/page.tsx     # NUEVO (usa <Suspense> por useSearchParams)
│   ├── verificar-email/page.tsx          # NUEVO (usa <Suspense> por useSearchParams)
│   ├── dashboard/page.tsx                # protegida, rol estudiante — ver detalle abajo
│   ├── inscripcion/page.tsx              # auto-inscripción con voucher, con candado de email verificado
│   ├── aula-virtual/[sesion]/page.tsx
│   ├── examen/[intentoId]/page.tsx
│   ├── diploma/page.tsx
│   ├── perfil/cambiar-password/page.tsx
│   ├── (coordinadora)/
│   │   ├── panel/layout.tsx              # header simple + link volver
│   │   ├── panel/page.tsx                # pantalla de tarjetas (home del panel)
│   │   ├── panel/pagos/page.tsx          # inscripción manual + cola de verificación de vouchers
│   │   ├── panel/estudiantes/page.tsx    # maneja los 4 estados de estadoPago
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
│   │   └── admin/notificaciones/page.tsx # NUEVO — CRUD de destinatarios email/Telegram
│   ├── layout.tsx                        # metadata general + Open Graph + Twitter Card
│   └── globals.css
├── components/
│   ├── ui/Paginacion.tsx
│   ├── layout/Navbar.tsx, Footer.tsx
│   ├── noticias/NoticiaAcciones.tsx, CompartirBotones.tsx
│   ├── auth/RutaProtegida.tsx
│   ├── dashboard/ProgresoCarretera.tsx   # NUEVO — barra de progreso ilustrada
│   └── contabilidad/
├── contexts/AuthContext.tsx              # Usuario ahora incluye emailVerificado
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
- Usuario (tipo en AuthContext) ahora incluye emailVerificado: boolean.
- Redirección post-login por rol: estudiante -> /dashboard, coordinadora/admin
  -> /panel (la pantalla de tarjetas, vía /panel/pagos hoy en el código real
  del login, revisar si sigue apuntando ahí o ya a /panel directo).

## Variables de entorno

```
NEXT_PUBLIC_API_URL=https://mav-rd-backend.onrender.com/api
```

## Verificación de email y recuperación de contraseña (NUEVO)

- Al registrarse, la cuenta queda sin verificar pero puede loguearse y usar
  el dashboard con normalidad.
- dashboard/page.tsx muestra un aviso discreto (rosa, con botón "Reenviar
  correo") si usuario.emailVerificado es false.
- app/inscripcion/page.tsx bloquea el formulario (muestra el mismo tipo de
  aviso + botón de reenvío) si el correo no está verificado, en vez de
  mostrar el formulario real.
- app/verificar-email/page.tsx (pública) lee ?token= de la URL con
  useSearchParams, envuelto en <Suspense> (obligatorio en Next.js App
  Router o el build falla al pre-renderizar).
- app/olvide-password/page.tsx (pública) pide el correo y llama a
  POST /auth/olvide-password.
- app/restablecer-password/page.tsx (pública, también con <Suspense>) pide
  la contraseña nueva y llama a POST /auth/restablecer-password con el
  token de la URL.
- app/login/page.tsx tiene un link "¿Olvidaste tu contraseña?" que lleva a
  /olvide-password.

## Inscripción y pagos (autoservicio con voucher)

Sin cambios de flujo desde la versión anterior de este documento, con dos
adiciones:

- app/inscripcion/page.tsx ahora también verifica usuario.emailVerificado
  antes de mostrar el formulario (ver sección de arriba).
- El número de cuenta bancaria real (Banco Popular Dominicano y Banco De
  Reservas) ya está colocado y confirmado — quedó verificado por Ramon.
  Cada cuenta se muestra en su propia tarjeta con un botón "Copiar" que
  copia el número al portapapeles (navigator.clipboard), con feedback
  visual de "Copiado" por 2 segundos.

Pasarela de pago automática (Azul): decisión tomada, NO se implementará por
ahora. La auto-inscripción con voucher ya resuelve la necesidad real.

## Panel de coordinadora/admin — pantalla de tarjetas

app/(coordinadora)/panel/page.tsx: tarjetas con íconos de lucide-react,
agrupadas en "Gestión del curso", "Contenido público" y "Solo fundadora"
(esta última solo si usuario.rol === "admin"). El grupo "Solo fundadora"
ahora tiene 3 tarjetas: Contabilidad, Contenido de página, y
Notificaciones (nueva).

## Sistema de notificaciones — panel de administración

app/(admin)/admin/notificaciones/page.tsx (nuevo): CRUD simple de
destinatarios (tipo email o Telegram, etiqueta, valor, activo/inactivo).
Mismo patrón visual que el resto de CRUDs del panel (lista + formulario de
edición que reemplaza la lista).

## Barra de progreso ilustrada (rediseñada 01-03/08/2026)

components/dashboard/ProgresoCarretera.tsx: camino horizontal estilo
carretera (asfalto con degradado, línea central amarilla intermitente de
principio a fin + línea continua desde la mitad indicando zona de no
rebasar, línea de arrancada a cuadros al inicio) con 6 paradas: Inicio,
Sesión 1, Sesión 2, Sesión 3 (libro con check al aprobar cada examen),
Práctica en vehículo (ícono de guía, siempre neutro — no se rastrea en la
app), y Diploma (bandera a cuadros, se pinta de color + check cuando
GET /diplomas/me confirma que ya existe). El carrito se posiciona
automáticamente según progreso.sesionesAprobadas.length, y salta hasta la
bandera si diplomaListo es true.

Rediseño de esta sesión — antes era estática, ahora tiene vida:

- El tramo de la línea central ya recorrido se pinta sólido y de color
  (no solo el carrito indica avance, la carretera misma lo muestra).
- El carrito se desliza con una transición suave al cambiar de parada
  (CSS transition sobre transform, easing con leve rebote) y tiene un
  balanceo sutil constante mientras está detenido.
- Mensaje motivacional debajo del contador ("2 de 3 sesiones aprobadas"),
  con texto distinto según la etapa (ej. "Vas bien — la Sesión 2 ya está
  disponible"). Función mensajeMotivacional() dentro del mismo componente.
- Cuando diplomaListo es true: la bandera ondea (animación de skew) y se
  dispara un destello de celebración (pequeños círculos que se expanden y
  desvanecen) — único momento "llamativo" del componente, todo lo demás
  se mantiene discreto a propósito.
- Todas las animaciones respetan prefers-reduced-motion (desactivadas por
  completo si el sistema del usuario lo pide) — reglas nuevas en
  app/globals.css, al final del archivo, después de .road-divider.
- La transición del tramo recorrido usa CSS transition sobre el atributo
  SVG x2 — funciona en navegadores modernos; en navegadores muy viejos
  simplemente no anima (salta), no se rompe.

Se colocó justo arriba del listado de sesiones en app/dashboard/page.tsx.
Las etiquetas de texto van como HTML normal debajo del SVG (no dentro del
viewBox) para que no se encojan ilegibles en pantallas angostas de celular.

dashboard/page.tsx ahora, cuando progreso.cursoCompletado es true, también
llama a GET /diplomas/me para saber si ya se generó el diploma y pasarle
ese dato (diplomaListo) al componente. Además, cada tarjeta de sesión
ahora muestra un ícono según su estado (candado/libro/check, lucide-react)
y entra con un fundido escalonado (session-card-in en globals.css) al
cargar la página.

## Open Graph / metadata para compartir en redes

Sin cambios desde la versión anterior de este documento.

## Contenido editable por la fundadora

Sin cambios desde la versión anterior. Kit de Preparación y Contacto se
quedan como contenido estático por decisión de Ramon (no es prioridad).

## Notas de diseño

Sin cambios: paleta rosa+azul intencional, mobile-first (la mayoría de las
estudiantes entra desde el celular — motivo por el cual la barra de
progreso separa el texto del SVG, y por el cual se prefirió un diseño
horizontal compacto sobre uno más elaborado).

## Testing antes de cada commit importante

- npm run build local sin errores antes de push — ESPECIAL cuidado con
  cualquier página nueva que use useSearchParams: SIEMPRE envolver en
  <Suspense>, si no el build de producción falla al pre-renderizar (pasó
  con verificar-email, ya corregido, y se aplicó desde el inicio en
  restablecer-password).
- Probar flujo completo contra el backend real.
- Verificar responsive en móvil antes de desplegar a Vercel.
- Toda ruta nueva requiere reiniciar npm run dev.

## Pendiente real (frontend)

- "Me gusta" en comentarios individuales de noticias.
