import {
	type Processor,
	Queue,
	type QueueOptions,
	Worker,
	type WorkerOptions,
} from "bullmq";
import env from "../../env";
import { redis } from "./client";

const queuePrefix = `{${env.REDIS_PREFIX}}`;

export const createQueue = (name: string, options?: QueueOptions) => {
	return new Queue(name, {
		connection: redis, // Reuse ioredis instance
		prefix: queuePrefix,
		...options,
	});
};

export const createWorker = (
	name: string,
	processor: Processor,
	options?: WorkerOptions,
) => {
	return new Worker(name, processor, {
		connection: redis, // Reuse ioredis instance
		prefix: queuePrefix,
		...options,
	});
};
