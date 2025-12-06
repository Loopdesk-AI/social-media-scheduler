import { Router } from "express";
import { PostsController } from "../controllers/posts.controller";

const router = Router();
const controller = new PostsController();

// Post management
router.post("/", controller.createPost.bind(controller));
router.post(
  "/multi-platform",
  controller.createMultiPlatformPost.bind(controller),
);
router.get("/", controller.listPosts.bind(controller));
router.get("/calendar/counts", controller.getPostsCounts.bind(controller));
router.get("/group/:groupId", controller.getPostsByGroup.bind(controller));
router.get("/:id", controller.getPost.bind(controller));
router.patch("/:id", controller.updatePost.bind(controller));
router.patch("/:id/reschedule", controller.reschedulePost.bind(controller));
router.patch("/group/:groupId", controller.updateGroupPosts.bind(controller));
router.delete("/:id", controller.cancelPost.bind(controller));
router.delete("/group/:groupId", controller.cancelGroupPosts.bind(controller));

export { router as postsRoutes };
