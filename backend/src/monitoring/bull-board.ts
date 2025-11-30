// BullMQ Dashboard (Bull Board) Setup

import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { queueService } from "../services/queue.service";

// Create Express adapter for Bull Board
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

// Get queue (may be null if Redis is not configured)
const queue = queueService.getQueue();

// Create Bull Board with queue adapters (only if queue is available)
const queues = queue ? [new BullMQAdapter(queue)] : [];

const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
  queues,
  serverAdapter: serverAdapter,
});

// Export function to dynamically add queue later if it becomes available
const initializeQueueAdapter = () => {
  const q = queueService.getQueue();
  if (q && queues.length === 0) {
    addQueue(new BullMQAdapter(q));
  }
};

export { serverAdapter, addQueue, removeQueue, initializeQueueAdapter };
