import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { normalizeJordanPhone, looksLikePhone } from "@/lib/phone";
import { otpRequired } from "@/lib/sms";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        identifier: { label: "Email or phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials.password) return null;
        const id = credentials.identifier.trim();
        const candidates: { email?: string; phone?: string }[] = [
          { email: id.toLowerCase() },
          { phone: id },
        ];
        if (looksLikePhone(id)) {
          const normalized = normalizeJordanPhone(id);
          if (normalized) candidates.push({ phone: normalized });
        }
        const user = await prisma.user.findFirst({ where: { OR: candidates } });
        if (!user) return null;
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        if (user.phone && !user.phoneVerified && otpRequired()) {
          // surfaced to the client as res.error — routes to the OTP screen
          throw new Error("PHONE_NOT_VERIFIED");
        }
        return { id: user.id, name: user.name, email: user.email ?? undefined };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.uid = (user as { id: string }).id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.uid) {
        (session.user as { id?: string }).id = token.uid as string;
      }
      return session;
    },
  },
};

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
  }
}
