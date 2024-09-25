import { logger } from "@frogcrypto/shared";
import { createServer, initializePCDs } from "./server";
import { initializeFrogCache } from "./db/frog-cache";

const isProduction = process.env.NODE_ENV === "production";

const port = process.env.PORT || 4001;
const server = createServer();

async function main() {
  await initializePCDs();
  await initializeFrogCache();

  if (!isProduction) {
    server.listen(port, () => {
      logger.info(`api running on ${String(port)}`);
    });
  }
}
void main();

export default server;
