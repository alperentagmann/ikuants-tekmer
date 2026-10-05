-- AlterTable
ALTER TABLE "PersonalTodo" ADD COLUMN     "checklistJson" TEXT,
ADD COLUMN     "estimatedMinutes" INTEGER,
ADD COLUMN     "recurrence" TEXT,
ADD COLUMN     "tags" TEXT;

-- CreateTable
CREATE TABLE "TaskHandoff" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "responseNote" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskHandoff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskTimeEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT,
    "todoId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "minutes" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "source" TEXT NOT NULL DEFAULT 'TIMER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskTimeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskHandoff_taskId_idx" ON "TaskHandoff"("taskId");

-- CreateIndex
CREATE INDEX "TaskHandoff_toUserId_status_idx" ON "TaskHandoff"("toUserId", "status");

-- CreateIndex
CREATE INDEX "TaskHandoff_fromUserId_idx" ON "TaskHandoff"("fromUserId");

-- CreateIndex
CREATE INDEX "TaskHandoff_createdAt_idx" ON "TaskHandoff"("createdAt");

-- CreateIndex
CREATE INDEX "TaskTimeEntry_userId_startedAt_idx" ON "TaskTimeEntry"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "TaskTimeEntry_taskId_idx" ON "TaskTimeEntry"("taskId");

-- CreateIndex
CREATE INDEX "TaskTimeEntry_todoId_idx" ON "TaskTimeEntry"("todoId");

-- AddForeignKey
ALTER TABLE "TaskHandoff" ADD CONSTRAINT "TaskHandoff_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskHandoff" ADD CONSTRAINT "TaskHandoff_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskHandoff" ADD CONSTRAINT "TaskHandoff_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTimeEntry" ADD CONSTRAINT "TaskTimeEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTimeEntry" ADD CONSTRAINT "TaskTimeEntry_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTimeEntry" ADD CONSTRAINT "TaskTimeEntry_todoId_fkey" FOREIGN KEY ("todoId") REFERENCES "PersonalTodo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

