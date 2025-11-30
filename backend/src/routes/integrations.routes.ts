import { Router } from "express";
import { IntegrationsController } from "../controllers/integrations.controller";

const router = Router();
const controller = new IntegrationsController();

// OAuth flow
router.get("/:provider/auth-url", controller.generateAuthUrl.bind(controller));
router.get("/:provider/callback", controller.handleCallback.bind(controller));
router.post("/:provider/callback", controller.handleCallback.bind(controller));

// Test integration (development only)
router.post("/test", controller.addTestIntegration.bind(controller));

// Integration management
router.get("/types", controller.getIntegrationTypes.bind(controller));
router.get("/", controller.listIntegrations.bind(controller));
router.get("/:id", controller.getIntegration.bind(controller));
router.delete("/:id", controller.deleteIntegration.bind(controller));
router.patch("/:id/toggle", controller.toggleIntegration.bind(controller));
router.post("/:id/reconnect", controller.reconnectIntegration.bind(controller));

export { router as integrationsRoutes };
