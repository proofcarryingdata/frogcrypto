import type { AppRouter } from "@frogcrypto/api/src/routers";
import { httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import SuperJSON from "superjson";
import { SERVER_URL } from "./constants";

let token: string | undefined;
export function setToken(newToken: string): void {
  /**
   * You can also save the token to cookies, and initialize from
   * cookies above.
   */
  token = newToken;
}

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    loggerLink({
      enabled: (opts) =>
        (process.env.NODE_ENV === "development" &&
          typeof window !== "undefined") ||
        (opts.direction === "down" && opts.result instanceof Error),
    }),
    httpBatchLink({
      url: `${SERVER_URL}/trpc`,
      transformer: SuperJSON,
      headers() {
        if (!token) {
          return {};
        }

        return {
          Authorization: `Bearer ${token}`,
        };
      },
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: "include",
        });
      },
    }),
  ],
});
