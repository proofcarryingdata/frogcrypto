export const FROGCRYPTO_FOLDER_NAME = "FrogCrypto";

export const FROM_SUBSCRIPTION_PARAM_KEY = "fromFrogSubscription";

export const SERVER_URL =
  process.env.NODE_ENV === "production"
    ? "https://api.frogcrypto.xyz"
    : "http://localhost:3001";
