declare global {
  namespace NodeJS {
    interface ProcessEnv {
      FROGCRYPTO_ASSETS_URL: string;
      ISSUER_PRIVATE_KEY: string;
    }
  }
}

export {};
