export function getSafeRedirect(
  redirect: string | undefined,
  fallback = "/dashboard",
): string {
  // No redirect provided, use fallback
  if (!redirect) return fallback;

  try {
    // Parse redirect as URL with current origin as base
    // This handles relative paths and validates the URL structure
    const url = new URL(redirect, window.location.origin);

    // Only allow redirects to same origin (prevent open redirect attacks)
    if (url.origin === window.location.origin) {
      // Return only the path part (pathname + query + hash)
      return url.pathname + url.search + url.hash;
    }
  } catch {
    // Invalid URL format, fall through to fallback
  }

  // Invalid or external URL, use fallback
  return fallback;
}
