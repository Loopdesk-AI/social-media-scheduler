import { Router } from "express";
import { userController } from "../controllers/user.controller";

const router = Router();

router.get("/profile", userController.getProfile);
router.put("/profile", userController.updateProfile);

export const userRoutes = router;
