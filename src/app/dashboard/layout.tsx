import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { LogOut } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const bypass = process.env.BYPASS_AUTH === "true" && process.env.NODE_ENV !== "production";
  const session = await auth();
  if (!session && !bypass) redirect("/login");
  const user = {
    name: session?.user?.name ?? (bypass ? "Dev" : null),
    email: session?.user?.email ?? (bypass ? "dev@localhost" : null),
  };

  return (
    <div>
      <SidebarProvider>
        <AppSidebar user={user} />

        <SidebarInset>
          {/* Thin topbar: trigger + logout */}
          <header className="sticky top-0 z-50 flex items-center h-11 px-4 gap-2 bg-background/70 backdrop-blur-xl border-b border-border/40">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground -ml-1 transition-colors" />
            <Separator orientation="vertical" className="h-4 mx-1 opacity-50" />
            <span className="flex-1" />
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button
                variant="ghost"
                size="sm"
                type="submit"
                className="gap-1.5 text-muted-foreground/70 hover:text-foreground cursor-pointer h-7 px-2.5 rounded-lg transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="text-xs hidden sm:inline font-medium">Salir</span>
              </Button>
            </form>
          </header>

          <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
