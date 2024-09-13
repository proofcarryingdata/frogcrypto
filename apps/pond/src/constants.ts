export const FROGCRYPTO_FOLDER_NAME = "FrogCrypto";

export const FROM_SUBSCRIPTION_PARAM_KEY = "fromFrogSubscription";

export const SERVER_URL =
  process.env.NODE_ENV === "production"
    ? "https://frogcrypto-api.vercel.app"
    : "http://localhost:4001";

export const ZUPASS_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://staging.zupass.org";

export const POD_TYPE_FROGCRYPTO_PLAYER_ID = "frogcrypto.playerId";
