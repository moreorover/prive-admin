export const serverUrl = import.meta.env.VITE_SERVER_URL ?? ""

export function apiUrl(path: string, origin = serverUrl) {
  if (!origin) return path
  return `${origin.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`
}
