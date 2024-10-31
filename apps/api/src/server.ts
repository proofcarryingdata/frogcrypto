import * as trpcExpress from "@trpc/server/adapters/express";
import { json, urlencoded } from "body-parser";
import cors from "cors";
import express, { type Express } from "express";
import morgan from "morgan";
import { createContext } from "./context";
import { appRouter } from "./routers";
import path from "path";
import { getUserScore } from "./db/users";
import { engine } from "express-handlebars";

export const createServer = (): Express => {
  const app = express();
  app
    .disable("x-powered-by")
    .engine("handlebars", engine())
    .set("view engine", "handlebars")
    .set("views", path.join(__dirname, "../views"))
    .use(morgan("dev"))
    .use(urlencoded({ extended: true }))
    .use(json())
    .use(cors({ origin: true, credentials: true }))
    .use(
      "/trpc",
      trpcExpress.createExpressMiddleware({ router: appRouter, createContext })
    )
    .get("/button/:id", async (req, res) => {
      const score = await getUserScore(req.params.id);

      res.render("button", { score: score?.score ?? 0 });
    });

  return app;
};
