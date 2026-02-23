import { env } from "@prive-admin/env/web";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: env.VITE_SERVER_URL,
});

export type Session = typeof authClient.$Infer.Session;
