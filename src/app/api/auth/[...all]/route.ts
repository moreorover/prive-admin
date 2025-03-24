import { handlers } from "@/lib/auth";

// function withLogging(
//   handler: (request: NextRequest) => Promise<Response>,
// ): (request: NextRequest) => Promise<Response> {
//   console.log({ handler });
//   return async (request: NextRequest): Promise<Response> => {
//     console.log({ request });
//     console.log(`Request received: ${request.method} ${request.url}`);
//     return handler(request);
//   };
// }

export const { GET, POST } = handlers;

// export const GET = withLogging(handlers.GET);
// export const POST = withLogging(handlers.POST);
