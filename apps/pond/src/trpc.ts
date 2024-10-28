import type { AppRouter } from "@frogcrypto/api/src/routers";
import { SERVER_URL } from "@frogcrypto/shared";
import { type JSONPOD, POD } from "@pcd/pod";
import { httpBatchLink, loggerLink } from "@trpc/client";
import {
  createTRPCReact,
  type inferReactQueryProcedureOptions,
} from "@trpc/react-query";
import { SuperJSON, registerCustom } from "superjson";

export type ReactQueryOptions = inferReactQueryProcedureOptions<AppRouter>;

registerCustom<POD, string>(
  {
    isApplicable: (v): v is POD => v instanceof POD && v.verifySignature(),
    serialize: (v) => JSON.stringify(v.toJSON()),
    deserialize: (v) => POD.fromJSON(JSON.parse(v) as JSONPOD),
  },
  "pcd-pod"
);

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
