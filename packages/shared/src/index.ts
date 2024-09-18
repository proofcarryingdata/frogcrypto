export const log = (...args: unknown[]): void => {
  // eslint-disable-next-line no-console -- logger
  console.log("LOGGER: ", ...args);
};

export * from "./frogs";
export * from "./semaphore";
export * from "./bigint";
export * from "./logger";
