import { auth } from "@/auth";

/**
 * Shared auth guard for API routes.
 * Respects BYPASS_AUTH in development so local testing works
 * without a real Google OAuth session.
 */
export async function requireAuth() {
  const bypass =
    process.env.BYPASS_AUTH === "true" &&
    process.env.NODE_ENV !== "production";

  if (bypass) return { user: { email: "dev@localhost", name: "Dev" } };

  const session = await auth();
  if (!session) return null;
  return session;
}
