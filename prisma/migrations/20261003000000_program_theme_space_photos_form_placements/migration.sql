-- Program poster + color theme, facility photos, form placements. Additive only.
-- Apply with: prisma migrate deploy

-- AlterTable
ALTER TABLE "Facility" ADD COLUMN     "coverImageUrl" TEXT,
ADD COLUMN     "galleryJson" TEXT;

-- AlterTable
ALTER TABLE "Program" ADD COLUMN     "posterUrl" TEXT,
ADD COLUMN     "themeJson" TEXT;

-- CreateTable
CREATE TABLE "FormPlacement" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "title" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormPlacement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FormPlacement_formId_idx" ON "FormPlacement"("formId");

-- CreateIndex
CREATE INDEX "FormPlacement_targetType_targetId_idx" ON "FormPlacement"("targetType", "targetId");

-- AddForeignKey
ALTER TABLE "FormPlacement" ADD CONSTRAINT "FormPlacement_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

