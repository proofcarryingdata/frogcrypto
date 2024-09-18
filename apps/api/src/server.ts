import { logger } from "@frogcrypto/shared";
import * as trpcExpress from "@trpc/server/adapters/express";
import { json, urlencoded } from "body-parser";
import cors from "cors";
import express, { type Express } from "express";
import morgan from "morgan";
import { createContext } from "./context";
import { appRouter } from "./routers";

export const initializePCDs = async () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-member-access -- we need this to be dynamic
  await require("@pcd/gpc-pcd").init({
    zkArtifactPath: "node_modules/@pcd/proto-pod-gpc-artifacts",
  });
  logger.info("PCD packages initialized");
};

export const createServer = (): Express => {
  const app = express();
  app
    .disable("x-powered-by")
    .use(morgan("dev"))
    .use(urlencoded({ extended: true }))
    .use(json())
    .use(cors({ origin: true, credentials: true }))
    .use(
      "/trpc",
      trpcExpress.createExpressMiddleware({ router: appRouter, createContext })
    );

  return app;
};
