import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { SessionPayload } from "@/lib/auth/session";
import { authenticateUser } from "@/lib/mongodb/auth";
import { isMongoDBConfigured } from "@/lib/db/config";

/** NextAuth — email + password only (Credentials). Primary flow uses /api/auth/session. */
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!isMongoDBConfigured() || !credentials?.email || !credentials?.password) return null;
        const result = await authenticateUser(String(credentials.email), String(credentials.password));
        if (!result.ok) return null;
        return {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.userId = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.userId ?? "");
        session.user.email = String(token.email ?? session.user.email ?? "");
        session.user.name = String(token.name ?? session.user.name ?? "");
      }
      return session;
    },
  },
};

export function sessionPayloadFromNextAuth(session: {
  user?: { id?: string; email?: string | null; name?: string | null };
}): SessionPayload | null {
  const email = session.user?.email;
  const userId = session.user?.id;
  if (!email || !userId) return null;
  return {
    userId,
    email,
    name: session.user?.name ?? email.split("@")[0] ?? "User",
    isDemo: false,
  };
}
