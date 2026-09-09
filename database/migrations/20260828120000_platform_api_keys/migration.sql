-- CreateTable
CREATE TABLE "PlatformApiKey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "PlatformApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformApiKey_keyHash_key" ON "PlatformApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "PlatformApiKey_organizationId_status_idx" ON "PlatformApiKey"("organizationId", "status");

-- AddForeignKey
ALTER TABLE "PlatformApiKey" ADD CONSTRAINT "PlatformApiKey_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
