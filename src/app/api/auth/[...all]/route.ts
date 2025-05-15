// import { toNextJsHandler } from "better-auth/next-js";
//
// import { auth } from "@/lib/auth";
//
// const authHandler = toNextJsHandler(auth);
//
// function withLogging(
//   handler: (request: Request) => Promise<Response>,
// ): (request: Request) => Promise<Response> {
//   return async (request: Request): Promise<Response> => {
//     console.log(`Request received: ${request.method} ${request.url}`);
//
//     return handler(request);
//   };
// }
//
// export const GET = withLogging(authHandler.GET);
// export const POST = withLogging(authHandler.POST);

import { toNextJsHandler } from "better-auth/next-js";
import type { NextRequest } from "next/server";

import { auth } from "@/lib/auth";

export const { GET } = toNextJsHandler(auth);

export const POST = async (req: NextRequest) => {
	const res = await auth.handler(req);
	return res;
};
