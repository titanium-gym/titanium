import { Suspense } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { MembersTable } from "@/components/members/MembersTable";
import { AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SociosPage() {
  const supabase = getSupabaseClient();
  const { data: members, error } = await supabase
    .from("members")
    .select("*")
    .order("expires_at", { ascending: true });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
          <AlertTriangle className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <div>
          <p className="font-semibold text-foreground">
            No se pudieron cargar los socios
          </p>
          <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
        </div>
        <a
          href="/dashboard/socios"
          className="text-sm text-primary underline underline-offset-4 hover:opacity-80 transition-opacity"
        >
          Reintentar
        </a>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="py-8 text-center text-muted-foreground text-sm">
          Cargando…
        </div>
      }
    >
      <MembersTable initialMembers={members ?? []} />
    </Suspense>
  );
}
