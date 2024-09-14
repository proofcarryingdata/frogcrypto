import { log } from "@frogcrypto/logger";
import { createServer, initializePCDs } from "./server";

const isProduction = process.env.NODE_ENV === "production";

const port = process.env.PORT || 4001;
const server = createServer();

initializePCDs().then(() => {
  if (!isProduction) {
    server.listen(port, () => {
      log(`api running on ${port}`);
    });
  }
});

export default server;
