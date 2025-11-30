// BullMQ Dashboard (Bull Board) Setup

import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { queueService } from '../services/queue.service';

// Create Express adapter for Bull Board
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

// Create Bull Board with queue adapters
const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
  queues: [
    new BullMQAdapter(queueService.getQueue()),
  ],
  serverAdapter: serverAdapter,
});

export { serverAdapter, addQueue, removeQueue };
