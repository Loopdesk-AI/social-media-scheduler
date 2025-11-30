import { Router } from "express";
import { chatController } from "../controllers/chat.controller";

const router = Router();

// Streaming chat endpoint (existing)
router.post("/", chatController.handleChat);

// Conversation management endpoints
router.get("/conversations", chatController.getConversations);
router.post("/conversations", chatController.createConversation);
router.get("/conversations/:id", chatController.getConversation);
router.patch("/conversations/:id", chatController.updateConversation);
router.delete("/conversations/:id", chatController.deleteConversation);

export const chatRoutes = router;
