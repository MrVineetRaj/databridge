import { RedisStore } from "connect-redis";
import { createClient, RedisClientType } from "redis";
import { envConf } from "../lib/envConf";
import { Job, Queue, QueueEvents, Worker } from "bullmq";
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

  /**
   * Get connection options for BullMQ (plain object)
   */
  getBullMQConnection() {
    return {
      host: envConf.REDIS_HOST,
      port: +envConf.REDIS_PORT,
    };
  }
}

export class RedisQueueAndWorker {
  queueName: string;
  private redisConnection: { host: string; port: number };
  private jobQueue: Queue;

  constructor({
    queueName,
    connection,
  }: {
    queueName: string;
    connection: { host: string; port: number };
  }) {
    this.redisConnection = connection;
    this.queueName = queueName;
    this.jobQueue = new Queue(queueName, { connection: this.redisConnection });
  }

  getQueue() {
    return this.jobQueue;
  }

  getQueueEvents() {
    const queueEvents = new QueueEvents(this.queueName, {
      connection: this.redisConnection,
    });
    return queueEvents;
  }
  getWorker<T = any>(
    callbackFn: (job: Job<T, any, string>) => Promise<void>
  ): Worker<T, any, string> {
    const worker = new Worker<T, any, string>(this.queueName, callbackFn, {
      connection: this.redisConnection,
    });
    return worker;
  }
}

export const redisServices = new RedisServices();
export const redisClientForQueue = redisServices.getBullMQConnection();
