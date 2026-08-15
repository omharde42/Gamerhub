-- CreateEnum
CREATE TYPE "ClipStatus" AS ENUM ('UPLOADED', 'TRIMMING', 'TRIMMED', 'FAILED');

-- CreateEnum
CREATE TYPE "MontageStatus" AS ENUM ('DRAFT', 'RENDERING', 'READY', 'FAILED');

-- AlterEnum (add VIDEO_RENDER notification type)
ALTER TYPE "NotificationType" ADD VALUE 'VIDEO_RENDER';

-- CreateTable
CREATE TABLE "VideoClip" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourcePublicId" TEXT,
    "trimmedUrl" TEXT,
    "trimmedPublicId" TEXT,
    "thumbnailUrl" TEXT,
    "durationSec" DOUBLE PRECISION,
    "trimStartSec" DOUBLE PRECISION,
    "trimEndSec" DOUBLE PRECISION,
    "status" "ClipStatus" NOT NULL DEFAULT 'UPLOADED',
    "sizeBytes" INTEGER,
    "mimeType" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "VideoClip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MontageProject" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "edl" JSONB NOT NULL,
    "status" "MontageStatus" NOT NULL DEFAULT 'DRAFT',
    "previewUrl" TEXT,
    "renderUrl" TEXT,
    "thumbnailUrl" TEXT,
    "renderError" TEXT,
    "isAiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "MontageProject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VideoClip_userId_idx" ON "VideoClip"("userId");

-- CreateIndex
CREATE INDEX "VideoClip_createdAt_idx" ON "VideoClip"("createdAt");

-- CreateIndex
CREATE INDEX "MontageProject_userId_idx" ON "MontageProject"("userId");

-- CreateIndex
CREATE INDEX "MontageProject_status_idx" ON "MontageProject"("status");

-- CreateIndex
CREATE INDEX "MontageProject_createdAt_idx" ON "MontageProject"("createdAt");

-- AddForeignKey
ALTER TABLE "VideoClip" ADD CONSTRAINT "VideoClip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MontageProject" ADD CONSTRAINT "MontageProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
