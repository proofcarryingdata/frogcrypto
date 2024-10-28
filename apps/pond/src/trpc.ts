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

const TOKEN_KEY = "_PWT_TOKEN";
const TOKEN_VERSION = 1;
export function loadToken(): { value: string; exp: number } | null {
  const entryString = localStorage.getItem(TOKEN_KEY);
  if (!entryString) {
    return null;
  }
  const entry = JSON.parse(entryString) as {
    version: number;
    token: { value: string; exp: number };
  };
  if (entry.version !== TOKEN_VERSION) {
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }
  const now = new Date();
  if (now.getTime() > entry.token.exp) {
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }
  return entry.token;
}
let token: { value: string; exp: number } | null = loadToken();
export function setToken(newToken: string, exp: number): void {
  token = { value: newToken, exp };
  localStorage.setItem(
    TOKEN_KEY,
    JSON.stringify({ version: TOKEN_VERSION, token })
  );
}
export function hasToken(): boolean {
  return Boolean(token && token.exp > Date.now());
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
