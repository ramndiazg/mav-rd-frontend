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
