import { POD_TYPE_FROGCRYPTO_PWT, PwtSpec } from "@frogcrypto/shared";
import { encodePrivateKey, POD } from "@pcd/pod";
import { Identity } from "@semaphore-protocol/identity";
import { crypto } from "@zk-kit/utils";
import {
  type CreateTRPCClient,
  createTRPCClient,
  httpBatchLink,
  httpLink,
  loggerLink,
} from "@trpc/client";
import SuperJSON from "superjson";
import { type inferTRPCClientTypes } from "@trpc/server";
import { type AppRouter } from "./routers";

const NUM_ROUNDS = 10;
const NUM_USERS = 1000;
const NUM_REQUESTS = 100;
// const SERVER_URL = "http://localhost:4001";
// const SERVER_URL = "https://frogcrypto-api.vercel.app";
const SERVER_URL = "https://frogcrypto-api.onrender.com";

async function run(
  users: {
    id: number;
    semaphoreId: bigint;
    identity: Identity;
    pwt: string;
    client: CreateTRPCClient<AppRouter>;
  }[]
) {
  try {
    console.time("login");
    await Promise.all(
      users.map((user) => user.client.users.auth.mutate({ ticket: null }))
    );
    console.timeEnd("login");

    console.time("make requests");
    await Promise.all(
      users.map((user) => {
        return Promise.all(
          Array.from({ length: NUM_REQUESTS }).map(async () => {
            await user.client.users.me.query({ feedIds: [] });
          })
        );
      })
    );
    console.timeEnd("make requests");

    console.log("Users: ", users.length);
    console.log("Requests: ", NUM_USERS * NUM_REQUESTS);
  } catch (error) {
    console.error(`An error occurred: ${(error as Error).message}`);
  }
}

async function main() {
  console.time("generate users");
  const users = await Promise.all(
    Array.from({ length: NUM_USERS }).map(async (_, i) => {
      const identity = new Identity(crypto.getRandomValues(32));
      if (typeof identity.privateKey === "string") {
        throw new Error("Unsupported private key type!");
      }

      const semaphoreId = identity.commitment;

      const pod = POD.sign(
        PwtSpec.parse({
          pod_type: { type: "string", value: POD_TYPE_FROGCRYPTO_PWT },
          aud: { type: "string", value: "frogcrypto" },
          exp: {
            type: "int",
            value: BigInt(Date.now() + 1000 * 60 * 60 * 24),
          },
          iss: {
            type: "cryptographic",
            value: semaphoreId,
          },
          sub: { type: "cryptographic", value: semaphoreId },
        }),
        encodePrivateKey(identity.privateKey)
      );
      const pwt = JSON.stringify(pod.toJSON());

      const client = createTRPCClient<AppRouter>({
        links: [
          loggerLink({
            enabled: (opts) =>
              opts.direction === "down" && opts.result instanceof Error,
          }),
          httpLink({
            url: `${SERVER_URL}/trpc`,
            //   maxURLLength: 1000,
            transformer: SuperJSON,
            headers() {
              return { Authorization: `Bearer ${pwt}` };
            },
          }),
        ],
      });

      return {
        id: i,
        semaphoreId,
        identity,
        pwt,
        client,
      };
    })
  );
  console.timeEnd("generate users");

  for (let i = 0; i < NUM_ROUNDS; i++) {
    await run(users);
  }
}

void main();
