# Historial de modificaciones — Muvo RD Vial

> Registro breve por sesión. El estado actual y detallado del sistema vive en
> `ARQUITECTURA_BACKEND.md`, `ARQUITECTURA_FRONTEND.md` y `DATABASE.md` — este
> archivo es solo un changelog, no la fuente de verdad de cómo funciona nada.

## 25/07/2026 — Auto-inscripción con voucher + reorganización de documentación

- Nuevo flujo de auto-inscripción: la estudiante elige plan, sube su propio
  comprobante de depósito/transferencia (banco, referencia, fecha, foto) sin
  que la coordinadora tenga que crear nada primero. Backend: `Inscripcion`
  gana 4 campos + 2 estados nuevos (`pendiente_verificacion`, `rechazado`);
  nuevos endpoints `POST /inscripciones/mia` y `PATCH /:id/rechazar-pago`.
  Frontend: `app/inscripcion/page.tsx` (nuevo, con contenido de marketing y
  fotos reales del curso), `dashboard/page.tsx` maneja los 4 estados de pago,
  `panel/pagos/page.tsx` tiene cola de verificación con comprobante visible.
- Fix: `POST /api/uploads/imagen` estaba restringido a coordinadora/admin — se
  agregó el rol `estudiante` para que pudiera subir su voucher.
- Precios de planes actualizados en `configuracion`: Normal RD$1,000, VIP RD$7,000.
- Se consolidaron los 6 documentos de contexto en 4: `ARQUITECTURA_BACKEND.md`,
  `ARQUITECTURA_FRONTEND.md`, `DATABASE.md` (actualizado) y este historial.
  Las bitácoras (`BITACORA_1.md`, `BITACORA_FRONTEND.md`) quedan absorbidas.

## 24-25/07/2026 — Panel de administración a tarjetas

- `app/(coordinadora)/panel/page.tsx` (nuevo): pantalla de tarjetas con íconos
  (`lucide-react`, nueva dependencia) agrupadas en "Gestión del curso",
  "Contenido público" y "Solo fundadora" (esta última solo admin). Reemplaza
  la barra de pills que existía antes.
- `panel/layout.tsx` y `admin/layout.tsx` simplificados a solo header + link
  "volver". `admin/page.tsx` (nuevo) redirige a `/panel`.
- Se actualizó Next.js de 16.2.10 a 16.2.11 (parche) resolviendo 3 de 4
  vulnerabilidades `high` de `npm audit`. Queda pendiente 1 (`brace-expansion`
  vía ESLint), requiere salto de versión mayor de ESLint — no urgente.

## 22-23/07/2026 — Open Graph + bug crítico de detalle de noticia

- Open Graph completo: `app/layout.tsx` con `metadataBase`/`openGraph`/`twitter`,
  `public/og-image.png` generada, `generateMetadata` dinámico en
  `noticias/[id]/page.tsx`. Verificado en Facebook/WhatsApp.
- **Bug encontrado:** la sesión de paginación anterior había pegado por error
  el código del listado (`noticias/page.tsx`) encima del detalle
  (`noticias/[id]/page.tsx`) — el clic en una noticia no llevaba a ningún lado,
  y los componentes `CompartirBotones`/`NoticiaAcciones` (like + comentarios)
  existían pero no estaban conectados a ninguna página. Se recuperó el archivo
  original desde git (commit previo a la paginación) y se restauró.
- Análisis de factibilidad de pasarela de pago en RD entregado (ver
  `ANALISIS_FACTIBILIDAD_PASARELA_PAGO.md`) — Azul recomendado como opción
  principal, Stripe descartado, transferencia manual con mejoras (Plan B)
  documentado como respaldo. Pendiente de decisión de la fundadora.

## 22/07/2026 — Sesión larga: correcciones + paginación

- Firma del diploma, rebranding a "Muvo RD Vial", fix de embeds de YouTube,
  correctas/incorrectas por pregunta en el examen, progreso automático entre
  sesiones con espera de 24h entre exámenes (override manual disponible),
  logo circular + favicon nuevos, incidente de dominio en Vercel resuelto
  (CORS necesita `FRONTEND_URL` exacto, sin lista de orígenes todavía).
- Paginación implementada en Estudiantes, Noticias y Movimientos contables.
- Diseñado pero NO aplicado (pausado a propósito por Ramon, para revisar la
  app completa primero): panel de admin a tarjetas (aplicado después, ver
  arriba) y rediseño del PDF de balance de contabilidad + fix de extensión
  `.pdf` (sigue sin aplicar).

## Antes del 22/07/2026 — Construcción inicial (backend + frontend)

Ver `ARQUITECTURA_BACKEND.md` y `ARQUITECTURA_FRONTEND.md` para el resultado
final de esta etapa. Resumen: autenticación JWT sin cookies, 3 roles
(estudiante/coordinadora/admin), flujo completo de inscripción → pago →
3 sesiones con contenido y examen → diploma con descarga firmada desde
Cloudinary, panel de coordinadora/admin con CRUD de noticias/testimonios/FAQ/
contenido de página/contabilidad. Contenido real sembrado: 13 materiales de
estudio y 9 versiones de examen basados en Ley 63-17 e INTRANT.

---

## Pendientes abiertos (no resueltos, de cualquier sesión)

- Seguridad: rotar `JWT_SECRET`/Mongo/Cloudinary; rate limiting en login y
  verificación de diploma; CORS con lista de orígenes.
- Confiabilidad: monitoreo de errores (Sentry); confirmar backups de Atlas;
  tests unitarios para `intentarDesbloquear()`.
- Contabilidad: rediseño de PDF de balance + fix de descarga sin extensión.
- Panel de admin: badge de conteo de pendientes por verificar en tarjeta "Pagos".
- Decidir si `/verificar-diploma` sigue pública o se protege.
- Conectar Kit de Preparación y Contacto a `contenidoPagina`.
- Pasarela de pago automática (Azul) — pendiente de decisión de la fundadora.
- Datos bancarios reales en `app/inscripcion/page.tsx` (hoy hay un placeholder
  de ejemplo, marcado con `TODO` en el código).
