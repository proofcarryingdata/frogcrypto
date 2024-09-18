import { logger } from "@frogcrypto/shared";
import { POD } from "@pcd/pod";
import * as trpcExpress from "@trpc/server/adapters/express";
import { json, text, urlencoded } from "body-parser";
import cors from "cors";
import express, {
  type NextFunction,
  type Express,
  type Request,
  type Response,
} from "express";
import morgan from "morgan";
import { createContext } from "./context";
import { appRouter } from "./routers";
import { feedsRouter } from "./routers/feeds";

export const initializePCDs = async () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-member-access -- we need this to be dynamic
  await require("@pcd/gpc-pcd").init({
    zkArtifactPath: "node_modules/@pcd/proto-pod-gpc-artifacts",
  });
  logger.info("PCD packages initialized");
};

const podMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.headers["content-type"] === "application/x.pod+json") {
    const rawBody = req.body;
    if (!rawBody) {
      return res.status(400).json({ error: "No pod provided" });
    }
    if (typeof rawBody !== "string") {
      return res.status(400).json({ error: "POD must be a string" });
    }
    try {
      const pod = POD.deserialize(rawBody);

      const idValid = pod.verifySignature();
      if (!idValid) {
        return res.status(400).json({ error: "POD is invalid" });
      }

      req.body = pod;
    } catch (e) {
      return res.status(400).json({ error: "POD is invalid" });
    }
  }
  next();
};

export const createServer = (): Express => {
  const app = express();
  app
    .disable("x-powered-by")
    .use(morgan("dev"))
    .use(urlencoded({ extended: true }))
    .use(json())
    .use(cors({ origin: true, credentials: true }))
    .use(text({ type: "application/x.pod+json" }))
    .use(podMiddleware)
    .use("/feeds", feedsRouter)
    .use(
      "/trpc",
      trpcExpress.createExpressMiddleware({ router: appRouter, createContext })
    );

  return app;
};
