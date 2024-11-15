export const FROGCRYPTO_FOLDER_NAME =
  process.env.NODE_ENV === "production" ? "FrogCrypto" : "FrogCrypto (alpha)";

export const FROM_SUBSCRIPTION_PARAM_KEY = "fromFrogSubscription";

export const SERVER_URL =
  process.env.NODE_ENV === "production"
    ? "https://frogcrypto-api.vercel.app"
    : "http://localhost:4001";

export const DEFAULT_ZUPASS_URL =
  process.env.NODE_ENV === "production"
    ? "https://zupass.org"
    : "https://staging.zupass.org";

export const CLOUDFLARE_TURNSTILE_SITE_KEY =
  process.env.NODE_ENV === "production"
    ? "0x4AAAAAAAzubSJu97uBvGuG"
    : "1x00000000000000000000BB";
