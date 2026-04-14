# Arquitectura de Seguridad

## Autenticación

- **Google OAuth exclusivo**: No existe registro propio, no hay formularios de usuario/contraseña.
- **Whitelist de email**: El callback `signIn` de NextAuth compara `profile.email` con `ALLOWED_EMAIL`. Cualquier otro email es rechazado en el servidor, antes de crear sesión.
- **JWT firmado**: Las sesiones usan JWT firmado con `NEXTAUTH_SECRET` (mínimo 32 chars). Sin NEXTAUTH_SECRET válido, los tokens son inválidos.
- **Expiración de sesión**: 24 horas. Tras expiración, el middleware redirige a `/login`.

## Protección de rutas

El middleware de Next.js (`src/middleware.ts`) intercepta **todas las requests** antes de que lleguen a cualquier componente o API Route:

```
Request → Middleware → ¿Sesión válida? → Sí → Contenido
                                       → No → Redirect /login
```

Rutas públicas (no protegidas):
- `/login`
- `/api/auth/*` (callbacks de NextAuth)
- Assets estáticos (`_next/static`, `_next/image`, etc.)

## Base de datos

- **Supabase nunca se accede desde el cliente**: Solo desde API Routes de Next.js usando `SUPABASE_SERVICE_ROLE_KEY`.
- **RLS habilitado**: Row Level Security activo en ambas tablas. Sin políticas públicas — el `service_role` bypasea RLS.
- **La `SUPABASE_SERVICE_ROLE_KEY` es una variable de servidor**: Nunca se incluye en el bundle del cliente.

## Endpoint del cron

`/api/cron/check-expiry` verifica el header `Authorization: Bearer <CRON_SECRET>` en cada invocación. Sin este header, responde `401` sin ejecutar lógica.

## Headers de seguridad HTTP

Configurados en `next.config.ts`:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy` — restringe orígenes de scripts, estilos e imágenes

## Página de login

La página `/login` está diseñada para no revelar información sobre el sistema:
- Sin referencias a "Next.js", "Supabase", "dashboard" ni rutas internas
- CSS inline (no imports de shadcn/ui que fingerprinting de librería)
- Solo muestra el botón de Google

## Variables de entorno sensibles

| Variable | Nivel de sensibilidad | Notas |
|----------|----------------------|-------|
| `NEXTAUTH_SECRET` | 🔴 Crítico | Firma todos los JWT. Rotar si se compromete |
| `SUPABASE_SERVICE_ROLE_KEY` | 🔴 Crítico | Acceso total a la BD. Solo en servidor |
| `GOOGLE_CLIENT_SECRET` | 🔴 Crítico | Nunca exponer en cliente |
| `CRON_SECRET` | 🟡 Alto | Protege el endpoint del cron |
| `RESEND_API_KEY` | 🟡 Alto | Solo en servidor |

## Generación de secrets

```bash
# NEXTAUTH_SECRET y CRON_SECRET
openssl rand -base64 32
```
