# Guía de Despliegue

## Checklist rápido (primer despliegue)

- [ ] Supabase: ejecutar migración SQL
- [ ] Google Cloud: añadir redirect URIs
- [ ] Resend: crear cuenta y verificar email
- [ ] Vercel: crear proyecto y configurar env vars
- [ ] GitHub: añadir secrets para CI/CD
- [ ] Push a `main` para deploy automático

---

## 1. Base de datos — Supabase

### Crear tablas (solo una vez por entorno)

Ve a [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql/new) y ejecuta el contenido de:

```
supabase/migrations/000_consolidated.sql
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

## 3. Notificaciones por email — Resend

1. Crea cuenta en [resend.com](https://resend.com) (plan gratuito: 3.000 emails/mes)
2. Ve a API Keys → Create API Key → copia el valor
3. **Para producción**: ve a Domains → Add Domain y verifica tu dominio para enviar desde `no-reply@tudominio.com`  
   *(Sin dominio propio, solo puedes enviar a emails verificados en Resend)*

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxx
OWNER_EMAIL=tu@email.com   # quien recibe los avisos de vencimiento
```

> El email de aviso se envía diariamente a las 08:00 UTC si hay socios que vencen en los próximos `EXPIRY_WARNING_DAYS` días o que vencieron ese día.

---

## 4. Vercel — primer despliegue

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
| `RESEND_API_KEY` | De resend.com | |
| `OWNER_EMAIL` | Tu email | Recibe avisos de vencimiento |
| `EXPIRY_WARNING_DAYS` | `3` | Días de antelación para aviso |
| `CRON_SECRET` | `openssl rand -base64 32` | Protege el endpoint del cron |

### Primer deploy manual

```bash
vercel --prod
```

### Verificar cron job

Vercel Dashboard → tu proyecto → Settings → Cron Jobs:
- Path: `/api/cron/check-expiry`
- Schedule: `0 8 * * *` (diario a las 08:00 UTC)

---

## 5. GitHub Actions — CI/CD automático

Configura los secrets en GitHub repo → Settings → Secrets and variables → Actions:

### Secrets de Vercel (para deploy)

| Secret | Cómo obtenerlo |
|--------|----------------|
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens → Create |
| `VERCEL_ORG_ID` | `.vercel/project.json` → campo `orgId` |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` → campo `projectId` |

### Secrets de la app (para tests E2E y build)

| Secret | Valor |
|--------|-------|
| `NEXTAUTH_SECRET` | Mismo que en Vercel |
| `NEXTAUTH_URL` | `http://localhost:3000` (para tests) |
| `GOOGLE_CLIENT_ID` | Mismo que en Vercel |
| `GOOGLE_CLIENT_SECRET` | Mismo que en Vercel |
| `ALLOWED_EMAIL` | Mismo que en Vercel |
| `SUPABASE_URL` | Mismo que en Vercel |
| `SUPABASE_SERVICE_ROLE_KEY` | Mismo que en Vercel |
| `RESEND_API_KEY` | Mismo que en Vercel |
| `OWNER_EMAIL` | Mismo que en Vercel |
| `CRON_SECRET` | Mismo que en Vercel |

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

## Monitorización

- **Logs del cron**: Vercel Dashboard → Logs → filtrar por `/api/cron/check-expiry`
- **Respuesta esperada**: `{"ok": true, "results": {"warnings": N, "expired": M}}`
- **Si el cron no ejecuta**: verifica que `CRON_SECRET` en Vercel coincide con el del `vercel.json`

---

## Troubleshooting

| Error | Causa | Solución |
|-------|-------|----------|
| `redirect_uri_mismatch` | URI no registrada en Google Cloud | Añadir la URI exacta en OAuth credentials |
| `Acceso no autorizado` | Email no coincide con `ALLOWED_EMAIL` | Verificar valor en Vercel env vars |
| `Could not find table 'members'` | Migración no ejecutada | Correr `000_consolidated.sql` en Supabase SQL Editor |
| Emails no llegan | `RESEND_API_KEY` inválida o dominio no verificado | Revisar Resend dashboard → Logs |
| Cron retorna 401 | `CRON_SECRET` no coincide | Verificar que el valor en Vercel env vars = el del `vercel.json` header |

