import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Keycloak({
      profile(profile) {
        return { ...profile, role: profile.role ?? "user" };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user, profile }) {
      console.log({ profile });
      if (user) {
        // User is available during sign-in
        token.id = user.id;
      }
      // if (profile) {
      //   token.role = profile.role;
      // }
      return token;
    },
    session({ session, token, user }) {
      // session.user.id = token.id as string;
      // session.user.role = token.role;
      // return session;
      return session;
    },
    authorized: async ({ auth }) => {
      // Logged in users are authenticated, otherwise redirect to login page
      return !!auth;
    },
  },
  events: {
    createUser({ user }) {
      if (!user) {
        console.log("created user", user);
      }
    },
    updateUser({ user }) {
      if (!user) {
        console.log("updated user", user);
      }
    },
    signIn({ user, account, profile, isNewUser }) {
      console.log("signIn", user, account, profile, isNewUser);
    },
  },
});
