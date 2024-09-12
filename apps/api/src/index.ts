import { log } from "@repo/logger";
import { createServer } from "./server";

const isVercel = process.env.DEPLOYMENT_ENV === "vercel";

const port = process.env.PORT || 5001;
const server = createServer();

if (!isVercel) {
  server.listen(port, () => {
    log(`api running on ${port}`);
  });
}

export default server;
