Bitácora del Frontend — Mujeres al Volante RD

Este archivo se actualiza al final de cada bloque de trabajo importante,
igual que BITACORA_1.md (la bitácora del backend). Contiene el historial
de decisiones, lo que se hizo, lo que falta y el contexto necesario para
que cualquier sesión futura (con Claude o con otro desarrollador) pueda
continuar sin perder información.

Cómo usar este archivo

Cada sesión de trabajo se agrega como una nueva entrada al final (orden cronológico).
No se borra historial anterior, solo se agrega.
Antes de empezar una sesión nueva, leer: este archivo completo →
BITACORA_1.md (backend) → DATABASE.md → Arquitectura_Backend.md
(o BACKEND_ACTUALIZADO.md si ya existe con ese nombre en el repo del
backend) → Arquitectura_Frontend.md.
Cada entrada debe responder: ¿qué se decidió?, ¿qué se construyó?, ¿qué
falta?, ¿hay bloqueos o dudas pendientes?

Resumen del proyecto (contexto heredado del backend)

Cliente: Mujeres al Volante RD (fundación sin fines de lucro, Santo
Domingo, República Dominicana).

Objetivo del frontend: Consumir el backend ya terminado y hosteado para
dar vida a las 12 secciones del sitio (públicas, estudiante, coordinadora,
admin) descritas en Arquitectura_Frontend.md.

Stack confirmado: Next.js (App Router) + Tailwind CSS, desplegado en
Vercel (tier hobby gratuito).

Roles del sistema: estudiante, coordinadora, admin (idéntico al
backend, ver BITACORA_1.md para las reglas de negocio completas).

Estado del backend (fuente de verdad, no duplicar lógica en el frontend)

URL de producción: https://mav-rd-backend.onrender.com
Repo: mav-rd-backend en GitHub (ramndiazg/mav-rd-backend)
Hosting: Render, tier free. Importante: el servicio se duerme tras
15 min de inactividad; el primer request después de eso tarda ~30-60s en
responder (cold start). El frontend debe mostrar un estado de carga que
contemple esa demora, especialmente en login/primera carga de la app —
no asumir que toda respuesta es instantánea.
Base de datos: MongoDB Atlas, DB mav_rd, Network Access con
0.0.0.0/0 habilitado (necesario para las IPs dinámicas de Render).
Autenticación: JWT en el body de la respuesta (no cookies). El
payload del token solo trae { id } — nada de rol ni nombre. Estrategia
obligatoria para el frontend: Context de React + localStorage, validar
con GET /api/auth/perfil al montar la app. Ver Arquitectura_Frontend.md
(sección ya corregida) para el detalle completo.
CORS: configurado con lista de orígenes permitidos (no un único
string). Actualmente acepta http://localhost:3000 y lo que esté en la
variable de entorno FRONTEND_URL de Render (separada por comas si hay
más de un dominio). Cuando se despliegue el frontend a Vercel, hay que
actualizar FRONTEND_URL en el dashboard de Render con la URL real, o
las peticiones desde producción serán bloqueadas por CORS.
Seguridad: se corrigió una fuga de passwordHash que existía en las
respuestas de registro, login, perfil y crearCoordinadora. Ya no
aparece en ningún endpoint. Si el frontend en algún momento ve ese campo
en una respuesta, es señal de que algo se regresó a una versión vieja del
backend — reportarlo, no es esperado.
Convención de respuestas: todo es JSON { success, data } o
{ success: false, error: "mensaje en español listo para mostrar" }. No
hay arrays de errores de validación — siempre un string único en error.

Cuentas de prueba disponibles (Atlas, base mav_rd)

EmailPasswordRolNotasmaria@test.com12345678adminCuenta de la fundadora de pruebaana@test.com12345678coordinadoraestudiante@test.com12345678estudianteCurso completo, diploma emitido (código MAV-2026-000001)

Datos placeholder que siguen ahí (no bloquean el frontend, pero no confundir
con datos reales): teoría de las 3 sesiones con contenido ficticio, exámenes
de prueba con preguntas "P1"–"P10" de una sola opción correcta.

Endpoints y shapes de respuesta ya verificados con el código real

(No asumir, esto ya se confirmó leyendo los controllers reales del backend.)

GET /api/progreso/me → si la estudiante no tiene pago confirmado,
responde 404 con error: "Aún no tienes un pago confirmado, por eso no hay progreso registrado." El dashboard debe tratar ese 404 como un estado
normal ("pendiente de pago"), no como error genérico.
POST /api/noticias/:id/like → no devuelve la noticia completa, solo
{ totalLikes, leDioLike }. Actualizar el contador de forma optimista con
esos dos valores.
POST /api/noticias/:id/comentarios → devuelve solo el comentario nuevo
creado, no el array completo. Hay que agregarlo al estado local a mano.
POST /api/intentos-examen/:id/iniciar → devuelve las preguntas sin
respuestaCorrectaIndex (el backend nunca expone la respuesta correcta al
cliente, ni siquiera oculta en el HTML — no está en el JSON).
POST /api/intentos-examen/:id/entregar → responde solo
{ calificacion, aprobado }, no el intento completo.
GET /api/diplomas/verificar/:codigo → público, responde con
nombreCompleto ya concatenado (nombre + apellido), no por separado.

Estructura de páginas planeada (de Arquitectura_Frontend.md)

Ver ese documento para el árbol completo de carpetas del App Router. Resumen
de agrupaciones:

(publico) — Inicio, Acerca de Nosotros, Kit de Preparación, Noticias,
Testimonios, FAQ, Verificar Diploma
(auth) — Login, Registro
(estudiante) — Dashboard, Aula Virtual, Examen, Diploma
(coordinadora) — Panel (pagos, aula virtual, diplomas, noticias,
testimonios, FAQ)
(admin) — Contabilidad

Paleta y tipografía

Azul #1B3A6B / #4A7FC9, rosa #D6336C / #FBE4EC, fondo #F7F8FA,
texto #1F2937. Tipografía: Poppins (títulos) + Inter (cuerpo). Ver
Arquitectura_Frontend.md para el token completo de Tailwind. Pendiente:
logo oficial en alta resolución para ajustar la paleta exacta (heredado del
backend, sigue sin resolver).

Historial de sesiones de trabajo

Sesión 1 — 04/07/2026 — Hosting del backend + fixes previos al frontend

Se hizo:

Revisión de los 4 documentos de arquitectura/base de datos y de la
bitácora del backend para tener contexto completo antes de tocar código.
Detectados y corregidos 2 problemas antes de desplegar:

Fuga de passwordHash en las respuestas de registro, login,
perfil (vía auth.js) y crearCoordinadora. Se corrigió con
.select("-passwordHash") re-consultando el documento antes de
responder (no alcanza con asignar undefined al campo en un
documento de Mongoose).
CORS con un único origen (process.env.FRONTEND_URL como string
fijo), que bloquearía local o producción al tener los dos activos a la
vez. Se cambió a una lista de orígenes permitidos vía función
origin de la librería cors.

Verificado en local con npm run dev + curl que login/perfil ya no
exponen passwordHash, y que /api/health sigue respondiendo bien.
Commit y push del fix a mav-rd-backend (commit 2e57f25).
Habilitado 0.0.0.0/0 en Network Access de MongoDB Atlas (necesario para
las IPs dinámicas de Render).
Backend desplegado en Render (Free tier) como Web Service, conectado a
MongoDB Atlas, build y deploy exitosos.
Verificado desde afuera: https://mav-rd-backend.onrender.com/api/health
responde correctamente.

Pendiente para la próxima sesión:

Confirmar con la persona si arrancamos por Login+Registro o por el
layout general (Navbar, Footer, Home) — no asumir, preguntar primero.
Scaffolding inicial: create-next-app con Tailwind, estructura de
carpetas de Arquitectura_Frontend.md, tokens de color en
tailwind.config.ts, fuentes Poppins/Inter.
Crear lib/api.ts (cliente fetch centralizado con
Authorization: Bearer automático) y lib/auth.ts (helpers de
sesión) siguiendo la corrección de autenticación ya documentada.
AuthContext + componente <RutaProtegida rolesPermitidos={[...]}>
en cliente (no middleware de servidor, el backend no usa cookies).
Actualizar FRONTEND_URL en las variables de entorno de Render en
cuanto exista una URL real de Vercel (por ahora sigue en
localhost:3000).
Repo mav-rd-frontend: confirmar que ya existe y está clonado
localmente, o crearlo.

Dudas / decisiones abiertas:

Ninguna nueva de esta sesión — las dudas abiertas heredadas del backend
(montos reales de planes, contenido teórico de las 3 sesiones, logo
oficial) siguen igual, ver BITACORA_1.md.

🚀 Cómo arrancar una sesión de frontend sin contexto de este chat

Si estás leyendo esto desde una conversación nueva sin el historial
anterior, esto es lo que necesitas saber:

Lee en este orden: este archivo completo → BITACORA_1.md (bitácora
del backend, tiene las reglas de negocio y roles completos) →
DATABASE.md → Arquitectura_Backend.md (o BACKEND_ACTUALIZADO.md si
ya se renombró en el repo) → Arquitectura_Frontend.md (el plan de
páginas es válido, la sección de autenticación ya está corregida ahí
mismo).
El backend YA ESTÁ desplegado y funcionando en
https://mav-rd-backend.onrender.com — no hay que montarlo de nuevo.
Verifica que sigue vivo con GET /api/health antes de asumir nada
(recuerda el cold start de ~30-60s si lleva rato dormido).
Antes de escribir cualquier código, pregúntale a la persona:

"¿el backend en Render sigue igual, o le hiciste cambios?"
"¿arrancamos por Login+Registro, o por el layout general (Navbar,
Footer, Home) primero?"
"¿ya existe el repo mav-rd-frontend y está clonado, o lo creamos?"

No dupliques lógica de negocio en el frontend (validación de nota
mínima, orden de sesiones, límite de intentos, etc.) — el backend ya la
aplica y es la fuente de verdad. El frontend solo refleja el estado que
el backend le da.
Recuerda la convención Bearer token, no cookies. Cualquier código
generado con middleware.ts de Next.js verificando JWT en cookie
httpOnly está mal — no aplica a este proyecto.
Usa las cuentas de prueba de la tabla de arriba para probar cada rol.

Sesión 2 — 04/07/2026 — Scaffolding + Home + páginas públicas simples

Se hizo:

npx create-next-app@latest corrido en el repo mav-rd-frontend
(Next.js 16, Tailwind v4, TypeScript, ESLint, App Router, sin carpeta
src/). Los 3 archivos de contexto (README.md, BITACORA_FRONTEND.md,
Arquitectura_Frontend.md) se movieron temporalmente fuera de la carpeta
durante el scaffolding y se devolvieron después — así se hace si hay que
repetir el proceso en otra carpeta con archivos preexistentes.
Cambio de arquitectura importante respecto a Arquitectura_Frontend.md:
Tailwind v4 (lo que instala create-next-app por defecto en Next 16) ya
no usa tailwind.config.ts con un objeto colors. Los tokens de
marca se definen ahora en app/globals.css con la directiva @theme,
que genera las utilidades automáticamente (--color-brand-blue →
bg-brand-blue, text-brand-blue, etc.). Mismo resultado visual, otra
sintaxis. Cualquier sesión futura debe usar @theme en globals.css,
no crear un tailwind.config.ts nuevo esperando que funcione igual que
Tailwind v3.
Fuentes Poppins (display) e Inter (body) cargadas vía next/font/google
en app/layout.tsx, expuestas como variables CSS y mapeadas a
--font-display / --font-body en el @theme.
Elemento de firma visual decidido: un divisor "línea de carretera"
(punteado, clase .road-divider en globals.css) usado entre secciones
grandes, en vez de un hairline genérico — temáticamente ligado a una
escuela de manejo.
Construidos y verificados en el navegador:

components/layout/Navbar.tsx — responsive, menú móvil funcional con
hamburguesa animada, enlaces a las 7 páginas públicas + login/registro.
components/layout/Footer.tsx — datos reales de la fundación (María
Díaz, 25/11/2017), enlaces rápidos.
app/page.tsx (Home) — hero, sección de las 3 sesiones numeradas
(numeración justificada: es una secuencia real y estricta del
negocio), teaser de testimonios, CTA final.
app/acerca-de-nosotros/page.tsx — contenido 100% placeholder
(marcado explícitamente con [Placeholder]), a la espera del texto
real de María Díaz y fotos en alta resolución (pendiente heredado del
backend, sigue sin resolver).
app/faq/page.tsx y app/testimonios/page.tsx — Server Components
async que consumen GET /api/faqs y GET /api/testimonios reales del
backend en Render, con revalidate: 60. Usan <details>/<summary>
nativos para el acordeón de FAQ (accesible sin JS extra).

Ajuste de UX en el Hero: el titular se veía forzado a 2 líneas de
forma poco elegante en desktop porque el grid dividía el espacio 50/50.
Se cambió a grid-cols-[3fr_2fr] y se redujo el tamaño de fuente del
h1 (de text-5xl a text-[2.5rem] en desktop).
Creado lib/api.ts: cliente fetch centralizado (apiFetch<T>) que
adjunta Authorization: Bearer automáticamente si hay token en
localStorage, y respeta la convención { success, data } /
{ success: false, error } del backend, lanzando Error(error) cuando
success es false.
Hallazgo importante al probar FAQ/Testimonios: ambas páginas
mostraban el mensaje de "no pudimos cargar" (pensado para fallos de
conexión / cold-start de Render). Se diagnosticó con curl directo a
GET /api/faqs y GET /api/testimonios en producción: el backend
responde perfecto ({"success":true,"data":[]}) — el problema real es
que no existe ningún FAQ ni testimonio creado todavía en la base de
datos (confirma lo que ya anotaba BITACORA_1.md: estos módulos nunca se
probaron con datos reales). Se corrigió el frontend para distinguir
"error de conexión" de "lista vacía": ambas páginas ahora devuelven
{ datos, error: boolean } desde su función de fetch, y muestran un
mensaje neutro ("Todavía no hay FAQ/testimonios publicados") en vez del
mensaje de alerta rosa cuando la lista está genuinamente vacía por falta
de contenido, no por fallo de red.
Variable de entorno confirmada en .env.local (no se sube a git):
NEXT_PUBLIC_API_URL=https://mav-rd-backend.onrender.com/api — el
frontend en desarrollo local ya consume el backend real de producción,
no un backend local. Si en el futuro se corre el backend en local para
algo puntual, hay que recordar cambiar esta variable y reiniciar
npm run dev (las env vars de Next solo se leen al arrancar).

Pendiente para la próxima sesión:

Decidir cómo llenar FAQ y Testimonios: o se crean unos cuantos de
prueba a mano vía curl/Postman ahora, o se espera a construir el
panel de coordinadora (que tendrá el CRUD real) y se llenan desde
ahí. Quedó sin decidir al cierre de esta sesión — preguntar primero.
Construir AuthContext (Context de React + localStorage) y el
componente <RutaProtegida rolesPermitidos={[...]}> en cliente.
Páginas de Login y Registro (app/login/page.tsx,
app/registro/page.tsx), consumiendo POST /api/auth/login y
POST /api/auth/registro vía lib/api.ts.
Validar en el registro los mismos campos obligatorios que el backend
exige: nombre, apellido, cédula, teléfono, email, password,
provincia, fechaNacimiento — el backend responde 400 con
"Todos los campos son obligatorios." si falta alguno, sin decir
cuál; el frontend debería validar antes de enviar para dar mejor
feedback específico por campo.
Páginas públicas que faltan: Kit de Preparación, Noticias (lista +
detalle), Verificar Diploma.
Al llegar a Login: recordar que el JWT decodificado solo trae
{ id } — el AuthContext debe guardar el objeto usuario
completo (con rol) que devuelve el login, no derivarlo del token.

Dudas / decisiones abiertas:

Ninguna decisión de negocio nueva. Las heredadas del backend (montos de
planes, contenido teórico real, logo oficial) siguen sin resolver, ver
BITACORA_1.md.

Nota sobre archivos del backend (mav-rd-backend) — sin cambios
pendientes: esta sesión sí tocó y corrigió 4 archivos del backend
(app.js, middleware/auth.js, controllers/authController.js,
controllers/usuarioController.js) — fix de fuga de passwordHash y de
CORS con múltiples orígenes. Esos cambios ya se hicieron commit y push
(commit 2e57f25) y ya están desplegados en Render. No hay nada
pendiente de aplicar en el backend al cierre de esta sesión.

Sesión 3 — 05/07/2026 — Datos de prueba, páginas públicas restantes, y bloque completo de Auth (AuthContext, Login, Registro, Dashboard, Navbar)

Se hizo:

- Backend confirmado sin cambios desde la Sesión 2 (verificado con la persona
  al inicio, siguiendo el protocolo de esta bitácora).
- Poblado de datos de prueba para FAQ y Testimonios (estaban vacíos desde que
  se construyeron, ver Sesión 2): se creó un script en Node
  (`seed.js`, usa `fetch` nativo, sin dependencias) que hace login y crea 8
  FAQs y 5 testimonios reales sobre el curso (inscripción, pago, sesiones,
  exámenes, diploma, INTRANT, recuperación de contraseña, y testimonios de
  "graduadas"). Es un script de un solo uso, no vive en ningún repo — se
  corrió localmente y se puede borrar.
- Hallazgo importante: el script falló con "No tienes permisos para realizar
  esta acción" al autenticarse como `ana@test.com` (coordinadora) para crear
  FAQ/testimonios, a pesar de que `Arquitectura_Backend.md` documenta esas
  rutas como `coordinadora, admin`. Se resolvió usando `maria@test.com`
  (admin) en su lugar, y el seed se completó con éxito (8/8 FAQs, 5/5
  testimonios). **Pendiente de investigar en el backend**: revisar
  `middleware/permitirRoles` en las rutas de `faqs` y `testimonios` para
  confirmar si el middleware solo acepta `admin` (documentación desactualizada)
  o si la cuenta de `ana` en Atlas no tiene el rol `coordinadora` como se
  asume. No bloquea el frontend, pero si una coordinadora real intenta crear
  FAQ/testimonios desde el futuro panel y le pasa lo mismo, va a parecer un
  bug del frontend cuando en realidad es de permisos del backend.
- Construida `app/kit-preparacion/page.tsx` + componente cliente
  `components/kit-preparacion/ModulosVideo.tsx` (acordeón de video, no carga
  los 21 iframes de una vez). Contenido migrado del sitio Weebly anterior
  (`aula-virtual.html`): simulador de examen INTRANT, link para agendar cita
  INTRANT, minimanual de vehículos livianos en PDF, y 21 módulos en video de
  YouTube. Los 21 módulos están hardcodeados en el archivo (no hay endpoint
  para esto en el backend, es contenido estático de marketing).
  - Nota: el link del PDF del minimanual traía un caracter `^` roto en el
    nombre de archivo original de Weebly; se dejó el link tal cual pero
    codificado como URL — no se confirmó si el PDF realmente carga, falta
    probarlo.
  - Nota: el link de "Agenda tu cita INTRANT" es `http://` (sin SSL, es un
    sistema gubernamental viejo en el puerto 82). Confirmado con la persona
    que en su navegador daba `ERR_SSL_PROTOCOL_ERROR` por tener activado el
    modo "HTTPS-only"/"usar siempre conexiones seguras". Se decidió NO agregar
    ninguna advertencia en la página por ahora — queda como riesgo conocido
    y aceptado: otras usuarias con ese modo activado en Chrome/Edge van a
    tener el mismo problema. Revisar si conviene agregar la advertencia más
    adelante si se reportan quejas.
- Construidas las páginas de Noticias:
  - `app/noticias/page.tsx` (listado, Server Component, mismo patrón de
    "distinguir error de conexión vs. lista vacía" que ya se usó en
    FAQ/Testimonios).
  - `app/noticias/[id]/page.tsx` (detalle, Server Component). Usa `params`
    como `Promise<{ id: string }>` con `await` (patrón Next 15+/16) —
    **confirmado sin errores de compilación**.
  - `components/noticias/NoticiaAcciones.tsx` (cliente): maneja like y
    comentarios. En el momento en que se construyó todavía no existía
    `AuthContext`, así que lee el token directamente con
    `useSyncExternalStore` sobre `localStorage` (no con `useEffect` +
    `setState`, que dispara el warning de lint `react-hooks/set-state-in-effect`
    de React 19 — se encontró y corrigió este error durante la sesión). Sin
    token, muestra "Inicia sesión para dar like o comentar" en vez de los
    controles activos. **Sigue pendiente** (ver más abajo): ahora que
    `AuthContext` ya existe, integrar este componente con `useAuth()` en vez
    de leer `localStorage` a mano — quedó marcado con un comentario `TODO`
    en el archivo, no se llegó a hacer en esta misma sesión.
  - `components/noticias/CompartirBotones.tsx` (cliente): Facebook, WhatsApp,
    X, y botón "Otra app" con Web Share API nativo (fallback: copiar link con
    `alert`, en vez de un toast — mejorar más adelante si se agrega un
    sistema de notificaciones visual).
  - Probado en el navegador con la noticia de prueba existente: funcionó
    correctamente.
- Construida `app/verificar-diploma/page.tsx` (client component simple, sin
  necesidad de dividir en subcomponentes). Consulta pública
  `GET /api/diplomas/verificar/:codigo`, sin login. Convierte el código a
  mayúsculas antes de consultar. Probado con el código real
  `MAV-2026-000001`: la respuesta trajo `nombreCompleto`, `codigoVerificacion`
  y `fechaEmision` tal como se había asumido. **Queda confirmado**: la forma
  de la respuesta de este endpoint es la que está documentada ahora en este
  archivo (ver sección de endpoints verificados, arriba).
- Con estas tres páginas, **quedaron completas las 7 páginas públicas** del
  sitio: Inicio, Acerca de Nosotros, Kit de Preparación, Noticias,
  Testimonios, FAQ y Verificar Diploma.
- Cambio de flujo de trabajo acordado con la persona: de ahora en adelante,
  cualquier código para pegar en el repo se entrega como archivo descargable
  (usando la herramienta de archivos), no pegado directamente en el chat —
  se detectó que copiar bloques de código largos desde el chat corrompía
  caracteres especiales al pegarlos en Windows.
- **Bloque de Auth construido completo en la misma sesión** (no se cerró
  después de las páginas públicas, se decidió seguir):
  - `contexts/AuthContext.tsx`: expone `usuario`, `token`, `cargando`,
    `login()`, `registro()`, `logout()`. Al montar la app, si hay token en
    `localStorage`, lo valida contra `GET /api/auth/perfil`; si el backend
    responde con error (token vencido), lo borra. `login()` y `registro()`
    guardan token + usuario en `localStorage` y en el estado del contexto.
  - **Confirmado con una cuenta de prueba real**: `POST /api/auth/registro`
    SÍ devuelve `{ usuario, token }` igual que login (auto-loguea a la
    persona recién registrada). Esto no estaba documentado explícitamente en
    `Arquitectura_Backend.md` y ahora queda confirmado — el código de
    `AuthContext.tsx` ya lo maneja bien, no requiere cambios, pero vale la
    pena reflejarlo en la documentación del backend si se actualiza.
  - `components/auth/RutaProtegida.tsx`: componente cliente
    `<RutaProtegida rolesPermitidos={[...]}>` que redirige a `/login` si no
    hay sesión o el rol no encaja. Construido y usado por primera vez en el
    Dashboard, pero **todavía no probado con un rol que NO tenga acceso**
    (por ejemplo, entrar a `/dashboard` logueada como `admin`) — falta
    verificar que la redirección funcione en ese caso.
  - `app/login/page.tsx` y `app/registro/page.tsx`: formularios completos.
    Registro incluye los 8 campos obligatorios del backend (nombre, apellido,
    cédula, teléfono, email, password, provincia, fechaNacimiento), con
    `provincia` como lista desplegable de las 32 provincias de RD (decisión
    tomada con la persona). No incluyen "olvidé mi contraseña" porque no
    existe en el backend.
  - `app/dashboard/page.tsx`: primera pantalla protegida real, envuelta en
    `<RutaProtegida rolesPermitidos={["estudiante"]}>`. Consulta
    `GET /api/progreso/me` para mostrar el estado de las 3 sesiones (bloqueada
    / disponible / aprobada) y un link a "Ver mi diploma" si
    `cursoCompletado`. **Decisión/suposición importante sin confirmar
    todavía**: el backend NO tiene ningún endpoint para que una estudiante
    consulte el estado de su propia inscripción/pago (`/api/inscripciones`
    es exclusivo de coordinadora/admin). Se asumió que si
    `GET /api/progreso/me` falla, es porque el pago sigue pendiente (ya que
    `ProgresoEstudiante` solo se crea al confirmar el pago, según
    `DATABASE.md`). Falta probar este flujo con una cuenta sin pago
    confirmado para confirmar que el mensaje "pago pendiente" se muestra
    correctamente y no un error genérico.
  - Los links a `/aula-virtual/[numero]` y `/diploma` desde el Dashboard dan
    404 por ahora — es esperado, esas páginas son el siguiente pendiente.
  - `components/layout/Navbar.tsx` actualizado para integrarse con
    `AuthContext`: si hay sesión, muestra "Hola, {nombre}" + link "Mi panel"
    - botón "Cerrar sesión" (tanto en desktop como en el menú móvil); si no
      hay sesión, se ve igual que antes (Iniciar sesión / Crear cuenta). El
      link "Mi panel" apunta a `/dashboard` solo si `rol === "estudiante"` — se
      dejó un `TODO` en el código para actualizarlo cuando existan los paneles
      de coordinadora/admin.
  - **Dos bugs visuales encontrados y corregidos en el Navbar durante la
    prueba**, ambos relacionados con el layout, no con la lógica de auth:
    1. El breakpoint para pasar de menú hamburguesa a fila completa estaba en
       `lg:` (1024px). Con 7 links + botones de sesión, en el rango
       1024–1280px (típico de un navegador windowed en laptop, no
       maximizado) no cabía todo en una fila y el texto de cada link se
       partía en dos líneas. Se subió el breakpoint a `xl:` (1280px) en todo
       el archivo, y se agregó `whitespace-nowrap` como resguardo.
    2. El título y el primer link, y el último link con el bloque de sesión,
       quedaban pegados sin espacio. Causa: el contenedor usa
       `justify-between` con 3 hijos (logo, nav, bloque de sesión); cuando el
       contenido ya llena casi todo el ancho disponible, no queda espacio
       "extra" que `justify-between` pueda repartir entre esos 3 bloques,
       aunque el `gap-5` interno de los links sí seguía funcionando entre
       ellos. Se corrigió agregando un `gap-6` fijo al contenedor principal,
       que garantiza una separación mínima entre bloques sin importar cuánto
       espacio sobre.
  - Se detectó y corrigió una duplicidad: el Dashboard tenía su propio saludo
    - botón "Cerrar sesión" en el header de la página, redundante con el que
      ya se agregó al Navbar. Se quitó el botón del Dashboard y se centró el
      saludo (el botón de cerrar sesión que queda es el del Navbar, siempre
      visible).
  - Todo probado en el navegador por la persona: registro, login, logout
    (implícito), navegación responsive, y el Dashboard con una cuenta con
    pago ya confirmado.

Pendiente para la próxima sesión:

- Construir el Aula Virtual: `app/aula-virtual/[sesion]/page.tsx` (teoría +
  videos de la sesión, según `numero <= sesionActualDesbloqueada`) y
  `app/examen/[intentoId]/page.tsx` (tomar examen, timer de 30 min, entrega
  y calificación). Revisar bien el flujo de `POST /api/examenes/:examenId/desbloquear`
  (lo hace la coordinadora, no la estudiante) antes de diseñar la pantalla.
- Construir `app/diploma/page.tsx` (vista de la estudiante para ver/descargar
  su propio diploma una vez `cursoCompletado`).
- Integrar `components/noticias/NoticiaAcciones.tsx` con `AuthContext` en vez
  de la lectura directa de `localStorage` (ver el `TODO` ya dejado en el
  archivo) — es un ajuste pequeño ahora que `useAuth()` ya existe.
- Probar `RutaProtegida` con un rol sin acceso (ej. loguearse como `admin` y
  entrar a `/dashboard` manualmente) para confirmar que redirige bien.
- Probar el Dashboard con una cuenta de estudiante SIN pago confirmado, para
  confirmar que el mensaje de "pago pendiente" se muestra correctamente (ver
  la suposición documentada arriba en "Se hizo").
- Empezar a planear los paneles de coordinadora y admin (inscripciones,
  pagos, desbloqueo de exámenes, diplomas, contabilidad) — es el bloque
  grande que queda después del Aula Virtual.
- Revisar en el backend (no bloquea el frontend, hacerlo cuando haya tiempo):
  por qué `ana@test.com` (coordinadora) no pudo crear FAQ/testimonios — ver
  el hallazgo documentado arriba en "Se hizo".
- Verificar si el link del minimanual PDF (Kit de Preparación) realmente
  carga o está roto — no se probó en esta sesión.

Dudas / decisiones abiertas:

- Confirmar si existe o conviene pedir un endpoint real
  `GET /api/inscripciones/me` (o similar) para que la estudiante consulte su
  propio estado de pago, en vez de inferirlo indirectamente de si
  `GET /api/progreso/me` tiene o no datos. Es una suposición razonable pero
  no es lo mismo que un endpoint explícito, y podría dar falsos positivos si
  el backend responde error por otra razón (token vencido, servidor caído,
  etc. — hoy todos esos casos se muestran igual como "pago pendiente").
- Decidir a qué ruta debe apuntar "Mi panel" en el Navbar para coordinadora y
  admin una vez existan esas páginas (hoy apunta a `/`, con un `TODO` en el
  código).
- Decidir si se agrega una advertencia visible sobre el link `http://` de
  cita INTRANT para usuarias con "HTTPS-only" activado (se decidió que no,
  por ahora, ver "Se hizo").
- Las dudas heredadas del backend (montos de planes, contenido teórico real,
  logo oficial) siguen sin resolver, ver `BITACORA_1.md`.

Sesión 6 — 05-06/07/2026 — Aula Virtual (teoría + examen) y bug crítico de sesión

Contexto: el backend ya había pasado por una ronda de correcciones (ver
Sesión 7 de `BITACORA_1.md`): nuevos endpoints `GET /api/inscripciones/me`,
`GET /api/intentos-examen/activo/:sesionId`, `POST /api/examenes/:sesionId/desbloquear`
(ahora recibe sesionId y asigna versión al azar), `PATCH /api/auth/cambiar-password`,
y el módulo `contenidoPagina`. Esta sesión de frontend construyó sobre esa base
ya corregida.

Se hizo:

- Construida `app/aula-virtual/[sesion]/page.tsx`: verifica el progreso con
  `GET /api/progreso/me`, muestra teoría (HTML) + videos si la sesión está
  desbloqueada, oculta el botón "Ir al examen" si la sesión ya está aprobada.
  El botón busca el intento activo con `GET /api/intentos-examen/activo/:sesionId`
  y navega a `/examen/{id}` — nunca asume o guarda el id manualmente.
- Construida `app/examen/[intentoId]/page.tsx`: inicia el intento automáticamente
  al montar (`POST /:id/iniciar`), timer de cuenta atrás con entrega automática
  al llegar a 0, selección de respuestas, entrega (`POST /:id/entregar`) y
  pantalla de resultado con calificación y aprobado/no aprobado.
- **Limitación real documentada en el código**: si la estudiante recarga la
  página después de iniciar el examen, no hay forma de recuperar las preguntas
  — el backend no tiene un endpoint para volver a pedirlas de un intento ya
  iniciado. Se muestra un mensaje pidiendo contactar a la coordinadora. Posible
  mejora futura (no urgente): agregar `GET /api/intentos-examen/:id` que
  devuelva las preguntas de un intento ya iniciado pero no entregado.
- **Bug crítico encontrado y corregido en `contexts/AuthContext.tsx`**:
  `verificarSesion()` (la función que valida el token guardado al montar la
  app) hacía `setUsuario(json.data)`, pero `GET /api/auth/perfil` responde
  `{ success: true, data: { usuario: {...} } }` — el usuario va anidado en
  `data.usuario`, no es `data` directamente. Esto dejaba `usuario.rol` como
  `undefined` en cualquier situación que dispare `verificarSesion()` en vez de
  `login()` (recargar la página, entrar por URL directa, abrir una pestaña
  nueva) — y `RutaProtegida` redirige a `/login` apenas el rol no coincide,
  así que el síntoma era "me manda a login sin razón" en esos casos. La
  función `login()` sí guardaba bien el usuario (usa `json.data.usuario`
  correctamente), por eso el bug no se notaba justo después de loguearse
  manualmente, solo en recargas/URLs directas. **Corregido**: ahora
  `verificarSesion()` también usa `json.data.usuario`. Este bug pudo haber
  estado afectando _cualquier_ página protegida desde que se construyó el
  bloque de Auth en la Sesión 5, no solo el Aula Virtual — vale la pena tenerlo
  en cuenta si algo más "fallaba sin razón" antes de esta corrección.
- Probado en el navegador de punta a punta con la cuenta de prueba `ana@test.com`:
  login → dashboard (Sesión 1 disponible, 2 y 3 bloqueadas) → aula virtual de
  la Sesión 1 (teoría placeholder visible) → examen (preguntas placeholder
  "P1"–"P10", timer visible) → entrega → resultado "100% ¡Aprobaste!" → vuelta
  al dashboard. Confirmado con curl en paralelo que
  `POST /entregar` responde `{"success":true,"data":{"calificacion":100,"aprobado":true}}`.
- Push a GitHub pendiente de confirmar en esta misma sesión (ver más abajo).

Pendiente para la próxima sesión:

- Construir `app/diploma/page.tsx` (vista de la estudiante para ver su propio
  diploma una vez `cursoCompletado`).
- Construir el panel de coordinadora para desbloquear sesiones desde la
  interfaz — hoy se hace exclusivamente con curl manual, lo cual no escala.
- Construir `panel/examenes/page.tsx` (CRUD del banco de preguntas, ahora que
  el backend soporta `PATCH`/`DELETE` — ver `Arquitectura_Backend.md`).
- Construir `admin/contenido-pagina/page.tsx` para editar los bloques de
  `contenidoPagina` ya sembrados (11 bloques reales, incluyendo los 21 módulos
  de video del Kit de Preparación — ver `BITACORA_1.md` Sesión 7).
- Reemplazar el contenido teórico y las preguntas de examen placeholder por
  contenido real, cuando la fundadora lo tenga listo.
- Revisar si el bug del `AuthContext` corregido esta sesión afectó algo más
  que no se haya notado todavía (por ejemplo, comportamiento raro reportado
  antes en otras páginas protegidas que se había atribuido a otra causa).

Dudas / decisiones abiertas:

- Las cuentas de prueba viejas (`ana@test.com`, etc.) tienen datos de
  `sesionActualDesbloqueada` que no reflejan un flujo de pago real reciente —
  no confundir avances de progreso vistos en pruebas con el comportamiento de
  una cuenta nueva real (que ahora sí inicia en 1 automáticamente).

Sesión 7 — 06/07/2026 — Panel completo de coordinadora/admin + página de Diploma + fixes de navegación

Contexto: bloque largo construyendo todo lo que quedó pendiente al final de
la Sesión 6, más varios bugs de navegación que aparecieron al probar con la
cuenta de admin (María) en vez de solo con estudiante.

**Decisión de contenido (no de código):** se definió que el examen de cada
sesión debe seguir siendo "sorpresa" (no se le da el banco de preguntas a la
estudiante de antemano), pero la `teoria` de cada sesión debe cubrir
explícitamente los temas que tocan las preguntas del examen correspondiente.
Aplica cuando se reemplace el contenido placeholder por el real.

**Bugs de navegación encontrados y corregidos:**

- `app/login/page.tsx` hacía `router.push("/dashboard")` fijo sin mirar el
  rol — coordinadora/admin nunca debían caer ahí (esa ruta está protegida
  solo para `estudiante`), así que terminaban rebotadas de vuelta a
  `/login` en un ciclo. Se agregó `rol` al tipo `ResultadoAuth` que devuelve
  `AuthContext.login()`, y el login ahora redirige a `/panel/pagos` si el rol
  es coordinadora/admin, o `/dashboard` si es estudiante.
- `components/layout/Navbar.tsx` tenía un `TODO` sin resolver: `destinoPanel`
  mandaba a coordinadora/admin a `/` porque esas rutas de panel no existían
  todavía cuando se escribió. Ya existen — corregido a `/panel/pagos`.

**Construido — Panel de coordinadora/admin (`app/(coordinadora)/panel/`):**

- `layout.tsx` compartido: protegido con `rolesPermitidos={["coordinadora","admin"]}`,
  con barra de navegación entre las 7 páginas del panel. Si el usuario es
  `admin`, aparece además un link a `/admin/contenido-pagina` (no lo ve
  coordinadora).
- `pagos/page.tsx`: crear inscripciones (con monto prellenado desde
  `GET /api/configuracion` según el plan elegido), listar con filtro
  Todas/Pendientes/Pagadas, confirmar pago.
- `aula-virtual/page.tsx`: buscar estudiante, ver su progreso, desbloquear
  sesiones (botón deshabilitado si intentaría saltar el orden).
- `examenes/page.tsx`: CRUD del banco de preguntas por sesión — crear
  versión, editar (`PATCH`), desactivar (`DELETE`, solo visible para `admin`,
  ya que el backend lo restringe así).
- `diplomas/page.tsx`: lista de elegibles (`GET /elegibles`) y botón para
  generar (`POST /:userId/generar`).
- `noticias/page.tsx`: CRUD de noticias con subida de imagen a
  `POST /api/uploads/imagen`, y moderación de comentarios (eliminar
  individualmente).
- `testimonios/page.tsx` y `faq/page.tsx`: mismo patrón (CRUD +
  activar/desactivar + orden), usando `GET /admin` para ver también los
  inactivos.

**Construido — Panel exclusivo de admin (`app/(admin)/admin/`):**

- `layout.tsx`: protegido con `rolesPermitidos={["admin"]}`, con link de
  vuelta al panel de coordinadora.
- `contenido-pagina/page.tsx`: edita los 11 bloques de `contenidoPagina` ya
  sembrados. Valida JSON antes de guardar los bloques de tipo `json` (como
  `kit_video_modulos`) para no guardar algo corrupto que rompería las
  páginas públicas al hacer `JSON.parse()`.

**Construido — Backend + Frontend del Diploma de estudiante:**

- Vacío detectado (mismo patrón que `inscripciones/me`): no existía
  `GET /api/diplomas/me`. Se agregó en el backend (ver `BITACORA_1.md`
  Sesión 8) antes de construir la página.
- `app/(estudiante)/diploma/page.tsx`: muestra código de verificación, fecha
  de emisión, y link de descarga del PDF si ya existe; mensaje claro si
  todavía no se ha generado.
- **No probado de punta a punta todavía**: ninguna cuenta de prueba tiene las
  3 sesiones aprobadas (`cursoCompletado: true`) — queda pendiente probar el
  flujo real (coordinadora genera → estudiante lo ve) con una cuenta que
  complete el curso desde el navegador, no simulando el estado directo en
  la base de datos.

**Patrón de lint importante para sesiones futuras — `react-hooks/set-state-in-effect`:**

Salió repetidas veces al construir estos paneles. La regla: un efecto NUNCA
debe llamar a `setState` de forma sincrónica en su cuerpo (antes de cualquier
`await`), ni siquiera indirectamente llamando a una función async definida
_fuera_ del efecto que internamente haga `setState` al inicio. El patrón que
sí pasa el lint:

```javascript
useEffect(() => {
  if (!condicion) return;
  let cancelado = false;

  (async () => {
    try {
      const res = await fetch(...);
      const json = await res.json();
      if (!cancelado && json.success) setEstado(json.data);
    } finally {
      if (!cancelado) setCargando(false);
    }
  })();

  return () => { cancelado = true; };
}, [dependencias]);
```

Es decir: la función async va **anidada dentro del efecto** (no definida
afuera y solo invocada desde él), y cualquier `setState` que deba pasar
"en true" antes de la carga (como un indicador de loading al cambiar de
pestaña/filtro) se pone en el **manejador de evento** que dispara el cambio
(el `onClick` del botón, por ejemplo), nunca en el efecto mismo. Aplicar este
patrón desde el principio en las páginas que falten construir, para no tener
que corregirlo después.

Pendiente para la próxima sesión:

- Probar de punta a punta el flujo de Diploma con una cuenta real completando
  las 3 sesiones desde el navegador.
- Reemplazar contenido teórico y preguntas de examen placeholder por
  contenido real (Ley 63-17), ahora que el Panel de Exámenes y las sesiones
  ya son editables.
- Corregir `sesionActualDesbloqueada` de las cuentas de prueba viejas que
  quedaron en 0 (ver `BITACORA_1.md`).
- Construir `admin/contabilidad/page.tsx` (todavía no existe ninguna página
  para ese módulo, aunque el backend ya lo soporta completo).
- Revisar diseño visual general ahora que todas las piezas funcionales están
  construidas — hasta ahora se priorizó funcionalidad sobre estética en los
  paneles internos.

Sesión 8 — 06-07/07/2026 — Logo, Contabilidad, y 8 correcciones grandes (incluye rediseño del Aula Virtual)

**Logo:** se recortó el logo real (circular, fondo de auto en la foto
original) con máscara de transparencia con anti-aliasing. Colocado en
`public/logo-mav-rd.png`. Agregado al Navbar (40×40, junto al nombre) y a la
página de Inicio (88×88, junto al `<h1>` del hero, apilado en móvil). También
reemplazó el favicon por defecto de Vercel (`app/favicon.ico`, generado en
4 tamaños: 16/32/48/64px).

**`admin/contabilidad/page.tsx` construida** — registrar movimientos
(entrada/salida, categoría, monto, fecha), filtros (mes/año/tipo/categoría,
con botón "Filtrar" explícito en vez de refetch por tecla), generar balance
mensual (upsert por mes/año), historial de balances con link directo al PDF.

**8 correcciones grandes tras usar la app en el navegador:**

1. **Rediseño del editor de Contenido de Página**: de "todo junto" (11
   bloques ilegibles para alguien no técnico) a un menú por área (Inicio,
   Acerca de Nosotros, Kit, Contacto), con etiquetas en español. Ver detalle
   técnico en `Arquitectura_Frontend.md`.
2. **Aula Virtual de coordinadora**: se agregó una lista "Listas para examen"
   (estudiantes pagadas + curso no completado, con nombre completo) antes del
   buscador manual — cruza `GET /inscripciones?estadoPago=pagado` con
   `GET /progreso/:userId` por cada una (sin endpoint agregado, todo del lado
   del frontend; **N+1 requests, vigilar si la fundación crece mucho**).
3. **Bug del diploma como archivo genérico** — corregido en el backend, ver
   `BITACORA_1.md` Sesión 9.
4. **Rediseño completo del Aula Virtual de la estudiante**: de "solo examen,
   nada de contenido real" a "contenido primero, examen se activa solo al
   terminar". Decisión de arquitectura tomada explícitamente con la persona:
   el desbloqueo pasó de ser 100% manual (coordinadora) a automático
   (disparado por el backend cuando la estudiante ve todo el contenido). Ver
   `Arquitectura_Backend.md` y `Arquitectura_Frontend.md` para el detalle
   completo — es el cambio más grande de esta sesión.
5. **Página de Inicio conectada a contenido editable**: título y texto del
   hero, y el texto de la tarjeta "Desde 2017", ahora vienen de
   `contenidoPagina` (con el texto viejo como respaldo si aún no se crean
   los bloques).
6. **Pestaña "Sin inscripción"** en `panel/pagos/page.tsx`: estudiantes
   registradas sin ninguna inscripción creada todavía, con botón directo
   "Crear inscripción" — evita que la coordinadora tenga que buscarlas una
   por una. Con la advertencia ya documentada de que `GET /api/usuarios`
   tiene límite de 50 (pendiente real del backend, no de esta función).
7. **Gestión de contenido de estudio** agregada a `panel/aula-virtual/page.tsx`
   como pestaña propia, junto a "Desbloquear exámenes" (que pasó a ser
   override/excepción, ver punto 4).
8. **Pestaña "Estudiantes"** nueva (`panel/estudiantes/page.tsx`): busca
   estudiante, muestra estado de pago y el historial completo de sus
   calificaciones por sesión (`GET /intentos-examen/estudiante/:userId`,
   endpoint nuevo).

**Bugs de ubicación de archivos encontrados en el camino (dejar como
recordatorio para no repetirlos):**

- La ruta real del Aula Virtual de estudiante es `app/aula-virtual/[sesion]/page.tsx`
  — **sin** el grupo `(estudiante)`, a diferencia de lo que este documento
  planeaba. Corregido en `Arquitectura_Frontend.md`.
- Se intentó colocar por error la página de "Estudiantes" (para
  coordinadora/admin) en `app/(estudiante)/panel/page.tsx` — esto habría
  producido un conflicto real de rutas duplicadas en Next.js, porque los
  grupos con paréntesis no agregan segmento a la URL: dos `panel/page.tsx` en
  grupos distintos resuelven al mismo `/panel` y Next.js falla el build.
  Corregido a `app/(coordinadora)/panel/estudiantes/page.tsx` antes de que
  se llegara a desplegar.

**Patrón de lint reafirmado** (`react-hooks/set-state-in-effect`): salió de
nuevo varias veces en esta sesión (`contenido-pagina`, `aula-virtual`
estudiante, `panel/estudiantes`). Se resolvió igual que en la Sesión 7:
mover la lógica async completa dentro del efecto como función anidada, y
dejar la función reutilizable de afuera solo para refrescar desde manejadores
de evento. Ver el patrón completo documentado en la Sesión 7, arriba.

Pendiente para la próxima sesión:

- [ ] Regenerar el diploma de prueba dañado por el bug viejo (ver `BITACORA_1.md`)
- [ ] Conectar Kit de Preparación y Contacto a `contenidoPagina` (Inicio y
      Acerca de Nosotros ya quedaron conectados)
- [ ] Construir `perfil/cambiar-password/page.tsx` (el backend ya lo soporta
      desde hace varias sesiones, nunca se construyó el frontend)
- [ ] Revisar si vale la pena mover el cruce N+1 de "Listas para examen" a un
      endpoint de backend dedicado, si la cantidad de estudiantes crece
- [ ] Diseño visual general de los paneles internos (sigue pendiente de
      sesiones anteriores)

Sesión 9 — 12/07/2026 — Vercel, Navbar, contraseña, imágenes, y descarga del diploma

**Primer despliegue a Vercel:** el frontend nunca había subido a producción
antes de esta sesión (solo se probaba local contra el backend de Render).
Pasos cubiertos: conectar el repo de GitHub en Vercel, configurar
`NEXT_PUBLIC_API_URL` como variable de entorno de Vercel, y agregar
`FRONTEND_URL` en Render con la URL real de Vercel para que CORS no
rechazara las peticiones (el backend ya tenía el código de CORS listo desde
antes, `origenesPermitidos` leído de `process.env.FRONTEND_URL` — solo
faltaba configurar la variable en el dashboard de Render). Encontramos y
corregimos un desajuste real: la variable no coincidía exactamente con la
URL del navegador.

**Navbar rediseñado:** con "Mi panel" + "Cambiar contraseña" +
"Cerrar sesión" como enlaces sueltos, se desbordaba en laptop — distinto
para estudiante y para admin/coordinadora, cada uno rompiéndose diferente
según cuánto contenido tuviera esa vista. Solución: menú desplegable
disparado por clic en "Hola, [nombre]", agrupando los tres. Ver detalle en
`Arquitectura_Frontend.md`.

**Nueva página: cambiar contraseña.** Bug real en el camino: se dio una
instrucción ambigua con dos rutas posibles ("con o sin grupo de carpeta"),
lo que produjo un 404 real porque Ramon pegó ambas por error. Lección para
sesiones futuras: nunca ofrecer dos alternativas de ruta de archivo, dar una
sola instrucción exacta. También confirmado (otra vez): una ruta **nueva**
necesita reiniciar `npm run dev`, no solo guardar el archivo.

**Imágenes en tres lugares nuevos** (Contenido de Página: imagen de
"Nuestra historia" y foto de la fundadora; Aula Virtual de coordinadora:
imagen de portada por material de estudio, visible después para la
estudiante). Se evaluó restringir la imagen del Aula Virtual solo a admin,
pero se decidió dejarla compartida con coordinadora, como el resto de esa
pantalla.

**Misión, Visión y Valores** conectados a `contenidoPagina` en
`acerca-de-nosotros/page.tsx` — antes eran texto fijo con `[Placeholder]`,
nunca se habían conectado.

**Descarga del diploma:** los links de descarga (estudiante y coordinadora)
cambiaron de apuntar directo a `diploma.urlPDF` a apuntar a los nuevos
endpoints del backend (`/api/diplomas/me/descargar?token=...` y
`/api/diplomas/:id/descargar?token=...`) — el token va por query string
porque un `<a href>` no puede mandar headers. Ver la saga completa del
porqué en `BITACORA_1.md` Sesión 10 — resumen: Cloudinary bloqueaba la
entrega pública de PDFs, y la solución fue una descarga firmada servida por
el backend.

**Contenido real cargado:** el Aula Virtual ya tiene 13 materiales de
estudio reales (antes placeholders) y 9 versiones de examen reales (antes
"P1...P10" de prueba) — sembrados por scripts de backend, sin tocar código
de frontend para esto.

**Cierre del punto "me gusta" (de la ronda de 8 correcciones):** al revisar
`NoticiaAcciones.tsx` y `noticias/[id]/page.tsx`, se confirmó que el botón de
"Me gusta" de la noticia ya existía y funcionaba correctamente — el reporte
original era una confusión de qué tan abajo había que hacer scroll para
verlo, no un vacío real. Se confirmó explícitamente con la persona que **no**
se quiere "me gusta" por comentario individual, solo el de la noticia
completa. Cerrado, sin cambios de backend ni de esquema.

**Compartir en Instagram y TikTok:** tampoco era un vacío real — el botón
"Otra app" ya disparaba `navigator.share()` (la Web Share API nativa), que en
celular abre el selector de apps del sistema operativo, donde Instagram,
TikTok y cualquier otra app instalada aparecen automáticamente (no existe un
link público de "compartir" al que cualquier sitio pueda apuntar para esas
dos plataformas, a diferencia de Facebook/WhatsApp/X). Se renombró el botón
a "Instagram, TikTok y más" para que sea obvio que ahí es donde viven, sin
cambiar la lógica.

Pendiente para la próxima sesión:

- [ ] Confirmar visualmente en producción que el logo aparece en el
      diploma generado (depende de que el archivo esté en el backend, no
      del frontend).
- [ ] Revisión de diseño visual general de los paneles internos (sigue
      pendiente de sesiones anteriores).
