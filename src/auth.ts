import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    authorized({ auth: session }) {
      if (process.env.BYPASS_AUTH === "true" && process.env.NODE_ENV !== "production") {
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
    maxAge: 4 * 60 * 60, // 4 hours
  },
});
