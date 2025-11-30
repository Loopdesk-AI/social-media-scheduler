import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Streaming chat endpoint (existing)
router.post('/', authMiddleware, chatController.handleChat);

// Conversation management endpoints
router.get('/conversations', authMiddleware, chatController.getConversations);
router.post('/conversations', authMiddleware, chatController.createConversation);
router.get('/conversations/:id', authMiddleware, chatController.getConversation);
router.patch('/conversations/:id', authMiddleware, chatController.updateConversation);
router.delete('/conversations/:id', authMiddleware, chatController.deleteConversation);

export const chatRoutes = router;
