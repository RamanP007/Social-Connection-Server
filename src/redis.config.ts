import { Redis } from "ioredis";

const client = new Redis(6379, "localhost", {
  password: process.env.REDIS_PASSWORD,
});

const pubClient = new Redis(6379, "localhost", {
  password: process.env.REDIS_PASSWORD,
});

const subClient = new Redis(6379, "localhost", {
  password: process.env.REDIS_PASSWORD,
});

export { client, pubClient, subClient };
