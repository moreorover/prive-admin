import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
	const url = new URL(request.url);
	// Handle /two-factor access
	if (url.pathname === "/two-factor" || url.pathname === "/backup-code") {
		const sessionTokenCookie = request.cookies.get("better-auth.session_token");
		if (sessionTokenCookie) {
			return NextResponse.redirect(new URL("/profile", request.url));
		}
		const twoFactorCookie = request.cookies.get("better-auth.two_factor");
		if (!twoFactorCookie) {
			return NextResponse.redirect(new URL("/sign-in", request.url));
		}
		return NextResponse.next();
	}

	const cookies = getSessionCookie(request);

	// Handle /profile access
	if (!cookies) {
		return NextResponse.redirect(new URL("/sign-in", request.url));
	}

	if (url.pathname === "/") {
		return NextResponse.redirect(new URL("/profile", request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/profile", "/two-factor", "/backup-code", "/admin", "/"],
};
