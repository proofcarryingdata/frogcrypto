import { json, text, urlencoded } from "body-parser";
import express, {
  NextFunction,
  type Express,
  type Request,
  type Response,
} from "express";
import morgan from "morgan";
import cors from "cors";
import { usersRouter } from "./users";
import { log } from "@frogcrypto/logger";
import { POD } from "@pcd/pod";

export const initializePCDs = async () => {
  await require("@pcd/gpc-pcd").init({
    zkArtifactPath: "node_modules/@pcd/proto-pod-gpc-artifacts",
  });
  log("PCD packages initialized");
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
    .use(cors())
    .use(text({ type: "application/x.pod+json" }))
    .use(podMiddleware)
    .get("/status", (_, res) => {
      return res.json({ ok: true });
    })
    .use("/users", usersRouter);

  return app;
};
