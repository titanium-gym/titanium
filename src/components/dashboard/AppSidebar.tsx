"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Dumbbell } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/socios", label: "Socios", icon: Users, exact: false },
];

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();

  const initials = (user.name ?? user.email ?? "?")
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

  return (
    <Sidebar collapsible="icon">
      {/* Brand header */}
      <SidebarHeader className="border-b border-sidebar-border/60 px-2 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="gap-3 pointer-events-none">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary shadow-md shadow-primary/40 ring-1 ring-primary/50 shrink-0">
                <Dumbbell
                  className="w-4 h-4 text-primary-foreground"
                  aria-hidden="true"
                />
              </div>
              <span className="text-sm font-black tracking-[0.18em] uppercase text-sidebar-foreground">
                Titanium
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
                const isActive = exact
                  ? pathname === href
                  : pathname.startsWith(href);
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      render={<Link href={href} />}
                      isActive={isActive}
                      tooltip={label}
                    >
                      <Icon aria-hidden="true" />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User footer */}
      <SidebarFooter className="border-t border-sidebar-border/60 p-3">
        <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
          <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[11px] font-bold text-primary select-none shrink-0">
            {initials}
          </div>
          <span className="text-xs text-sidebar-foreground/60 truncate group-data-[collapsible=icon]:hidden">
            {user.email}
          </span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
