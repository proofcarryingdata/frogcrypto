import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export function getUserSnapshot(semaphoreId: string) {
  return redis
    .pipeline()
    .get<number>(`frogcrypto:users:score:${semaphoreId}`)
    .get<number>(`frogcrypto:users:pendingRequests:${semaphoreId}`)
    .exec();
}

export default redis;
