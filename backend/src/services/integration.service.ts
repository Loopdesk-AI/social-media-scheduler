import { db } from "../database/db";
import { integrations, users } from "../database/schema";
import { eq, and, isNull } from "drizzle-orm";
import { integrationManager } from "../providers/integration.manager";
import { encrypt, decrypt } from "./encryption.service";
import dayjs from "dayjs";
import { NotFoundError, ValidationError } from "../utils/errors";

/**
 * Integration Service
 * Handles OAuth flows and integration management
 */
class IntegrationService {
  // In-memory state storage (in production, use Redis)
  private stateStore = new Map<string, { userId: string; timestamp: number }>();

  /**
   * Generate OAuth authorization URL
   */
  async generateAuthUrl(provider: string, userId: string) {
    const socialProvider = integrationManager.getSocialIntegration(provider);
    const authData = await socialProvider.generateAuthUrl();

    // Store state with userId for callback verification
    this.stateStore.set(authData.state, {
      userId,
      timestamp: Date.now(),
    });

    console.log(`🔐 OAuth state stored: ${authData.state} → userId: ${userId}`);
    console.log(`📊 State store size: ${this.stateStore.size}`);

    // Clean up old states (older than 10 minutes)
    this.cleanupOldStates();

    return {
      url: authData.url,
      state: authData.state,
      provider,
    };
  }

  /**
   * Clean up expired OAuth states
   */
  private cleanupOldStates() {
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    for (const [state, data] of this.stateStore.entries()) {
      if (data.timestamp < tenMinutesAgo) {
        this.stateStore.delete(state);
      }
    }
  }

  /**
   * Get userId from OAuth state
   */
  private getUserIdFromState(state: string): string | null {
    console.log(`🔍 Looking up state: ${state}`);
    console.log(`📊 State store size: ${this.stateStore.size}`);
    console.log(
      `📋 Available states: ${Array.from(this.stateStore.keys()).join(", ")}`,
    );

    const data = this.stateStore.get(state);
    if (!data) {
      console.log(`❌ State not found: ${state}`);
      return null;
    }

    console.log(`✅ State found: ${state} → userId: ${data.userId}`);

    // Delete state after use (one-time use)
    this.stateStore.delete(state);
    return data.userId;
  }

  /**
   * Handle OAuth callback and create integration
   */
  async handleOAuthCallback(
    provider: string,
    code: string,
    state: string,
    userIdFromParam?: string,
    selectedAccountId?: string,
  ) {
    try {
      // Get userId from state or parameter
      let userId: string | null = this.getUserIdFromState(state);

      if (!userId && userIdFromParam) {
        // Fallback to parameter (for backward compatibility)
        userId = userIdFromParam;
      }

      if (!userId) {
        throw new ValidationError(
          "Invalid OAuth state: user session not found",
        );
      }

      // Verify user exists
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        throw new ValidationError("User not found");
      }

      const socialProvider = integrationManager.getSocialIntegration(provider);

      // Authenticate and get tokens
      const authDetails = await socialProvider.authenticate({
        code,
        codeVerifier: "", // Not used for server-side flow
      });

      // Encrypt tokens
      const encryptedToken = encrypt(authDetails.accessToken);
      const encryptedRefreshToken = authDetails.refreshToken
        ? encrypt(authDetails.refreshToken)
        : null;

      // Calculate expiration
      const tokenExpiration = dayjs()
        .add(authDetails.expiresIn, "seconds")
        .toDate();

      // Check if integration already exists
      const existingIntegration = await db.query.integrations.findFirst({
        where: and(
          eq(integrations.userId, userId),
          eq(integrations.internalId, authDetails.id),
          eq(integrations.providerIdentifier, provider),
        ),
      });

      let integration;
      if (existingIntegration) {
        // Update existing integration
        const [updated] = await db
          .update(integrations)
          .set({
            name: authDetails.name,
            picture: authDetails.picture,
            token: encryptedToken,
            refreshToken: encryptedRefreshToken,
            tokenExpiration,
            disabled: false,
            refreshNeeded: false,
            deletedAt: null,
            profile: JSON.stringify({
              username: authDetails.username,
            }),
            updatedAt: new Date(),
          })
          .where(eq(integrations.id, existingIntegration.id))
          .returning();
        integration = updated;
        console.log(
          `✅ Updated integration: ${integration.name} (${provider})`,
        );
      } else {
        // Create new integration
        const [created] = await db
          .insert(integrations)
          .values({
            internalId: authDetails.id,
            userId,
            name: authDetails.name,
            picture: authDetails.picture,
            providerIdentifier: provider,
            type: "social",
            token: encryptedToken,
            refreshToken: encryptedRefreshToken,
            tokenExpiration,
            profile: JSON.stringify({
              username: authDetails.username,
            }),
          })
          .returning();
        integration = created;
        console.log(
          `✅ Created integration: ${integration.name} (${provider})`,
        );
      }

      return {
        id: integration.id,
        name: integration.name,
        picture: integration.picture,
        providerIdentifier: integration.providerIdentifier,
      };
    } catch (error) {
      console.error("OAuth callback error:", error);
      throw error;
    }
  }

  /**
   * List integrations for user by type
   */
  async getIntegrationsByUserIdAndType(userId: string, type: string) {
    const results = await db.query.integrations.findMany({
      where: and(
        eq(integrations.userId, userId),
        eq(integrations.type, type),
        isNull(integrations.deletedAt),
      ),
      orderBy: (integrations, { desc }) => [desc(integrations.createdAt)],
    });

    return results.map((integration) => {
      const isExpired = integration.tokenExpiration
        ? dayjs(integration.tokenExpiration).isBefore(dayjs())
        : false;

      return {
        id: integration.id,
        internalId: integration.internalId,
        name: integration.name,
        picture: integration.picture,
        providerIdentifier: integration.providerIdentifier,
        type: integration.type,
        disabled: integration.disabled,
        refreshNeeded: integration.refreshNeeded || isExpired,
        profile: integration.profile,
        createdAt: integration.createdAt,
      };
    });
  }

  /**
   * Get single integration by ID
   */
  async getIntegrationById(id: string) {
    const integration = await db.query.integrations.findFirst({
      where: and(eq(integrations.id, id), isNull(integrations.deletedAt)),
    });

    if (!integration) {
      return null;
    }

    const isExpired = integration.tokenExpiration
      ? dayjs(integration.tokenExpiration).isBefore(dayjs())
      : false;

    return {
      id: integration.id,
      userId: integration.userId,
      internalId: integration.internalId,
      name: integration.name,
      picture: integration.picture,
      providerIdentifier: integration.providerIdentifier,
      type: integration.type,
      token: integration.token,
      refreshToken: integration.refreshToken,
      tokenExpiration: integration.tokenExpiration,
      disabled: integration.disabled,
      refreshNeeded: integration.refreshNeeded || isExpired,
      profile: integration.profile,
      createdAt: integration.createdAt,
    };
  }

  /**
   * List all integrations for user
   */
  async listIntegrations(userId: string) {
    const results = await db.query.integrations.findMany({
      where: and(
        eq(integrations.userId, userId),
        isNull(integrations.deletedAt),
      ),
      orderBy: (integrations, { desc }) => [desc(integrations.createdAt)],
    });

    return results.map((integration) => {
      const isExpired = integration.tokenExpiration
        ? dayjs(integration.tokenExpiration).isBefore(dayjs())
        : false;

      return {
        id: integration.id,
        internalId: integration.internalId,
        name: integration.name,
        picture: integration.picture,
        providerIdentifier: integration.providerIdentifier,
        type: integration.type,
        disabled: integration.disabled,
        refreshNeeded: integration.refreshNeeded || isExpired,
        profile: integration.profile,
        createdAt: integration.createdAt,
      };
    });
  }

  /**
   * Get single integration
   */
  async getIntegration(id: string, userId: string) {
    const integration = await db.query.integrations.findFirst({
      where: and(
        eq(integrations.id, id),
        eq(integrations.userId, userId),
        isNull(integrations.deletedAt),
      ),
    });

    if (!integration) {
      throw new NotFoundError("Integration not found");
    }

    return integration;
  }

  /**
   * Delete integration (soft delete)
   */
  async deleteIntegration(id: string, userId: string) {
    const integration = await this.getIntegration(id, userId);

    // Cancel all scheduled posts for this integration
    const { posts } = await import("../database/schema");
    await db
      .update(posts)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(posts.integrationId, id),
          eq(posts.state, "QUEUE"),
          isNull(posts.deletedAt),
        ),
      );

    // Soft delete integration
    await db
      .update(integrations)
      .set({ deletedAt: new Date() })
      .where(eq(integrations.id, id));

    console.log(`🗑️  Deleted integration: ${integration.name}`);

    return { success: true };
  }

  /**
   * Toggle integration enabled/disabled
   */
  async toggleIntegration(id: string, userId: string) {
    const integration = await this.getIntegration(id, userId);

    const [updated] = await db
      .update(integrations)
      .set({ disabled: !integration.disabled })
      .where(eq(integrations.id, id))
      .returning();

    return {
      id: updated.id,
      disabled: updated.disabled,
    };
  }

  /**
   * Reconnect integration with new OAuth flow
   */
  async reconnectIntegration(id: string, code: string, userId: string) {
    const integration = await this.getIntegration(id, userId);
    const provider = integrationManager.getSocialIntegration(
      integration.providerIdentifier,
    );

    // Authenticate with new code
    const authDetails = await provider.authenticate({
      code,
      codeVerifier: "",
    });

    // Encrypt new tokens
    const encryptedToken = encrypt(authDetails.accessToken);
    const encryptedRefreshToken = authDetails.refreshToken
      ? encrypt(authDetails.refreshToken)
      : null;

    // Calculate expiration
    const tokenExpiration = dayjs()
      .add(authDetails.expiresIn, "seconds")
      .toDate();

    // Update integration
    await db
      .update(integrations)
      .set({
        token: encryptedToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiration,
        refreshNeeded: false,
        updatedAt: new Date(),
      })
      .where(eq(integrations.id, id));

    console.log(`🔄 Reconnected integration: ${integration.name}`);

    return { success: true };
  }

  /**
   * Create or update storage integration
   */
  async createOrUpdateStorageIntegration(
    userId: string,
    providerIdentifier: string,
    authDetails: any,
  ) {
    // Encrypt tokens
    const encryptedToken = encrypt(authDetails.accessToken);
    const encryptedRefreshToken = authDetails.refreshToken
      ? encrypt(authDetails.refreshToken)
      : null;

    // Calculate expiration
    const tokenExpiration = authDetails.expiresIn
      ? new Date(Date.now() + authDetails.expiresIn * 1000)
      : null;

    // Check if integration already exists
    const existingIntegration = await db.query.integrations.findFirst({
      where: and(
        eq(integrations.userId, userId),
        eq(integrations.internalId, authDetails.id),
        eq(integrations.providerIdentifier, providerIdentifier),
        eq(integrations.type, "storage"),
      ),
    });

    let integration;
    if (existingIntegration) {
      // Update existing integration
      const [updated] = await db
        .update(integrations)
        .set({
          name: authDetails.name,
          picture: authDetails.picture,
          token: encryptedToken,
          refreshToken: encryptedRefreshToken,
          tokenExpiration,
          disabled: false,
          refreshNeeded: false,
          deletedAt: null,
          profile: JSON.stringify({
            email: authDetails.email,
          }),
          updatedAt: new Date(),
        })
        .where(eq(integrations.id, existingIntegration.id))
        .returning();
      integration = updated;
      console.log(
        `✅ Updated storage integration: ${integration.name} (${providerIdentifier})`,
      );
    } else {
      // Create new integration
      const [created] = await db
        .insert(integrations)
        .values({
          internalId: authDetails.id,
          userId,
          name: authDetails.name,
          picture: authDetails.picture,
          providerIdentifier,
          type: "storage",
          token: encryptedToken,
          refreshToken: encryptedRefreshToken,
          tokenExpiration,
          profile: JSON.stringify({
            email: authDetails.email,
          }),
        })
        .returning();
      integration = created;
      console.log(
        `✅ Created storage integration: ${integration.name} (${providerIdentifier})`,
      );
    }

    return {
      id: integration.id,
      name: integration.name,
      picture: integration.picture,
      providerIdentifier: integration.providerIdentifier,
    };
  }

  /**
   * Add a test integration using a direct token (for development/testing only)
   */
  async addTestIntegration(
    provider: string,
    userId: string,
    accessToken: string,
    name: string,
    internalId: string,
    picture?: string,
    username?: string,
  ) {
    // Only allow this in development environment
    if (process.env.NODE_ENV !== "development") {
      throw new ValidationError(
        "Test integration creation is only allowed in development mode",
      );
    }

    // Encrypt tokens
    const encryptedToken = encrypt(accessToken);

    // Calculate expiration (set to 60 days from now for Instagram)
    const tokenExpiration = dayjs().add(60, "days").toDate();

    // Create integration
    const [integration] = await db
      .insert(integrations)
      .values({
        internalId,
        userId,
        name,
        picture,
        providerIdentifier: provider,
        type: "social",
        token: encryptedToken,
        tokenExpiration,
        profile: JSON.stringify({
          username: username || name,
        }),
      })
      .returning();

    console.log(
      `✅ Created test integration: ${integration.name} (${provider})`,
    );

    return {
      id: integration.id,
      name: integration.name,
      picture: integration.picture,
      providerIdentifier: integration.providerIdentifier,
    };
  }
}

// Export singleton instance
export const integrationService = new IntegrationService();
