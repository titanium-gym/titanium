import type { NextAuthConfig } from "next-auth";

/** Returns the list of allowed emails parsed from the ALLOWED_EMAILS env var (comma-separated). */
export function getAllowedEmails(): string[] {
  return (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Returns true if the given email is in the ALLOWED_EMAILS list. Case-insensitive. */
export function isSessionEmailAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAllowedEmails().includes(email.toLowerCase().trim());
}

export const authConfig: NextAuthConfig = {
  providers: [],
  callbacks: {
    authorized({ auth: session }) {
      if (
        process.env.BYPASS_AUTH === "true" &&
        process.env.NODE_ENV !== "production"
      ) {
        return true;
      }
      return isSessionEmailAllowed(session?.user?.email);
    },
    signIn({ profile }) {
      return isSessionEmailAllowed(profile?.email);
    },
    session({ session }) {
      return session;
    },
    jwt({ token }) {
      return token;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 4 * 60 * 60,
  },
};
