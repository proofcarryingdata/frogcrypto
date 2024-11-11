declare global {
  namespace NodeJS {
    interface ProcessEnv {
      FROGCRYPTO_ASSETS_URL: string;
      ISSUER_PRIVATE_KEY: string;
      THROW_ON_TURNSTILE_ERROR: string;
    }
  }
}

export {};
