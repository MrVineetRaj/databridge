import { RedisStore } from "connect-redis";
import { createClient, RedisClientType } from "redis";
import { envConf } from "../lib/envConf";
/**
 * This class will contain various redis services
 */
class RedisServices {
  private redisClient: RedisClientType;
  constructor() {
    this.redisClient = createClient({
      url: `redis://${envConf.REDIS_HOST}:${envConf.REDIS_PORT}`,
    });
    this.redisClient.connect().catch(console.error);
  }

  /**
   * This is a factory to generate a RedisStore
   * @param {prefix} a string value for assigning prefix to redis store
   * @returns {redisStore} return a store with provided {prefix}
   */
  createRedisStore({ prefix }: { prefix: string }): RedisStore {
    const redisStore = new RedisStore({
      client: this.redisClient,
      prefix: prefix,
    });

    return redisStore;
  }
}

export const redisServices = new RedisServices();
