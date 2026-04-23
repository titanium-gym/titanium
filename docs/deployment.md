# Guía de Despliegue

## Checklist rápido (primer despliegue)

- [ ] Supabase: ejecutar migración SQL
- [ ] Google Cloud: añadir redirect URIs
- [ ] Vercel: crear proyecto y configurar env vars
- [ ] GitHub: añadir secrets para CI/CD
- [ ] Push a `main` para deploy automático

---

## 1. Base de datos — Supabase

### Crear tablas (solo una vez por entorno)

Ve a [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql/new) y ejecuta el contenido de:

```
supabase/migrations/001_complete_schema.sql
```

> ⚠️ Las migraciones son **manuales** — no hay auto-migration en CI/CD.  
> Cada vez que añadas una migración nueva, ejecútala manualmente en Supabase Dashboard.

### Obtener credenciales

Ve a Supabase → Settings → API:
- **`SUPABASE_URL`**: Project URL (ej: `https://xxxx.supabase.co`)
- **`SUPABASE_SERVICE_ROLE_KEY`**: `service_role` key (nunca la expongas al cliente)

---

## 2. Google OAuth

### Crear credenciales (si no las tienes)

1. Ve a [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Crear credencial → OAuth 2.0 Client ID → Web application
3. Añadir **Authorized redirect URIs**:

| Entorno | URI |
|---------|-----|
| Local | `http://localhost:3000/api/auth/callback/google` |
| Producción | `https://tu-dominio.vercel.app/api/auth/callback/google` |

---

## 3. Vercel — primer despliegue

### Conectar proyecto

```bash
npm i -g vercel
vercel login
vercel link   # vincula con tu proyecto existente o crea uno nuevo
```

Tras ejecutar `vercel link`, se crea `.vercel/project.json` con `orgId` y `projectId`.

### Configurar variables de entorno

Ve a Vercel Dashboard → tu proyecto → Settings → Environment Variables:

| Variable | Valor | Notas |
|----------|-------|-------|
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | Distinto al de local |
| `NEXTAUTH_URL` | `https://tu-dominio.vercel.app` | Sin trailing slash |
| `GOOGLE_CLIENT_ID` | De Google Cloud Console | |
| `GOOGLE_CLIENT_SECRET` | De Google Cloud Console | |
| `ALLOWED_EMAIL` | Tu email de Google | Único usuario autorizado |
| `SUPABASE_URL` | De Supabase → Settings → API | |
| `SUPABASE_SERVICE_ROLE_KEY` | De Supabase → Settings → API | |

### Primer deploy manual

```bash
vercel --prod
```

---

## 4. GitHub Actions — CI/CD automático

Configura los secrets en GitHub repo → Settings → Secrets and variables → Actions:

### Secrets necesarios (build y E2E)

| Secret | Valor |
|--------|-------|
| `NEXTAUTH_SECRET` | Mismo que en Vercel |
| `GOOGLE_CLIENT_ID` | Mismo que en Vercel |
| `GOOGLE_CLIENT_SECRET` | Mismo que en Vercel |
| `ALLOWED_EMAIL` | Mismo que en Vercel |
| `SUPABASE_URL` | Mismo que en Vercel |
| `SUPABASE_SERVICE_ROLE_KEY` | Mismo que en Vercel |

### Flujo automático

```
PR abierto  → CI (unit tests + E2E) debe pasar
Push a main → unit tests pasan → deploy a Vercel producción
```

---

## Rollback

```bash
# Ver deploys recientes
vercel list

# Promover un deploy anterior a producción
vercel promote <deployment-url>
```

---

## Troubleshooting

| Error | Causa | Solución |
|-------|-------|----------|
| `redirect_uri_mismatch` | URI no registrada en Google Cloud | Añadir la URI exacta en OAuth credentials |
| `Acceso no autorizado` | Email no coincide con `ALLOWED_EMAIL` | Verificar valor en Vercel env vars |
| `Could not find table 'members'` | Migración no ejecutada | Correr `001_complete_schema.sql` en Supabase SQL Editor |

