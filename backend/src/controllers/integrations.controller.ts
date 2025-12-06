import { Request, Response, NextFunction } from "express";
import { integrationService } from "../services/integration.service";
import { integrationManager } from "../providers/integration.manager";

// Default user ID for simplified operation (no auth)
const DEFAULT_USER_ID = "default-user";

export class IntegrationsController {
  /**
   * GET /api/integrations/types
   * Get all available integration types
   */
  async getIntegrationTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const types = await integrationManager.getAllIntegrations();
      res.json(types);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/integrations/:provider/auth-url
   * Generate OAuth authorization URL
   */
  async generateAuthUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const { provider } = req.params;
      const userId = DEFAULT_USER_ID;

      const result = await integrationService.generateAuthUrl(provider, userId);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/integrations/:provider/callback
   * Handle OAuth callback
   */
  async handleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { provider } = req.params;
      // Extract code and state from either query params (GET) or body (POST)
      const code = req.query.code || req.body.code;
      const state = req.query.state || req.body.state;

      if (!code || !state) {
        // Redirect to frontend with error
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        return res.redirect(
          `${frontendUrl}/integrations/social/${provider}?error=missing_params`,
        );
      }

      const result = await integrationService.handleOAuthCallback(
        provider,
        code as string,
        state as string,
      );

      // Redirect to frontend OAuth callback route with success
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      res.redirect(
        `${frontendUrl}/integrations/social/${provider}?integration=success`,
      );
    } catch (error: any) {
      // Redirect to frontend with error
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const { provider } = req.params;
      const errorMessage = encodeURIComponent(
        error.message || "Integration failed",
      );
      res.redirect(
        `${frontendUrl}/integrations/social/${provider}?error=${errorMessage}`,
      );
    }
  }

  /**
   * GET /api/integrations
   * List all integrations
   */
  async listIntegrations(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = DEFAULT_USER_ID;
      const integrations = await integrationService.listIntegrations(userId);
      res.json(integrations);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/integrations/:id
   * Get single integration
   */
  async getIntegration(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = DEFAULT_USER_ID;
      const integration = await integrationService.getIntegration(id, userId);
      res.json(integration);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/integrations/:id
   * Delete integration
   */
  async deleteIntegration(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = DEFAULT_USER_ID;
      const result = await integrationService.deleteIntegration(id, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/integrations/:id/toggle
   * Toggle integration enabled/disabled
   */
  async toggleIntegration(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = DEFAULT_USER_ID;
      const result = await integrationService.toggleIntegration(id, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/integrations/:id/reconnect
   * Reconnect integration
   */
  async reconnectIntegration(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { code } = req.body;
      const userId = DEFAULT_USER_ID;
      const result = await integrationService.reconnectIntegration(
        id,
        code,
        userId,
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/integrations/test
   * Add a test integration using a direct token (development only)
   */
  async addTestIntegration(req: Request, res: Response, next: NextFunction) {
    try {
      // Only allow in development environment
      if (process.env.NODE_ENV !== "development") {
        return res.status(403).json({ error: "Forbidden" });
      }

      const userId = DEFAULT_USER_ID;
      const { provider, accessToken, name, internalId, picture, username } =
        req.body;

      const result = await integrationService.addTestIntegration(
        provider,
        userId,
        accessToken,
        name,
        internalId,
        picture,
        username,
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
