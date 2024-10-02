import * as trpcExpress from "@trpc/server/adapters/express";
import { json, urlencoded } from "body-parser";
import cors from "cors";
import express, { type Express } from "express";
import morgan from "morgan";
import { createContext } from "./context";
import { appRouter } from "./routers";

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
