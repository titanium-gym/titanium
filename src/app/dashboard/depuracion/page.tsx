import { PurgePanel } from "@/components/members/PurgePanel";

export const dynamic = "force-dynamic";

export default function DepuracionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">Depuración</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Elimina socios con cuota vencida hace más de N días
        </p>
      </div>
      <PurgePanel />
    </div>
  );
}
