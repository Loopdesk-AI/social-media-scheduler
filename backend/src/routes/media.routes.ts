import { Router } from "express";
import { MediaController } from "../controllers/media.controller";
import multer from "multer";

const router = Router();
const controller = new MediaController();

// Configure multer for file uploads
const upload = multer({
  dest: "/tmp/uploads",
  limits: {
    fileSize: 5 * 1024 * 1024 * 1024, // 5GB max
  },
});

// Upload media
router.post("/upload", upload.single("file"), controller.uploadMedia);

// List media
router.get("/", controller.listMedia);

// Get single media
router.get("/:id", controller.getMedia);

// Delete media
router.delete("/:id", controller.deleteMedia);

export { router as mediaRoutes };
