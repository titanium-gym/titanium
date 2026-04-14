# Titanium — Gestión de Socios de Gimnasio

Portal web privado para gestión de socios. Login exclusivo con Google OAuth restringido a una única cuenta autorizada.

## Stack

- **Next.js 14** (App Router) — desplegado en Vercel
- **NextAuth v5** — Google OAuth, whitelist de email único
- **Supabase** (PostgreSQL + RLS) — solo accedido desde el servidor
- **Resend** — email transaccional para avisos de vencimiento
- **Vercel Cron** — job diario a las 08:00 UTC
- **shadcn/ui + Tailwind CSS** — UI del panel interno
- **Vitest** — tests unitarios | **Playwright** — tests E2E

## Setup local

### 1. Requisitos

- Node.js 20+
- Proyecto en Supabase (con migración aplicada)
- Credenciales OAuth de Google Cloud
- Cuenta en Resend

### 2. Variables de entorno

```bash
cp .env.example .env.local
# Rellena todos los valores — ver .env.example para descripciones
```

### 3. Migración de base de datos

Ejecuta `supabase/migrations/001_initial.sql` en el SQL Editor de Supabase.

### 4. Configurar Google OAuth

1. Ve a [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Crea un OAuth 2.0 Client ID (Web application)
3. Añade Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Añade URI de producción: `https://tu-dominio.vercel.app/api/auth/callback/google`

### 5. Ejecutar en local

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Comandos

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm test` | Tests unitarios (Vitest) |
| `npm run test:e2e` | Tests E2E (Playwright) |
| `npm run lint` | Lintado |

## Despliegue

Ver [docs/deployment.md](docs/deployment.md)

## Seguridad

Ver [docs/security.md](docs/security.md)
