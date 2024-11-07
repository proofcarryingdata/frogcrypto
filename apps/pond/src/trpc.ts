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
    isApplicable: (v): v is POD => v instanceof POD,
    serialize: (v) => JSON.stringify(v.toJSON()),
    deserialize: (v) => {
      const pod = POD.fromJSON(JSON.parse(v) as JSONPOD);
      if (!pod.verifySignature()) {
        throw new Error("Invalid POD");
      }
      return pod;
    },
  },
  "pcd-pod"
);

let token: { value: string; exp: number } | null = null;
export function setToken(newToken: string, exp: number): void {
  token = { value: newToken, exp };
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
        if (!token || token.exp < Date.now()) {
          return {};
        }

        return {
          Authorization: `Bearer ${token.value}`,
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
