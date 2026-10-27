-- AlterTable
ALTER TABLE "RentContract" ADD COLUMN     "unitId" TEXT;

-- AlterTable
ALTER TABLE "SpaceAssignment" ADD COLUMN     "unitId" TEXT,
ALTER COLUMN "facilityId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Building" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "totalArea" DOUBLE PRECISION,
    "leasableArea" DOUBLE PRECISION,
    "notes" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Floor" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "planImageUrl" TEXT,
    "notes" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Floor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpaceUnit" (
    "id" TEXT NOT NULL,
    "floorId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "unitType" TEXT NOT NULL,
    "area" DOUBLE PRECISION NOT NULL,
    "capacity" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "notes" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpaceUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsurancePolicy" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT,
    "unitId" TEXT,
    "policyType" TEXT NOT NULL,
    "coverage" TEXT,
    "insurer" TEXT NOT NULL,
    "policyNo" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "premium" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "documentUrl" TEXT,
    "notes" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsurancePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemParameter" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemParameter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessCard" (
    "id" TEXT NOT NULL,
    "cardUid" TEXT NOT NULL,
    "label" TEXT,
    "holderType" TEXT NOT NULL,
    "personId" TEXT,
    "entrepreneurId" TEXT,
    "holderName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessDevice" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "buildingId" TEXT,
    "location" TEXT,
    "direction" TEXT NOT NULL DEFAULT 'BOTH',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessEvent" (
    "id" TEXT NOT NULL,
    "cardId" TEXT,
    "cardUid" TEXT NOT NULL,
    "holderName" TEXT NOT NULL,
    "holderType" TEXT NOT NULL,
    "entrepreneurId" TEXT,
    "direction" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,
    "deviceId" TEXT,
    "externalId" TEXT,
    "note" TEXT,
    "isVoid" BOOLEAN NOT NULL DEFAULT false,
    "voidReason" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Building_isArchived_idx" ON "Building"("isArchived");

-- CreateIndex
CREATE INDEX "Floor_buildingId_idx" ON "Floor"("buildingId");

-- CreateIndex
CREATE INDEX "SpaceUnit_floorId_idx" ON "SpaceUnit"("floorId");

-- CreateIndex
CREATE INDEX "SpaceUnit_status_idx" ON "SpaceUnit"("status");

-- CreateIndex
CREATE INDEX "InsurancePolicy_endDate_idx" ON "InsurancePolicy"("endDate");

-- CreateIndex
CREATE UNIQUE INDEX "InsurancePolicy_insurer_policyNo_key" ON "InsurancePolicy"("insurer", "policyNo");

-- CreateIndex
CREATE INDEX "SystemParameter_category_isActive_idx" ON "SystemParameter"("category", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SystemParameter_category_key_key" ON "SystemParameter"("category", "key");

-- CreateIndex
CREATE UNIQUE INDEX "AccessCard_cardUid_key" ON "AccessCard"("cardUid");

-- CreateIndex
CREATE INDEX "AccessCard_personId_idx" ON "AccessCard"("personId");

-- CreateIndex
CREATE INDEX "AccessCard_entrepreneurId_idx" ON "AccessCard"("entrepreneurId");

-- CreateIndex
CREATE INDEX "AccessCard_status_idx" ON "AccessCard"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AccessDevice_code_key" ON "AccessDevice"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AccessEvent_externalId_key" ON "AccessEvent"("externalId");

-- CreateIndex
CREATE INDEX "AccessEvent_occurredAt_idx" ON "AccessEvent"("occurredAt");

-- CreateIndex
CREATE INDEX "AccessEvent_entrepreneurId_occurredAt_idx" ON "AccessEvent"("entrepreneurId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "AccessEvent_cardUid_occurredAt_direction_key" ON "AccessEvent"("cardUid", "occurredAt", "direction");

-- CreateIndex
CREATE INDEX "SpaceAssignment_unitId_idx" ON "SpaceAssignment"("unitId");

-- AddForeignKey
ALTER TABLE "RentContract" ADD CONSTRAINT "RentContract_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "SpaceUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceAssignment" ADD CONSTRAINT "SpaceAssignment_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "SpaceUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Floor" ADD CONSTRAINT "Floor_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceUnit" ADD CONSTRAINT "SpaceUnit_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "Floor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsurancePolicy" ADD CONSTRAINT "InsurancePolicy_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsurancePolicy" ADD CONSTRAINT "InsurancePolicy_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "SpaceUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessCard" ADD CONSTRAINT "AccessCard_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessCard" ADD CONSTRAINT "AccessCard_entrepreneurId_fkey" FOREIGN KEY ("entrepreneurId") REFERENCES "Entrepreneur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessDevice" ADD CONSTRAINT "AccessDevice_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessEvent" ADD CONSTRAINT "AccessEvent_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "AccessCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessEvent" ADD CONSTRAINT "AccessEvent_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "AccessDevice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessEvent" ADD CONSTRAINT "AccessEvent_entrepreneurId_fkey" FOREIGN KEY ("entrepreneurId") REFERENCES "Entrepreneur"("id") ON DELETE SET NULL ON UPDATE CASCADE;
