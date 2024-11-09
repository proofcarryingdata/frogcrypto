import { logger } from "@frogcrypto/shared";
import { createServer } from "./server";
import { initializeFrogCache } from "./db/frog-cache";
import { initializeFeedCache } from "./db/feeds";

const isProduction = process.env.NODE_ENV === "production";
const isRender = process.env.RENDER === "true";

const port = process.env.PORT || 4001;
const server = createServer();

async function main() {
  await initializeFrogCache();
  await initializeFeedCache();

  if (!isProduction || isRender) {
    server.listen(port, () => {
      logger.info(`api running on ${String(port)}`);
    });
  }
}
void main();

export default server;
