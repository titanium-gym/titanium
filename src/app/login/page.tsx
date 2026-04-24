import { signIn } from "@/auth";

export const metadata = { title: "Titanium" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ── LEFT HERO PANEL ─────────────────────────────── */}
      <div className="relative flex-1 lg:flex-[3] flex flex-col justify-between p-10 lg:p-14 overflow-hidden bg-[oklch(0.10_0_0)] min-h-[40vh] lg:min-h-screen">
        {/* Grid lines — motif 1 */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        {/* Radial brand glow — motif 2 */}
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px] pointer-events-none animate-glow-pulse" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />

        {/* Brand mark */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8" aria-hidden="true">
              <polygon
                points="16,2 30,16 16,30 2,16"
                fill="oklch(0.62 0.22 27 / 0.2)"
                stroke="oklch(0.62 0.22 27 / 0.7)"
                strokeWidth="1.5"
              />
              <circle cx="16" cy="16" r="4" fill="oklch(0.62 0.22 27)" />
            </svg>
            <span className="text-sm font-black tracking-[0.3em] uppercase text-white/90">
              Titanium
            </span>
          </div>
        </div>

        {/* Main tagline */}
        <div className="relative z-10 space-y-4">
          <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-white/30">
            Portal de gestión
          </p>
          <h1 className="text-4xl lg:text-5xl font-black leading-[1.1] tracking-tight text-white">
            Gestiona tu{" "}
            <span
              className="block"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.80 0.18 27), oklch(0.62 0.22 27), oklch(0.45 0.20 27))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              gimnasio
            </span>
            sin límites.
          </h1>
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ────────────────────────────── */}
      <div className="relative flex-1 lg:flex-[2] flex items-center justify-center p-8 lg:p-14 bg-background">
        {/* Subtle top glow on mobile */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent lg:hidden" />

        <div className="w-full max-w-[320px] space-y-8">
          {/* Heading */}
          <div>
            <h2 className="text-2xl font-black tracking-tight text-foreground">
              Bienvenido
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Accede con tu cuenta de Google
            </p>
          </div>

          {/* Form */}
          <div className="space-y-3">
            {error && (
              <p className="text-xs text-destructive text-center py-2 px-3 rounded-lg bg-destructive/10 border border-destructive/20">
                Acceso denegado. Cuenta no autorizada.
              </p>
            )}

            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/dashboard" });
              }}
            >
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-foreground text-background rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90 hover:scale-[1.02] hover:shadow-[0_4px_20px_oklch(0.62_0.22_27_/_0.25)] active:scale-[0.98] cursor-pointer shadow-lg shadow-black/30 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continuar con Google
              </button>
            </form>
          </div>

          <p className="text-[11px] text-muted-foreground/50 text-center">
            Solo cuentas autorizadas pueden acceder.
          </p>
        </div>
      </div>
    </div>
  );
}
