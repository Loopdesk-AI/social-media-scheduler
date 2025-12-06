import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  json,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const stateEnum = pgEnum("state", [
  "QUEUE",
  "PUBLISHED",
  "ERROR",
  "DRAFT",
]);

// Users table (simplified - no authentication)
export const users = pgTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text("email").unique().notNull(),
    name: text("name"),
    timezone: integer("timezone").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("users_email_idx").on(table.email)],
);

// Integrations table
export const integrations = pgTable(
  "integrations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    internalId: text("internal_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    picture: text("picture"),
    providerIdentifier: text("provider_identifier").notNull(),
    type: text("type").notNull(), // 'social' or 'storage'
    token: text("token").notNull(),
    refreshToken: text("refresh_token"),
    tokenExpiration: timestamp("token_expiration"),
    disabled: boolean("disabled").default(false).notNull(),
    refreshNeeded: boolean("refresh_needed").default(false).notNull(),
    profile: text("profile"),
    settings: json("settings"),
    healthStatus: text("health_status").default("healthy").notNull(),
    lastHealthCheck: timestamp("last_health_check"),
    metadata: json("metadata"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("integrations_user_internal_idx").on(
      table.userId,
      table.internalId,
    ),
    index("integrations_user_id_idx").on(table.userId),
    index("integrations_provider_idx").on(table.providerIdentifier),
    index("integrations_refresh_needed_idx").on(table.refreshNeeded),
    index("integrations_health_status_idx").on(table.healthStatus),
    index("integrations_last_health_check_idx").on(table.lastHealthCheck),
    index("integrations_deleted_at_idx").on(table.deletedAt),
  ],
);

// Posts table
export const posts = pgTable(
  "posts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    state: stateEnum("state").default("QUEUE").notNull(),
    publishDate: timestamp("publish_date").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    integrationId: text("integration_id")
      .notNull()
      .references(() => integrations.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    group: text("group").notNull(),
    settings: json("settings"),
    releaseId: text("release_id"),
    releaseURL: text("release_url"),
    error: text("error"),
    jobId: text("job_id"),
    postType: text("post_type").default("standard").notNull(),
    mediaMetadata: json("media_metadata"),
    scheduledBy: text("scheduled_by"),
    retryCount: integer("retry_count").default(0).notNull(),
    lastRetryAt: timestamp("last_retry_at"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("posts_user_id_idx").on(table.userId),
    index("posts_integration_id_idx").on(table.integrationId),
    index("posts_state_idx").on(table.state),
    index("posts_publish_date_idx").on(table.publishDate),
    index("posts_group_idx").on(table.group),
    index("posts_post_type_idx").on(table.postType),
    index("posts_retry_count_idx").on(table.retryCount),
    index("posts_deleted_at_idx").on(table.deletedAt),
  ],
);

// Media table
export const media = pgTable(
  "media",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    path: text("path").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    thumbnail: text("thumbnail"),
    thumbnailTimestamp: integer("thumbnail_timestamp"),
    type: text("type").notNull(), // 'image' or 'video'
    fileSize: integer("file_size").default(0).notNull(),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("media_user_id_idx").on(table.userId),
    index("media_type_idx").on(table.type),
    index("media_deleted_at_idx").on(table.deletedAt),
  ],
);

// Analytics table
export const analytics = pgTable(
  "analytics",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    integrationId: text("integration_id")
      .notNull()
      .references(() => integrations.id, { onDelete: "cascade" }),
    date: timestamp("date").notNull(),
    platform: text("platform").notNull(),
    metrics: json("metrics").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("analytics_integration_date_platform_idx").on(
      table.integrationId,
      table.date,
      table.platform,
    ),
    index("analytics_date_idx").on(table.date),
    index("analytics_platform_idx").on(table.platform),
    index("analytics_integration_id_idx").on(table.integrationId),
  ],
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  integrations: many(integrations),
  posts: many(posts),
  media: many(media),
}));

export const integrationsRelations = relations(
  integrations,
  ({ one, many }) => ({
    user: one(users, {
      fields: [integrations.userId],
      references: [users.id],
    }),
    posts: many(posts),
    analytics: many(analytics),
  }),
);

export const postsRelations = relations(posts, ({ one }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
  integration: one(integrations, {
    fields: [posts.integrationId],
    references: [integrations.id],
  }),
}));

export const mediaRelations = relations(media, ({ one }) => ({
  user: one(users, {
    fields: [media.userId],
    references: [users.id],
  }),
}));

export const analyticsRelations = relations(analytics, ({ one }) => ({
  integration: one(integrations, {
    fields: [analytics.integrationId],
    references: [integrations.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Integration = typeof integrations.$inferSelect;
export type NewIntegration = typeof integrations.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;
export type Analytics = typeof analytics.$inferSelect;
export type NewAnalytics = typeof analytics.$inferInsert;
