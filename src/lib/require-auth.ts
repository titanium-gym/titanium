import { auth } from "@/auth";
import { isSessionEmailAllowed } from "@/auth.config";
import { redirect } from "next/navigation";

/**
 * Shared auth guard for API routes.
 * Respects BYPASS_AUTH in development so local testing works
 * without a real Google OAuth session.
 * Re-checks ALLOWED_EMAILS so removing an email takes effect on live sessions.
 */
export async function requireAuth() {
  const bypass =
    process.env.BYPASS_AUTH === "true" &&
    process.env.NODE_ENV !== "production";

  if (bypass) return { user: { email: "dev@localhost", name: "Dev" } };

  const session = await auth();
  if (!session || !isSessionEmailAllowed(session.user?.email)) return null;
  return session;
}

/**
 * Auth guard for pages. Call it in each page that reads data: layouts are
 * skipped on client navigations, so a layout check alone does not protect them.
 */
export async function requirePageAuth() {
  const session = await requireAuth();
  if (!session) redirect("/login");
  return session;
}
