-- CreateEnum
CREATE TYPE "State" AS ENUM ('QUEUE', 'PUBLISHED', 'ERROR', 'DRAFT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT,
    "timezone" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "internalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "picture" TEXT,
    "providerIdentifier" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiration" TIMESTAMP(3),
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "refreshNeeded" BOOLEAN NOT NULL DEFAULT false,
    "profile" TEXT,
    "settings" JSONB,
    "healthStatus" TEXT NOT NULL DEFAULT 'healthy',
    "lastHealthCheck" TIMESTAMP(3),
    "metadata" JSONB,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "state" "State" NOT NULL DEFAULT 'QUEUE',
    "publishDate" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "settings" JSONB,
    "releaseId" TEXT,
    "releaseURL" TEXT,
    "error" TEXT,
    "jobId" TEXT,
    "postType" TEXT NOT NULL DEFAULT 'standard',
    "mediaMetadata" JSONB,
    "scheduledBy" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastRetryAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "thumbnail" TEXT,
    "thumbnailTimestamp" INTEGER,
    "type" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Analytics" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "platform" TEXT NOT NULL,
    "metrics" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Integration_userId_idx" ON "Integration"("userId");

-- CreateIndex
CREATE INDEX "Integration_providerIdentifier_idx" ON "Integration"("providerIdentifier");

-- CreateIndex
CREATE INDEX "Integration_refreshNeeded_idx" ON "Integration"("refreshNeeded");

-- CreateIndex
CREATE INDEX "Integration_healthStatus_idx" ON "Integration"("healthStatus");

-- CreateIndex
CREATE INDEX "Integration_lastHealthCheck_idx" ON "Integration"("lastHealthCheck");

-- CreateIndex
CREATE INDEX "Integration_deletedAt_idx" ON "Integration"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Integration_userId_internalId_key" ON "Integration"("userId", "internalId");

-- CreateIndex
CREATE INDEX "Post_userId_idx" ON "Post"("userId");

-- CreateIndex
CREATE INDEX "Post_integrationId_idx" ON "Post"("integrationId");

-- CreateIndex
CREATE INDEX "Post_state_idx" ON "Post"("state");

-- CreateIndex
CREATE INDEX "Post_publishDate_idx" ON "Post"("publishDate");

-- CreateIndex
CREATE INDEX "Post_group_idx" ON "Post"("group");

-- CreateIndex
CREATE INDEX "Post_postType_idx" ON "Post"("postType");

-- CreateIndex
CREATE INDEX "Post_retryCount_idx" ON "Post"("retryCount");

-- CreateIndex
CREATE INDEX "Post_deletedAt_idx" ON "Post"("deletedAt");

-- CreateIndex
CREATE INDEX "Media_userId_idx" ON "Media"("userId");

-- CreateIndex
CREATE INDEX "Media_type_idx" ON "Media"("type");

-- CreateIndex
CREATE INDEX "Media_deletedAt_idx" ON "Media"("deletedAt");

-- CreateIndex
CREATE INDEX "Analytics_date_idx" ON "Analytics"("date");

-- CreateIndex
CREATE INDEX "Analytics_platform_idx" ON "Analytics"("platform");

-- CreateIndex
CREATE INDEX "Analytics_integrationId_idx" ON "Analytics"("integrationId");

-- CreateIndex
CREATE UNIQUE INDEX "Analytics_integrationId_date_platform_key" ON "Analytics"("integrationId", "date", "platform");

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Analytics" ADD CONSTRAINT "Analytics_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
