import { log } from "@repo/logger";
import { createServer } from "./server";

const isProduction = process.env.NODE_ENV === "production";

const port = process.env.PORT || 3001;
const server = createServer();

if (!isProduction) {
  server.listen(port, () => {
    log(`api running on ${port}`);
  });
}

export default server;
