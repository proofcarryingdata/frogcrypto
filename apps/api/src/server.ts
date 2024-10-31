import * as trpcExpress from "@trpc/server/adapters/express";
import { json, urlencoded } from "body-parser";
import cors from "cors";
import express, { type Express } from "express";
import morgan from "morgan";
import { createContext } from "./context";
import { appRouter } from "./routers";
import path from "path";
import { getUserScoreLite } from "./db/users";
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
      const score = await getUserScoreLite(req.params.id);

      res.render("button", { score: score?.score ?? 0 });
    })
    .get("/redirect(/*)?", (req, res) => {
      const params = new URLSearchParams(req.query as Record<string, string>);
      params.set("folder", "frogcrypto");

      res.redirect(`https://staging.zupass.org/#/?${params.toString()}`);
    });

  return app;
};
