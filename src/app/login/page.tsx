import { signIn } from "@/auth";

export const metadata = { title: "Titanium" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="dark min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Deep ambient glow — no shape hints */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,hsl(var(--primary)/0.12),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_80%_110%,hsl(var(--primary)/0.06),transparent)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[340px] px-6 flex flex-col items-center gap-10">
        {/* Abstract mark — two mirrored triangles forming a diamond, no semantic icon */}
        <div className="flex flex-col items-center gap-5">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl scale-150" />
            <svg
              viewBox="0 0 56 56"
              fill="none"
              className="relative w-full h-full"
              aria-hidden="true"
            >
              <polygon
                points="28,4 52,28 28,52 4,28"
                fill="hsl(var(--primary)/0.15)"
                stroke="hsl(var(--primary)/0.6)"
                strokeWidth="1.5"
              />
              <polygon
                points="28,14 42,28 28,42 14,28"
                fill="hsl(var(--primary)/0.25)"
                stroke="hsl(var(--primary)/0.8)"
                strokeWidth="1"
              />
              <circle cx="28" cy="28" r="3.5" fill="hsl(var(--primary))" />
            </svg>
          </div>

          <h1 className="text-3xl font-black tracking-[0.3em] uppercase text-foreground">
            Titanium
          </h1>
        </div>

        {/* Access card */}
        <div className="w-full bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-2xl shadow-black/40">
          {error && (
            <p className="mb-5 text-xs text-destructive/90 text-center tracking-wide">
              — Acceso denegado —
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
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-secondary/80 hover:bg-secondary border border-border/60 hover:border-border rounded-xl text-sm font-medium text-foreground transition-all duration-150 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
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
              Acceder
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
