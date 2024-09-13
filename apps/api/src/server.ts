import { json, urlencoded } from "body-parser";
import express, { type Express } from "express";
import morgan from "morgan";
import cors from "cors";
import { usersRouter } from "./users";
import { log } from "@repo/logger";

export const initializePCDs = async () => {
  await require("@pcd/gpc-pcd").init({
    zkArtifactPath: "node_modules/@pcd/proto-pod-gpc-artifacts",
  });
  log("PCD packages initialized");
};

export const createServer = (): Express => {
  const app = express();
  app
    .disable("x-powered-by")
    .use(morgan("dev"))
    .use(urlencoded({ extended: true }))
    .use(json())
    .use(cors())
    .get("/status", (_, res) => {
      return res.json({ ok: true });
    })
    .use("/users", usersRouter);

  return app;
};
