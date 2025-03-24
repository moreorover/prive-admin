import Keycloak from "next-auth/providers/keycloak";
import type { NextAuthConfig } from "next-auth";

// Notice this is only an object, not a full Auth.js instance
export default {
  providers: [Keycloak],
} satisfies NextAuthConfig;
