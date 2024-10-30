export const FROGCRYPTO_FOLDER_NAME = "FrogCrypto";

export const FROM_SUBSCRIPTION_PARAM_KEY = "fromFrogSubscription";

export const SERVER_URL =
  process.env.NODE_ENV === "production"
    ? "https://frogcrypto-api.vercel.app"
    : "http://localhost:4001";

export const DEFAULT_ZUPASS_URL =
  process.env.NODE_ENV === "development"
    ? "http://staging.zupass.org"
    : "https://staging.zupass.org";
