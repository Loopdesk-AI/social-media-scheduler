import { Request, Response } from "express";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, convertToCoreMessages } from "ai";
import { db } from "../database/db";
import { users, conversations, chatMessages } from "../database/schema";
import { eq, and, isNull, desc, asc } from "drizzle-orm";

// Default user ID for simplified operation (no auth)
const DEFAULT_USER_ID = "default-user";

const extractContent = (msg: any) => {
  if (!msg) return "";
  if (typeof msg.content === "string") return msg.content;
  if (msg.parts && Array.isArray(msg.parts)) {
    return msg.parts.map((p: any) => p.text || "").join("");
  }
  return "";
};

// Detect media context from user message
const detectMediaContext = (content: string) => {
  const context = {
    hasVideo: false,
    hasImage: false,
    fileCount: 0,
    fileNames: [] as string[],
    mediaType: null as "image" | "video" | "mixed" | null,
    contextNote: "",
  };

  // Detect file extensions in the message
  const videoExtensions = /\b[\w-]+\.(mp4|mov|avi|wmv|flv|webm|m4v|mkv)\b/gi;
  const imageExtensions = /\b[\w-]+\.(jpg|jpeg|png|gif|webp|bmp|svg)\b/gi;

  const videoMatches = content.match(videoExtensions);
  const imageMatches = content.match(imageExtensions);

  if (videoMatches) {
    context.hasVideo = true;
    context.fileCount += videoMatches.length;
    context.fileNames.push(...videoMatches);
  }

  if (imageMatches) {
    context.hasImage = true;
    context.fileCount += imageMatches.length;
    context.fileNames.push(...imageMatches);
  }

  // Determine overall media type
  if (context.hasVideo && context.hasImage) {
    context.mediaType = "mixed";
    context.contextNote = `[SYSTEM CONTEXT: User has selected ${context.fileCount} media files (${imageMatches?.length || 0} image(s), ${videoMatches?.length || 0} video(s)). Files: ${context.fileNames.join(", ")}. Apply appropriate platform compatibility rules - images work on Instagram/LinkedIn, videos work on all platforms.]`;
  } else if (context.hasVideo) {
    context.mediaType = "video";
    if (context.fileCount === 1) {
      context.contextNote = `[SYSTEM CONTEXT: User has selected 1 video file: ${context.fileNames[0]}. This is a SINGLE VIDEO - do not ask about carousels. Video is compatible with Instagram, YouTube, and LinkedIn.]`;
    } else {
      context.contextNote = `[SYSTEM CONTEXT: User has selected ${context.fileCount} video files: ${context.fileNames.join(", ")}. Suggest creating separate posts for each video.]`;
    }
  } else if (context.hasImage) {
    context.mediaType = "image";
    if (context.fileCount === 1) {
      context.contextNote = `[SYSTEM CONTEXT: User has selected 1 image file: ${context.fileNames[0]}. This is a SINGLE IMAGE - compatible with Instagram and LinkedIn only. DO NOT suggest YouTube.]`;
    } else {
      context.contextNote = `[SYSTEM CONTEXT: User has selected ${context.fileCount} image files: ${context.fileNames.join(", ")}. Perfect for an Instagram CAROUSEL post! Also compatible with LinkedIn. DO NOT suggest YouTube.]`;
    }
  }

  return context;
};

export const chatController = {
  async handleChat(req: Request, res: Response) {
    try {
      const { messages, conversationId } = req.body;
      const userId = DEFAULT_USER_ID;

      // Fetch user's API key from database
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { geminiApiKey: true },
      });

      const apiKey = user?.geminiApiKey;

      if (!apiKey) {
        return res
          .status(401)
          .json({ error: "Gemini API Key is not set in settings" });
      }

      // 1. Handle Conversation Context
      let activeConversationId = conversationId;

      if (!activeConversationId) {
        // Create new conversation if none exists
        const [conversation] = await db
          .insert(conversations)
          .values({
            userId,
            title:
              extractContent(messages[messages.length - 1]).substring(0, 50) ||
              "New Conversation",
            platform: "general",
          })
          .returning();
        activeConversationId = conversation.id;
      }

      // 2. Save User Message and Detect Media Context
      const lastMessage = messages[messages.length - 1];
      let userContent = extractContent(lastMessage);

      if (lastMessage && lastMessage.role === "user") {
        // Detect media context from the message
        const mediaContext = detectMediaContext(userContent);

        // Save the original user message
        await db.insert(chatMessages).values({
          conversationId: activeConversationId,
          role: "user",
          content: userContent,
        });

        // If media context detected, enhance the message for AI processing
        if (mediaContext.mediaType && mediaContext.contextNote) {
          console.log("🎯 Media context detected:", mediaContext);
          // Append context note to the last message for AI (not saved in DB)
          const enhancedMessages = [...messages];
          enhancedMessages[enhancedMessages.length - 1] = {
            ...lastMessage,
            content: userContent + "\n\n" + mediaContext.contextNote,
          };
          // Update messages array for AI processing
          messages.splice(
            messages.length - 1,
            1,
            enhancedMessages[enhancedMessages.length - 1],
          );
        }
      }

      // 3. Initialize AI
      const google = createGoogleGenerativeAI({ apiKey });
      const coreMessages = convertToCoreMessages(messages);

      // 4. Stream Response
      const result = streamText({
        model: google("gemini-2.5-flash"),
        system: `You are an expert AI assistant specialized in social media content creation and scheduling. You have deep knowledge of platform-specific requirements and constraints.

## Platform-Specific Rules:

### Instagram:
- REQUIRES: At least one media item (image or video)
- Supports: Single images, single videos, carousel posts (multiple images)
- Media must be publicly accessible URLs or uploaded files
- Caption max length: 2,200 characters
- Smart detection: If user selects multiple images, automatically suggest carousel
- If user selects a video, DO NOT ask about carousel - it's a single video post
- CRITICAL: Instagram posts cannot be created without media

### YouTube:
- REQUIRES: Video file + Title (mandatory, 1-100 characters)
- Description: Optional, up to 5,000 characters
- Only works with VIDEO files - never suggest for images
- If user selects an image, DO NOT include YouTube as an option
- Always generate a compelling, SEO-friendly title for YouTube videos

### LinkedIn:
- REQUIRES: Post content/text (cannot be empty)
- Max length: 3,000 characters
- Supports: Text posts, images, videos, documents
- Professional tone recommended
- Focus on value-driven, industry-relevant content

## Smart Media Detection:

When a user provides context about media:
1. **Single Image**: Suggest Instagram, LinkedIn (NOT YouTube)
2. **Multiple Images (2+)**: Automatically suggest Instagram Carousel, explain it's perfect for multiple images
3. **Video File (.mp4, .mov, .webm, etc.)**: Suggest all platforms (Instagram, YouTube, LinkedIn)
4. **Image + wants YouTube**: Politely explain "YouTube requires video files. Your selected image is better suited for Instagram or LinkedIn. Would you like me to create content for those platforms instead?"
5. **No media + wants Instagram**: Remind "Instagram requires at least one image or video. Please select media first, or I can help you create content for LinkedIn which supports text-only posts."

## Context Awareness:

If you detect from the user's message:
- File names with extensions (e.g., "video.mp4", "image.jpg", "photo.png"): Automatically identify media type
- Multiple files mentioned: Count them and suggest appropriate formats (carousel for images)
- Cloud storage mentions (Dropbox, Google Drive): Acknowledge the file source
- Platform mentions: Focus on that platform's specific requirements and validate compatibility

## Response Guidelines:

1. **Be proactive**: If you detect missing required fields (like YouTube title, Instagram media), mention them immediately
2. **Platform filtering**: Only suggest platforms that are compatible with the user's selected media type
3. **Validation**: Before generating content, verify all requirements are met for each platform
4. **Format compliance**: Respect character limits and format requirements for each platform
5. **Professional quality**: Generate engaging, platform-appropriate content that drives engagement

## When Generating Content:

- **For Instagram**: Focus on visual storytelling, use relevant hashtags (3-5), emotive language, call-to-action
- **For YouTube**: Provide attention-grabbing titles (capitalize key words), detailed descriptions with timestamps if relevant, SEO keywords
- **For LinkedIn**: Professional tone, value-driven content, industry insights, thought leadership, proper formatting

## Critical Rules:

- NEVER suggest YouTube for image files
- NEVER suggest Instagram without media
- ALWAYS provide a title when generating YouTube content
- ALWAYS validate that required fields are present before confirming content generation
- If user request is incompatible with their selections, explain why clearly and suggest alternatives

Always ask clarifying questions if critical information is missing. Your goal is to prevent scheduling errors by ensuring all platform requirements are met upfront.`,
        messages: coreMessages,
      });

      // Set headers
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Transfer-Encoding", "chunked");
      res.setHeader("X-Conversation-Id", activeConversationId);

      const stream = result.textStream;
      let fullResponse = "";

      for await (const chunk of stream) {
        res.write(chunk);
        fullResponse += chunk;
      }

      // 5. Save Assistant Message
      if (fullResponse) {
        await db.insert(chatMessages).values({
          conversationId: activeConversationId,
          role: "assistant",
          content: fullResponse,
        });
      }

      res.end();
    } catch (error) {
      console.error("Chat API Error:", error);
      if (!res.headersSent) {
        return res.status(500).json({ error: "Internal Server Error" });
      }
    }
  },

  // Get all conversations for a user
  async getConversations(req: Request, res: Response) {
    try {
      const userId = DEFAULT_USER_ID;

      const results = await db.query.conversations.findMany({
        where: and(
          eq(conversations.userId, userId),
          isNull(conversations.deletedAt),
        ),
        with: {
          messages: {
            limit: 1,
            orderBy: [desc(chatMessages.createdAt)],
          },
        },
        orderBy: [desc(conversations.updatedAt)],
      });

      // Add message count
      const conversationsWithCount = results.map((conv) => ({
        ...conv,
        _count: { messages: conv.messages.length },
      }));

      return res.json(conversationsWithCount);
    } catch (error) {
      console.error("Get conversations error:", error);
      return res.status(500).json({ error: "Failed to fetch conversations" });
    }
  },

  // Create a new conversation
  async createConversation(req: Request, res: Response) {
    try {
      const userId = DEFAULT_USER_ID;
      const { title, platform, template } = req.body;

      const [conversation] = await db
        .insert(conversations)
        .values({
          userId,
          title: title || "New Conversation",
          platform,
          template,
        })
        .returning();

      return res.json(conversation);
    } catch (error) {
      console.error("Create conversation error:", error);
      return res.status(500).json({ error: "Failed to create conversation" });
    }
  },

  // Get a specific conversation with all messages
  async getConversation(req: Request, res: Response) {
    try {
      const userId = DEFAULT_USER_ID;
      const { id } = req.params;

      const conversation = await db.query.conversations.findFirst({
        where: and(
          eq(conversations.id, id),
          eq(conversations.userId, userId),
          isNull(conversations.deletedAt),
        ),
        with: {
          messages: {
            orderBy: [asc(chatMessages.createdAt)],
          },
        },
      });

      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      return res.json(conversation);
    } catch (error) {
      console.error("Get conversation error:", error);
      return res.status(500).json({ error: "Failed to fetch conversation" });
    }
  },

  // Update conversation (rename)
  async updateConversation(req: Request, res: Response) {
    try {
      const userId = DEFAULT_USER_ID;
      const { id } = req.params;
      const { title } = req.body;

      const conversation = await db.query.conversations.findFirst({
        where: and(
          eq(conversations.id, id),
          eq(conversations.userId, userId),
          isNull(conversations.deletedAt),
        ),
      });

      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      const [updated] = await db
        .update(conversations)
        .set({ title, updatedAt: new Date() })
        .where(eq(conversations.id, id))
        .returning();

      return res.json(updated);
    } catch (error) {
      console.error("Update conversation error:", error);
      return res.status(500).json({ error: "Failed to update conversation" });
    }
  },

  // Delete conversation (soft delete)
  async deleteConversation(req: Request, res: Response) {
    try {
      const userId = DEFAULT_USER_ID;
      const { id } = req.params;

      const conversation = await db.query.conversations.findFirst({
        where: and(
          eq(conversations.id, id),
          eq(conversations.userId, userId),
          isNull(conversations.deletedAt),
        ),
      });

      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      await db
        .update(conversations)
        .set({ deletedAt: new Date() })
        .where(eq(conversations.id, id));

      return res.json({ success: true });
    } catch (error) {
      console.error("Delete conversation error:", error);
      return res.status(500).json({ error: "Failed to delete conversation" });
    }
  },
};
