-- CreateEnum (add PARTNERSHIP_UPDATED notification type)
ALTER TYPE "NotificationType" ADD VALUE 'PARTNERSHIP_UPDATED';

-- CreateTable
CREATE TABLE "PartnershipApplication" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "organizationName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "website" TEXT,
    "description" TEXT NOT NULL,
    "audience" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "PartnershipApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PartnershipApplication_userId_idx" ON "PartnershipApplication"("userId");

-- CreateIndex
CREATE INDEX "PartnershipApplication_status_idx" ON "PartnershipApplication"("status");

-- AddForeignKey
ALTER TABLE "PartnershipApplication" ADD CONSTRAINT "PartnershipApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
