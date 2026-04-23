import type { NextAuthConfig } from "next-auth";

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
      return !!session;
    },
    signIn({ profile }) {
      const allowed = process.env.ALLOWED_EMAIL;
      if (!allowed) return false;
      return profile?.email === allowed;
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
