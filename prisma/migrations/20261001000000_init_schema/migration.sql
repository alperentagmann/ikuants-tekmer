-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIp" TEXT,
    "mfaSecret" TEXT,
    "isMfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT,
    "department" TEXT,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "mfaBackupCodes" TEXT,
    "notificationPreferences" TEXT,
    "notes" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPermission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "isGranted" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "isSuccess" BOOLEAN NOT NULL,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "actorName" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "fieldName" TEXT,
    "oldValues" TEXT,
    "newValues" TEXT,
    "diff" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "isPiiAccess" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Revision" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "data" TEXT NOT NULL,
    "changeSummary" TEXT,
    "authorId" TEXT,
    "authorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Revision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityTimeline" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventType" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeroSlide" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "badgeText" TEXT,
    "description" TEXT,
    "mediaType" TEXT NOT NULL DEFAULT 'IMAGE',
    "mediaUrl" TEXT NOT NULL,
    "mobileMediaUrl" TEXT,
    "videoEmbedUrl" TEXT,
    "overlayColor" TEXT DEFAULT 'rgba(5, 5, 16, 0.7)',
    "primaryCtaText" TEXT DEFAULT 'HEMEN BAŞVUR',
    "primaryCtaLink" TEXT DEFAULT '/basvuru',
    "secondaryCtaText" TEXT DEFAULT 'DETAYLI BİLGİ',
    "secondaryCtaLink" TEXT DEFAULT '/programlar',
    "statsJson" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeroSlide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomepageSection" (
    "id" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "customConfig" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomepageSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entrepreneur" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "coverUrl" TEXT,
    "gallery" TEXT,
    "founderAvatars" TEXT,
    "sector" TEXT NOT NULL,
    "subSector" TEXT,
    "shortDesc" TEXT,
    "longDesc" TEXT,
    "keywords" TEXT,
    "founders" TEXT,
    "website" TEXT,
    "linkedin" TEXT,
    "instagram" TEXT,
    "otherSocials" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "program" TEXT,
    "incubationType" TEXT,
    "startDate" TIMESTAMP(3),
    "graduationDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "milestones" TEXT,
    "grantsReceived" TEXT,
    "investments" TEXT,
    "successStory" TEXT,
    "patents" TEXT,
    "prototypes" TEXT,
    "files" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "ogImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyStatus" TEXT NOT NULL DEFAULT 'UNINCORPORATED',

    CONSTRAINT "Entrepreneur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntrepreneurFounder" (
    "id" TEXT NOT NULL,
    "entrepreneurId" TEXT NOT NULL,
    "personId" TEXT,
    "fullName" TEXT NOT NULL,
    "title" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "linkedin" TEXT,
    "isLead" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntrepreneurFounder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntrepreneurInvestment" (
    "id" TEXT NOT NULL,
    "entrepreneurId" TEXT NOT NULL,
    "investorName" TEXT NOT NULL,
    "round" TEXT NOT NULL DEFAULT 'SEED',
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "valuation" DOUBLE PRECISION,
    "investmentDate" TIMESTAMP(3) NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntrepreneurInvestment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntrepreneurPatent" (
    "id" TEXT NOT NULL,
    "entrepreneurId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "applicationNumber" TEXT,
    "registrationNumber" TEXT,
    "patentType" TEXT NOT NULL DEFAULT 'PATENT',
    "status" TEXT NOT NULL DEFAULT 'APPLICATION',
    "filingDate" TIMESTAMP(3),
    "grantDate" TIMESTAMP(3),
    "documentUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntrepreneurPatent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntrepreneurGrant" (
    "id" TEXT NOT NULL,
    "entrepreneurId" TEXT NOT NULL,
    "grantorName" TEXT NOT NULL,
    "programName" TEXT NOT NULL,
    "grantAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "awardedDate" TIMESTAMP(3),
    "projectCode" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntrepreneurGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntrepreneurMilestone" (
    "id" TEXT NOT NULL,
    "entrepreneurId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "milestoneDate" TIMESTAMP(3) NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntrepreneurMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntrepreneurDocument" (
    "id" TEXT NOT NULL,
    "entrepreneurId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL DEFAULT 'DOCUMENT',
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "isConfidential" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntrepreneurDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntrepreneurGallery" (
    "id" TEXT NOT NULL,
    "entrepreneurId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntrepreneurGallery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mentor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "expertiseAreas" TEXT,
    "bio" TEXT,
    "imageUrl" TEXT,
    "linkedin" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "mentorAreas" TEXT,
    "programIds" TEXT,
    "availability" TEXT DEFAULT 'AVAILABLE',
    "totalHours" DOUBLE PRECISION DEFAULT 0,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "personId" TEXT,

    CONSTRAINT "Mentor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorProgram" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MENTOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MentorProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorSession" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "entrepreneurId" TEXT,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "topic" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "meetingUrl" TEXT,
    "feedbackRating" INTEGER,
    "feedbackText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "programType" TEXT,
    "tagline" TEXT,
    "shortDesc" TEXT,
    "detailedDesc" TEXT,
    "logoUrl" TEXT,
    "coverUrl" TEXT,
    "gallery" TEXT,
    "colorCode" TEXT,
    "duration" TEXT,
    "quota" TEXT,
    "mentorHours" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "applyStartDate" TIMESTAMP(3),
    "applyEndDate" TIMESTAMP(3),
    "applyStatus" TEXT NOT NULL DEFAULT 'OPEN',
    "features" TEXT,
    "supports" TEXT,
    "modules" TEXT,
    "jury" TEXT,
    "partners" TEXT,
    "programManager" TEXT,
    "heroUrl" TEXT,
    "mobileHeroUrl" TEXT,
    "targetAudience" TEXT,
    "whoCanApply" TEXT,
    "applicationCriteria" TEXT,
    "timelineJson" TEXT,
    "benefitsJson" TEXT,
    "faqsJson" TEXT,
    "documentsJson" TEXT,
    "contentBlocksJson" TEXT,
    "ctaTitle" TEXT,
    "ctaDescription" TEXT,
    "ctaText" TEXT DEFAULT 'HEMEN BAŞVUR',
    "ctaLink" TEXT DEFAULT '/basvuru',
    "formId" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "ogImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Training" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "objective" TEXT,
    "moduleName" TEXT,
    "weekNumber" INTEGER,
    "topics" TEXT,
    "format" TEXT NOT NULL DEFAULT 'HYBRID',
    "location" TEXT,
    "onlineMeetingUrl" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "durationMinutes" INTEGER DEFAULT 120,
    "capacity" INTEGER DEFAULT 30,
    "registrationFormId" TEXT,
    "materials" TEXT,
    "homework" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Training_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingInstructor" (
    "id" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "mentorId" TEXT,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "organization" TEXT,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "isLead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingInstructor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingSession" (
    "id" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "sessionTitle" TEXT NOT NULL,
    "sessionOrder" INTEGER NOT NULL DEFAULT 1,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "roomOrUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingEnrollment" (
    "id" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "role" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ENROLLED',
    "certificateNo" TEXT,
    "certificateIssuedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingAttendance" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "isPresent" BOOLEAN NOT NULL DEFAULT true,
    "checkInTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT NOT NULL DEFAULT 'MANUAL',

    CONSTRAINT "TrainingAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingFeedback" (
    "id" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "enrollmentId" TEXT,
    "contentScore" INTEGER NOT NULL,
    "instructorScore" INTEGER NOT NULL,
    "organizationScore" INTEGER NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "comments" TEXT,
    "suggestions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'NEWS',
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categoryId" TEXT,
    "description" TEXT,
    "agenda" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "location" TEXT,
    "eventType" TEXT NOT NULL DEFAULT 'PHYSICAL',
    "mapUrl" TEXT,
    "onlineMeetingUrl" TEXT,
    "quota" INTEGER,
    "registrationLink" TEXT,
    "registrationFormId" TEXT,
    "coverImage" TEXT,
    "gallery" TEXT,
    "files" TEXT,
    "eventManager" TEXT,
    "partners" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventSession" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "hallRoom" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventSpeaker" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "company" TEXT,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "linkedin" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventSpeaker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRegistration" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "title" TEXT,
    "qrCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "checkedInAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "News" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "contentBlocks" TEXT,
    "coverImage" TEXT,
    "coverAltText" TEXT,
    "gallery" TEXT,
    "videoUrl" TEXT,
    "fileAttachment" TEXT,
    "categoryId" TEXT,
    "tags" TEXT,
    "author" TEXT,
    "publishedAt" TIMESTAMP(3),
    "eventDate" TEXT,
    "registrationLink" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "showOnHome" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "scheduledPublishAt" TIMESTAMP(3),
    "approvalStatus" TEXT NOT NULL DEFAULT 'DRAFT',
    "approvedById" TEXT,
    "relatedProgramId" TEXT,
    "relatedMentorId" TEXT,
    "relatedEntrepreneurId" TEXT,
    "relatedEventId" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "canonicalUrl" TEXT,
    "ogImageUrl" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "News_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "createdById" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "estimatedHours" DOUBLE PRECISION,
    "actualHours" DOUBLE PRECISION,
    "tags" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "entrepreneurId" TEXT,
    "mentorId" TEXT,
    "programId" TEXT,
    "applicationId" TEXT,
    "newsId" TEXT,
    "eventId" TEXT,
    "trainingId" TEXT,
    "activityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskAssignee" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ASSIGNEE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskAssignee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskChecklistItem" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskComment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskAttachment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskActivity" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "colorCode" TEXT DEFAULT '#6366f1',
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorporateActivity" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "activityDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "location" TEXT,
    "targetAudience" TEXT,
    "participantCount" INTEGER DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "budgetAmount" DOUBLE PRECISION,
    "currency" TEXT DEFAULT 'TRY',
    "fundingSource" TEXT,
    "outcomes" TEXT,
    "outputsJson" TEXT,
    "programId" TEXT,
    "entrepreneurId" TEXT,
    "mentorId" TEXT,
    "trainingId" TEXT,
    "eventId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorporateActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityEvidence" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityParticipant" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "organization" TEXT,
    "role" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "sector" TEXT,
    "orgType" TEXT NOT NULL DEFAULT 'COMPANY',
    "taxNumber" TEXT,
    "taxOffice" TEXT,
    "mersisNo" TEXT,
    "website" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT DEFAULT 'Türkiye',
    "logoUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "tags" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "projectType" TEXT NOT NULL DEFAULT 'KOSGEB',
    "budgetAmount" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "fundingAgency" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "completionRate" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "programId" TEXT,
    "entrepreneurId" TEXT,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMilestone" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "completedDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "deliverable" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectRisk" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "riskTitle" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL DEFAULT 'MEDIUM',
    "probability" TEXT NOT NULL DEFAULT 'MEDIUM',
    "mitigationPlan" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectRisk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectBudget" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "plannedAmount" DOUBLE PRECISION NOT NULL,
    "spentAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StakeholderContact" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "fullName" TEXT NOT NULL,
    "title" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "contactType" TEXT NOT NULL DEFAULT 'PARTNER',
    "linkedEntityId" TEXT,
    "linkedin" TEXT,
    "notes" TEXT,
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StakeholderContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowApproval" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityTitle" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "reviewerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestNote" TEXT,
    "reviewNote" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "WorkflowApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Support" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "legalBasis" TEXT,
    "exampleScenario" TEXT,
    "iconName" TEXT,
    "colorGradient" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "ctaText" TEXT,
    "ctaLink" TEXT,
    "sourceUrl" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Support_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Form" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "formType" TEXT NOT NULL DEFAULT 'APPLICATION',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "allowMultiple" BOOLEAN NOT NULL DEFAULT false,
    "requiresAuth" BOOLEAN NOT NULL DEFAULT false,
    "successMessage" TEXT,
    "redirectUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Form_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormVersion" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "schemaSnapshot" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "publishedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormField" (
    "id" TEXT NOT NULL,
    "formVersionId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL,
    "placeholder" TEXT,
    "helpText" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "defaultValue" TEXT,
    "validationRules" TEXT,
    "conditionalRules" TEXT,
    "options" TEXT,
    "stepNumber" INTEGER NOT NULL DEFAULT 1,
    "stepTitle" TEXT,
    "width" TEXT NOT NULL DEFAULT 'FULL',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "formVersionId" TEXT NOT NULL,
    "submissionNumber" TEXT NOT NULL,
    "isTest" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "idempotencyKey" TEXT,
    "rawSnapshot" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionAnswer" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "fieldLabel" TEXT NOT NULL,
    "textValue" TEXT,
    "numValue" DOUBLE PRECISION,
    "dateValue" TIMESTAMP(3),
    "jsonValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "applicationNumber" TEXT NOT NULL,
    "formVersionId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "programId" TEXT,
    "applicantName" TEXT NOT NULL,
    "companyName" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "tcNumberMasked" TEXT,
    "tcNumberEncrypted" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "stage" TEXT NOT NULL DEFAULT 'PIPELINE',
    "assignedToId" TEXT,
    "internalNotesCount" INTEGER NOT NULL DEFAULT 0,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "duplicateWarning" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationStatusHistory" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "reason" TEXT,
    "changedById" TEXT,
    "changedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationNote" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT NOT NULL,
    "noteText" TEXT NOT NULL,
    "mentions" TEXT,
    "fileUrl" TEXT,
    "isInternal" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationFile" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "checksum" TEXT,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "uploadedById" TEXT,
    "uploadedByName" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "programId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvaluationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationCriterion" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "maxScore" INTEGER NOT NULL DEFAULT 10,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvaluationCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "evaluatorId" TEXT NOT NULL,
    "totalScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "finalComment" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationScore" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvaluationScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactRequest" (
    "id" TEXT NOT NULL,
    "requestType" TEXT NOT NULL DEFAULT 'MESSAGE',
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "message" TEXT,
    "meetingTopic" TEXT,
    "meetWith" TEXT,
    "meetingDate" TEXT,
    "meetingTime" TEXT,
    "visitTopic" TEXT,
    "visitWho" TEXT,
    "visitDate" TEXT,
    "visitTime" TEXT,
    "groupSize" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "assignedToId" TEXT,
    "internalNotes" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "folder" TEXT NOT NULL DEFAULT 'general',
    "tags" TEXT,
    "storagePath" TEXT NOT NULL,
    "publicUrl" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "checksum" TEXT,
    "altText" TEXT,
    "caption" TEXT,
    "uploadedById" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "group" TEXT NOT NULL DEFAULT 'GENERAL',
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL,
    "menuLocation" TEXT NOT NULL DEFAULT 'HEADER',
    "parentId" TEXT,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isExternal" BOOLEAN NOT NULL DEFAULT false,
    "openInNewTab" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "description" TEXT,
    "websiteUrl" TEXT,
    "linkedinUrl" TEXT,
    "altText" TEXT,
    "partnerGroup" TEXT NOT NULL DEFAULT 'STAKEHOLDER',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Redirect" (
    "id" TEXT NOT NULL,
    "fromUrl" TEXT NOT NULL,
    "toUrl" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL DEFAULT 301,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "lastHitAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Redirect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "htmlBody" TEXT NOT NULL,
    "textBody" TEXT,
    "variables" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "notificationType" TEXT NOT NULL DEFAULT 'INFO',
    "targetUrl" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemErrorLog" (
    "id" TEXT NOT NULL,
    "errorCode" TEXT,
    "route" TEXT,
    "requestId" TEXT,
    "userId" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'ERROR',
    "message" TEXT NOT NULL,
    "stackTrace" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemErrorLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "M365Integration" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "clientId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DISCONNECTED',
    "scopes" TEXT,
    "isCalendarSyncActive" BOOLEAN NOT NULL DEFAULT false,
    "isMailSyncActive" BOOLEAN NOT NULL DEFAULT false,
    "isTeamsActive" BOOLEAN NOT NULL DEFAULT false,
    "isSharePointActive" BOOLEAN NOT NULL DEFAULT false,
    "syncMode" TEXT NOT NULL DEFAULT 'READ_ONLY',
    "calendarDeltaToken" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncStatus" TEXT,
    "lastErrorLog" TEXT,
    "configJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "M365Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEventMapping" (
    "id" TEXT NOT NULL,
    "localEventType" TEXT NOT NULL,
    "localEventId" TEXT NOT NULL,
    "externalSystem" TEXT NOT NULL DEFAULT 'MICROSOFT_365',
    "externalEventId" TEXT NOT NULL,
    "externalChangeKey" TEXT,
    "syncStatus" TEXT NOT NULL DEFAULT 'SYNCED',
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalendarEventMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 10,
    "location" TEXT,
    "description" TEXT,
    "features" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "attendeeCount" INTEGER NOT NULL DEFAULT 1,
    "attendeeNotes" TEXT,
    "agenda" TEXT,
    "meetingNotes" TEXT,
    "followUpTasks" TEXT,
    "teamsMeetingUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "contractType" TEXT NOT NULL,
    "partyA" TEXT NOT NULL DEFAULT 'İKÜANTS TEKMER',
    "partyB" TEXT NOT NULL,
    "partyBContactEmail" TEXT,
    "partyBContactPhone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "renewalReminderDays" INTEGER NOT NULL DEFAULT 30,
    "isRenewalAlertSent" BOOLEAN NOT NULL DEFAULT false,
    "responsibleUserId" TEXT,
    "sensitivityClass" TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
    "documentUrl" TEXT,
    "eSignStatus" TEXT NOT NULL DEFAULT 'NOT_INITIATED',
    "eSignProviderRef" TEXT,
    "termsSummary" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractDocument" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "mimeType" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeArticle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "audience" TEXT NOT NULL DEFAULT 'STAFF',
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "authorId" TEXT,
    "tags" TEXT,
    "checklist" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortalAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "entrepreneurId" TEXT,
    "mentorId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "canEditProfile" BOOLEAN NOT NULL DEFAULT true,
    "canUploadDocs" BOOLEAN NOT NULL DEFAULT true,
    "canBookSessions" BOOLEAN NOT NULL DEFAULT true,
    "allowedModules" TEXT,
    "lastAccessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortalAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "triggerType" TEXT NOT NULL,
    "conditions" TEXT,
    "actions" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requireUserApproval" BOOLEAN NOT NULL DEFAULT false,
    "executionCount" INTEGER NOT NULL DEFAULT 0,
    "lastExecutedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationLog" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "triggerEvent" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "payloadJson" TEXT,
    "actionResult" TEXT,
    "error" TEXT,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutomationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiTaskLog" (
    "id" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "inputPrompt" TEXT NOT NULL,
    "generatedOutput" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'GENERATED',
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiTaskLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInvite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "title" TEXT,
    "department" TEXT,
    "tokenHash" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TerminologyLabel" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "group" TEXT NOT NULL DEFAULT 'GENERAL',
    "defaultLabel" TEXT NOT NULL,
    "customLabel" TEXT,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TerminologyLabel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomFieldDefinition" (
    "id" TEXT NOT NULL,
    "moduleKey" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL DEFAULT 'TEXT',
    "placeholder" TEXT,
    "description" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "defaultValue" TEXT,
    "optionsJson" TEXT,
    "viewPermission" TEXT,
    "editPermission" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomFieldDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomFieldValue" (
    "id" TEXT NOT NULL,
    "definitionId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "textValue" TEXT,
    "numValue" DOUBLE PRECISION,
    "dateValue" TIMESTAMP(3),
    "jsonValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomFieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineStatus" (
    "id" TEXT NOT NULL,
    "moduleKey" TEXT NOT NULL,
    "statusKey" TEXT NOT NULL,
    "displayLabel" TEXT NOT NULL,
    "colorCode" TEXT NOT NULL DEFAULT '#6366f1',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isInitial" BOOLEAN NOT NULL DEFAULT false,
    "isTerminal" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "allowedTransitions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PipelineStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailOutbox" (
    "id" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT,
    "subject" TEXT NOT NULL,
    "templateKey" TEXT,
    "htmlBody" TEXT NOT NULL,
    "textBody" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "nextRetryAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "providerMessageId" TEXT,
    "errorMessage" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "channels" TEXT NOT NULL DEFAULT '["IN_APP","EMAIL"]',
    "recipientGroup" TEXT NOT NULL,
    "emailTemplateKey" TEXT,
    "conditionsJson" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'WARN',
    "userId" TEXT,
    "userEmail" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "details" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseStudy" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "entrepreneurId" TEXT,
    "programId" TEXT,
    "problem" TEXT,
    "solution" TEXT,
    "tekmerContribution" TEXT,
    "results" TEXT,
    "metricsJson" TEXT,
    "imageUrl" TEXT,
    "logoUrl" TEXT,
    "quote" TEXT,
    "quoteAuthor" TEXT,
    "ctaText" TEXT,
    "ctaUrl" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseStudy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaqItem" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENEL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FaqItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorTitle" TEXT,
    "companyName" TEXT,
    "programName" TEXT,
    "avatarUrl" TEXT,
    "content" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT,
    "bio" TEXT,
    "imageUrl" TEXT,
    "linkedin" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardMember" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "organization" TEXT,
    "duty" TEXT,
    "boardType" TEXT NOT NULL DEFAULT 'YONETIM',
    "imageUrl" TEXT,
    "imageStyle" TEXT,
    "bio" TEXT,
    "email" TEXT,
    "linkedin" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoardMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Facility" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "facilityType" TEXT NOT NULL DEFAULT 'STUDIO',
    "featuresJson" TEXT,
    "iconName" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Facility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "detailsJson" TEXT,
    "highlight" TEXT,
    "iconName" TEXT,
    "colorGradient" TEXT DEFAULT 'from-purple-500 to-pink-500',
    "ctaLabel" TEXT,
    "ctaUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegislationDocument" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'YONETMELIK',
    "publishDate" TIMESTAMP(3),
    "externalUrl" TEXT,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegislationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialAccount" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'INSTAGRAM',
    "accountName" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "profileUrl" TEXT,
    "avatarUrl" TEXT,
    "accessTokenEncrypted" TEXT,
    "refreshTokenEncrypted" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "syncIntervalMinutes" INTEGER NOT NULL DEFAULT 30,
    "syncMode" TEXT NOT NULL DEFAULT 'AUTO_DRAFT',
    "lastSyncAt" TIMESTAMP(3),
    "webhookSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPost" (
    "id" TEXT NOT NULL,
    "socialAccountId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "caption" TEXT,
    "mediaType" TEXT NOT NULL DEFAULT 'IMAGE',
    "mediaUrl" TEXT,
    "thumbnailUrl" TEXT,
    "permalink" TEXT,
    "postDate" TIMESTAMP(3) NOT NULL,
    "syncStatus" TEXT NOT NULL DEFAULT 'NEW',
    "convertedNewsId" TEXT,
    "convertedEventId" TEXT,
    "rawDataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialImportRule" (
    "id" TEXT NOT NULL,
    "socialAccountId" TEXT NOT NULL,
    "keywordOrHashtag" TEXT NOT NULL,
    "targetContentType" TEXT NOT NULL DEFAULT 'NEWS',
    "targetCategory" TEXT,
    "autoPublish" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialImportRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialSyncRun" (
    "id" TEXT NOT NULL,
    "socialAccountId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "postsFound" INTEGER NOT NULL DEFAULT 0,
    "postsImported" INTEGER NOT NULL DEFAULT 0,
    "postsDrafted" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "SocialSyncRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialContentLink" (
    "id" TEXT NOT NULL,
    "socialPostId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'INSTAGRAM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialContentLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalTodo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "dueTime" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "reminderDate" TIMESTAMP(3),
    "reminderChannel" TEXT DEFAULT 'IN_APP',
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "convertedTaskId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalTodo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalNote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "sharedWithRoles" TEXT,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "color" TEXT DEFAULT '#0f172a',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserReminder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "remindAt" TIMESTAMP(3) NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'IN_APP',
    "isTriggered" BOOLEAN NOT NULL DEFAULT false,
    "triggeredAt" TIMESTAMP(3),
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "actionUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFavorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecentItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingNote" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT,
    "title" TEXT NOT NULL,
    "agenda" TEXT,
    "attendees" TEXT,
    "notes" TEXT NOT NULL,
    "decisions" TEXT,
    "actionsJson" TEXT,
    "filesJson" TEXT,
    "teamsJoinUrl" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDelegation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "delegateUserId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'ALL',
    "reason" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDelegation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardWidgetConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "widgetKey" TEXT NOT NULL,
    "posX" INTEGER NOT NULL DEFAULT 0,
    "posY" INTEGER NOT NULL DEFAULT 0,
    "width" INTEGER NOT NULL DEFAULT 1,
    "height" INTEGER NOT NULL DEFAULT 1,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardWidgetConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationalReport" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT NOT NULL,
    "department" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "executiveSummary" TEXT,
    "aiDraftSummary" TEXT,
    "contentJson" TEXT,
    "metricsJson" TEXT,
    "chartsConfigJson" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "isScheduled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationalReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportTemplate" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "defaultLayoutJson" TEXT,
    "defaultMetricsJson" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportSchedule" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reportType" TEXT NOT NULL DEFAULT 'DAILY',
    "frequency" TEXT NOT NULL,
    "cronExpression" TEXT,
    "targetRole" TEXT,
    "recipientsJson" TEXT NOT NULL,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyInteraction" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startTime" TEXT,
    "endTime" TEXT,
    "interactionType" TEXT NOT NULL DEFAULT 'MEETING',
    "contactName" TEXT NOT NULL,
    "organizationName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "hostUserId" TEXT,
    "otherAttendees" TEXT,
    "subject" TEXT NOT NULL,
    "notes" TEXT,
    "decisions" TEXT,
    "nextSteps" TEXT,
    "followUpDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "tags" TEXT,
    "attachments" TEXT,
    "entrepreneurId" TEXT,
    "mentorId" TEXT,
    "programId" TEXT,
    "applicationId" TEXT,
    "projectId" TEXT,
    "eventId" TEXT,
    "createdTaskId" TEXT,
    "createdActivityId" TEXT,
    "hasKvkkConsent" BOOLEAN NOT NULL DEFAULT false,
    "kvkkConsentId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntrepreneurProgram" (
    "id" TEXT NOT NULL,
    "entrepreneurId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "cohort" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "leftAt" TIMESTAMP(3),
    "notes" TEXT,
    "assignedById" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntrepreneurProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KvkkTextVersion" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "consentTypes" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KvkkTextVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KvkkConsent" (
    "id" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "tcNumberMasked" TEXT,
    "organizationName" TEXT,
    "sourceChannel" TEXT NOT NULL DEFAULT 'FORM',
    "sourceFormId" TEXT,
    "sourceSubmissionId" TEXT,
    "textVersionId" TEXT,
    "isExplicitConsent" BOOLEAN NOT NULL DEFAULT true,
    "allowCommunication" BOOLEAN NOT NULL DEFAULT false,
    "allowMediaUse" BOOLEAN NOT NULL DEFAULT false,
    "allowMarketing" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "consentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawnAt" TIMESTAMP(3),
    "evidenceDocumentUrl" TEXT,
    "notes" TEXT,
    "entrepreneurId" TEXT,
    "mentorId" TEXT,
    "applicationId" TEXT,
    "userId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KvkkConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FundingSource" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "organizationName" TEXT NOT NULL,
    "programGrantName" TEXT NOT NULL,
    "awardedAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "agreementNo" TEXT,
    "agreementDate" TIMESTAMP(3),
    "expectedStartDate" TIMESTAMP(3),
    "expectedEndDate" TIMESTAMP(3),
    "description" TEXT,
    "documentUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FundingSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FundingReceipt" (
    "id" TEXT NOT NULL,
    "fundingSourceId" TEXT NOT NULL,
    "installmentNo" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "expectedDate" TIMESTAMP(3) NOT NULL,
    "receivedDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'EXPECTED',
    "bankReferenceNo" TEXT,
    "description" TEXT,
    "receiptDocUrl" TEXT,
    "receivedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FundingReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectBudgetLine" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "code" TEXT,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'PERSONNEL',
    "allocatedAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectBudgetLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectExpense" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fundingSourceId" TEXT,
    "budgetLineId" TEXT,
    "expenseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "supplierVendor" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "vatAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentDate" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "invoiceNumber" TEXT,
    "invoiceDate" TIMESTAMP(3),
    "invoiceDocUrl" TEXT,
    "receiptDocUrl" TEXT,
    "relatedActivityId" TEXT,
    "relatedTaskId" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceRecord" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT,
    "projectId" TEXT,
    "entrepreneurId" TEXT,
    "vendorName" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "netAmount" DOUBLE PRECISION NOT NULL,
    "taxVatAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "status" TEXT NOT NULL DEFAULT 'RECORDED',
    "paymentDate" TIMESTAMP(3),
    "documentUrl" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentContract" (
    "id" TEXT NOT NULL,
    "entrepreneurId" TEXT NOT NULL,
    "spaceFacilityId" TEXT,
    "spaceName" TEXT NOT NULL,
    "roomDeskNo" TEXT,
    "areaM2" DOUBLE PRECISION,
    "spaceType" TEXT NOT NULL DEFAULT 'OFFICE',
    "contractNo" TEXT NOT NULL,
    "contractDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT,
    "financeContactPersonId" TEXT,
    "commercialTitle" TEXT,
    "contactPersonName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "monthlyRent" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "vatAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalMonthlyRent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dueDay" INTEGER NOT NULL DEFAULT 5,
    "depositAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isWaived" BOOLEAN NOT NULL DEFAULT false,
    "freePeriodStart" TIMESTAMP(3),
    "freePeriodEnd" TIMESTAMP(3),
    "waiverReason" TEXT,
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "renewalNoticeDays" INTEGER NOT NULL DEFAULT 30,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "contractDocUrl" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentContractDocument" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL DEFAULT 'SIGNED_CONTRACT',
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "documentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "uploadedById" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentContractDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentAccrual" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "entrepreneurId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "baseAmount" DOUBLE PRECISION NOT NULL,
    "vatAmount" DOUBLE PRECISION NOT NULL,
    "totalDue" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remainingAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "daysOverdue" INTEGER NOT NULL DEFAULT 0,
    "lastReminderSentAt" TIMESTAMP(3),
    "reminderCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentAccrual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentPayment" (
    "id" TEXT NOT NULL,
    "accrualId" TEXT NOT NULL,
    "entrepreneurId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" TEXT NOT NULL DEFAULT 'BANK_TRANSFER',
    "bankReceiptNo" TEXT,
    "receiptDocUrl" TEXT,
    "description" TEXT,
    "receivedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentReminderRule" (
    "id" TEXT NOT NULL,
    "ruleName" TEXT NOT NULL,
    "daysOffset" INTEGER NOT NULL,
    "triggerType" TEXT NOT NULL,
    "emailSubject" TEXT NOT NULL,
    "emailTemplateBody" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentReminderRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receivable" (
    "id" TEXT NOT NULL,
    "debtor" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'OTHER',
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remaining" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "exchangeRate" DOUBLE PRECISION,
    "exchangeRateDate" TIMESTAMP(3),
    "sourceCurrency" TEXT,
    "targetCurrency" TEXT,
    "baseCurrencyAmount" DOUBLE PRECISION,
    "invoiceNumber" TEXT,
    "paymentDate" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "bankReceiptNo" TEXT,
    "documentUrl" TEXT,
    "notes" TEXT,
    "relatedProjectId" TEXT,
    "relatedEntrepreneurId" TEXT,
    "relatedOrganizationId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Receivable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeRate" (
    "id" TEXT NOT NULL,
    "sourceCurrency" TEXT NOT NULL,
    "targetCurrency" TEXT NOT NULL DEFAULT 'TRY',
    "rate" DOUBLE PRECISION NOT NULL,
    "rateDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT DEFAULT 'MANUAL',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "title" TEXT,
    "email" TEXT,
    "secondaryEmail" TEXT,
    "phone" TEXT,
    "secondaryPhone" TEXT,
    "linkedin" TEXT,
    "avatarUrl" TEXT,
    "city" TEXT,
    "country" TEXT DEFAULT 'Türkiye',
    "notes" TEXT,
    "tags" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonOrganizationMembership" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "department" TEXT,
    "position" TEXT,
    "startDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "isPrimaryContact" BOOLEAN NOT NULL DEFAULT false,
    "isFinanceContact" BOOLEAN NOT NULL DEFAULT false,
    "isLegalContact" BOOLEAN NOT NULL DEFAULT false,
    "isAuthorizedSignatory" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonOrganizationMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntrepreneurOrganization" (
    "id" TEXT NOT NULL,
    "entrepreneurId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "relationType" TEXT NOT NULL DEFAULT 'PRIMARY',
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntrepreneurOrganization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StakeholderRelationship" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL DEFAULT 'ORGANIZATION',
    "personId" TEXT,
    "organizationId" TEXT,
    "stakeholderType" TEXT NOT NULL DEFAULT 'COLLABORATION_PARTNER',
    "relationshipStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "ownerUserId" TEXT,
    "startedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StakeholderRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiChangeSet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT,
    "userName" TEXT,
    "requestPrompt" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL DEFAULT 'MEDIUM',
    "actionsJson" TEXT NOT NULL,
    "beforeState" TEXT,
    "afterState" TEXT,
    "summary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "rollbackStatus" TEXT,
    "rollbackError" TEXT,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rolledBackAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiChangeSet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Role_slug_key" ON "Role"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_action_resource_key" ON "Permission"("action", "resource");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "UserRole"("userId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPermission_userId_permissionId_key" ON "UserPermission"("userId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_sessionToken_idx" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "LoginAttempt_email_idx" ON "LoginAttempt"("email");

-- CreateIndex
CREATE INDEX "LoginAttempt_ipAddress_idx" ON "LoginAttempt"("ipAddress");

-- CreateIndex
CREATE INDEX "LoginAttempt_createdAt_idx" ON "LoginAttempt"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Revision_entityType_entityId_idx" ON "Revision"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "Revision_entityType_entityId_version_key" ON "Revision"("entityType", "entityId", "version");

-- CreateIndex
CREATE INDEX "ActivityTimeline_entityType_entityId_idx" ON "ActivityTimeline"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ActivityTimeline_createdAt_idx" ON "ActivityTimeline"("createdAt");

-- CreateIndex
CREATE INDEX "HeroSlide_sortOrder_idx" ON "HeroSlide"("sortOrder");

-- CreateIndex
CREATE INDEX "HeroSlide_status_idx" ON "HeroSlide"("status");

-- CreateIndex
CREATE INDEX "HeroSlide_isActive_idx" ON "HeroSlide"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "HomepageSection_sectionKey_key" ON "HomepageSection"("sectionKey");

-- CreateIndex
CREATE UNIQUE INDEX "Entrepreneur_slug_key" ON "Entrepreneur"("slug");

-- CreateIndex
CREATE INDEX "Entrepreneur_status_idx" ON "Entrepreneur"("status");

-- CreateIndex
CREATE INDEX "Entrepreneur_sector_idx" ON "Entrepreneur"("sector");

-- CreateIndex
CREATE INDEX "Entrepreneur_sortOrder_idx" ON "Entrepreneur"("sortOrder");

-- CreateIndex
CREATE INDEX "Entrepreneur_companyStatus_idx" ON "Entrepreneur"("companyStatus");

-- CreateIndex
CREATE INDEX "EntrepreneurFounder_entrepreneurId_idx" ON "EntrepreneurFounder"("entrepreneurId");

-- CreateIndex
CREATE INDEX "EntrepreneurFounder_personId_idx" ON "EntrepreneurFounder"("personId");

-- CreateIndex
CREATE INDEX "EntrepreneurInvestment_entrepreneurId_idx" ON "EntrepreneurInvestment"("entrepreneurId");

-- CreateIndex
CREATE INDEX "EntrepreneurInvestment_investmentDate_idx" ON "EntrepreneurInvestment"("investmentDate");

-- CreateIndex
CREATE INDEX "EntrepreneurPatent_entrepreneurId_idx" ON "EntrepreneurPatent"("entrepreneurId");

-- CreateIndex
CREATE INDEX "EntrepreneurPatent_status_idx" ON "EntrepreneurPatent"("status");

-- CreateIndex
CREATE INDEX "EntrepreneurGrant_entrepreneurId_idx" ON "EntrepreneurGrant"("entrepreneurId");

-- CreateIndex
CREATE INDEX "EntrepreneurGrant_grantorName_idx" ON "EntrepreneurGrant"("grantorName");

-- CreateIndex
CREATE INDEX "EntrepreneurMilestone_entrepreneurId_idx" ON "EntrepreneurMilestone"("entrepreneurId");

-- CreateIndex
CREATE INDEX "EntrepreneurMilestone_milestoneDate_idx" ON "EntrepreneurMilestone"("milestoneDate");

-- CreateIndex
CREATE INDEX "EntrepreneurDocument_entrepreneurId_idx" ON "EntrepreneurDocument"("entrepreneurId");

-- CreateIndex
CREATE INDEX "EntrepreneurGallery_entrepreneurId_idx" ON "EntrepreneurGallery"("entrepreneurId");

-- CreateIndex
CREATE INDEX "EntrepreneurGallery_sortOrder_idx" ON "EntrepreneurGallery"("sortOrder");

-- CreateIndex
CREATE INDEX "Mentor_personId_idx" ON "Mentor"("personId");

-- CreateIndex
CREATE INDEX "Mentor_isActive_idx" ON "Mentor"("isActive");

-- CreateIndex
CREATE INDEX "Mentor_sortOrder_idx" ON "Mentor"("sortOrder");

-- CreateIndex
CREATE INDEX "MentorProgram_mentorId_idx" ON "MentorProgram"("mentorId");

-- CreateIndex
CREATE INDEX "MentorProgram_programId_idx" ON "MentorProgram"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "MentorProgram_mentorId_programId_key" ON "MentorProgram"("mentorId", "programId");

-- CreateIndex
CREATE INDEX "MentorSession_mentorId_idx" ON "MentorSession"("mentorId");

-- CreateIndex
CREATE INDEX "MentorSession_entrepreneurId_idx" ON "MentorSession"("entrepreneurId");

-- CreateIndex
CREATE INDEX "MentorSession_sessionDate_idx" ON "MentorSession"("sessionDate");

-- CreateIndex
CREATE UNIQUE INDEX "Program_slug_key" ON "Program"("slug");

-- CreateIndex
CREATE INDEX "Program_applyStatus_idx" ON "Program"("applyStatus");

-- CreateIndex
CREATE INDEX "Program_sortOrder_idx" ON "Program"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Training_slug_key" ON "Training"("slug");

-- CreateIndex
CREATE INDEX "Training_programId_idx" ON "Training"("programId");

-- CreateIndex
CREATE INDEX "Training_startDate_idx" ON "Training"("startDate");

-- CreateIndex
CREATE INDEX "Training_status_idx" ON "Training"("status");

-- CreateIndex
CREATE INDEX "TrainingInstructor_trainingId_idx" ON "TrainingInstructor"("trainingId");

-- CreateIndex
CREATE INDEX "TrainingInstructor_mentorId_idx" ON "TrainingInstructor"("mentorId");

-- CreateIndex
CREATE INDEX "TrainingSession_trainingId_idx" ON "TrainingSession"("trainingId");

-- CreateIndex
CREATE INDEX "TrainingEnrollment_trainingId_idx" ON "TrainingEnrollment"("trainingId");

-- CreateIndex
CREATE INDEX "TrainingEnrollment_email_idx" ON "TrainingEnrollment"("email");

-- CreateIndex
CREATE INDEX "TrainingAttendance_sessionId_idx" ON "TrainingAttendance"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingAttendance_sessionId_enrollmentId_key" ON "TrainingAttendance"("sessionId", "enrollmentId");

-- CreateIndex
CREATE INDEX "TrainingFeedback_trainingId_idx" ON "TrainingFeedback"("trainingId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

-- CreateIndex
CREATE INDEX "Event_status_idx" ON "Event"("status");

-- CreateIndex
CREATE INDEX "Event_startDate_idx" ON "Event"("startDate");

-- CreateIndex
CREATE INDEX "Event_categoryId_idx" ON "Event"("categoryId");

-- CreateIndex
CREATE INDEX "EventSession_eventId_idx" ON "EventSession"("eventId");

-- CreateIndex
CREATE INDEX "EventSpeaker_eventId_idx" ON "EventSpeaker"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "EventRegistration_qrCode_key" ON "EventRegistration"("qrCode");

-- CreateIndex
CREATE INDEX "EventRegistration_eventId_idx" ON "EventRegistration"("eventId");

-- CreateIndex
CREATE INDEX "EventRegistration_email_idx" ON "EventRegistration"("email");

-- CreateIndex
CREATE UNIQUE INDEX "News_slug_key" ON "News"("slug");

-- CreateIndex
CREATE INDEX "News_status_idx" ON "News"("status");

-- CreateIndex
CREATE INDEX "News_publishedAt_idx" ON "News"("publishedAt");

-- CreateIndex
CREATE INDEX "News_categoryId_idx" ON "News"("categoryId");

-- CreateIndex
CREATE INDEX "News_approvalStatus_idx" ON "News"("approvalStatus");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_priority_idx" ON "Task"("priority");

-- CreateIndex
CREATE INDEX "Task_createdById_idx" ON "Task"("createdById");

-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");

-- CreateIndex
CREATE INDEX "TaskAssignee_taskId_idx" ON "TaskAssignee"("taskId");

-- CreateIndex
CREATE INDEX "TaskAssignee_userId_idx" ON "TaskAssignee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskAssignee_taskId_userId_key" ON "TaskAssignee"("taskId", "userId");

-- CreateIndex
CREATE INDEX "TaskChecklistItem_taskId_idx" ON "TaskChecklistItem"("taskId");

-- CreateIndex
CREATE INDEX "TaskComment_taskId_idx" ON "TaskComment"("taskId");

-- CreateIndex
CREATE INDEX "TaskAttachment_taskId_idx" ON "TaskAttachment"("taskId");

-- CreateIndex
CREATE INDEX "TaskActivity_taskId_idx" ON "TaskActivity"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityCategory_slug_key" ON "ActivityCategory"("slug");

-- CreateIndex
CREATE INDEX "CorporateActivity_categoryId_idx" ON "CorporateActivity"("categoryId");

-- CreateIndex
CREATE INDEX "CorporateActivity_activityDate_idx" ON "CorporateActivity"("activityDate");

-- CreateIndex
CREATE INDEX "CorporateActivity_programId_idx" ON "CorporateActivity"("programId");

-- CreateIndex
CREATE INDEX "ActivityEvidence_activityId_idx" ON "ActivityEvidence"("activityId");

-- CreateIndex
CREATE INDEX "ActivityParticipant_activityId_idx" ON "ActivityParticipant"("activityId");

-- CreateIndex
CREATE INDEX "Organization_name_idx" ON "Organization"("name");

-- CreateIndex
CREATE INDEX "Organization_orgType_idx" ON "Organization"("orgType");

-- CreateIndex
CREATE INDEX "Organization_status_idx" ON "Organization"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE INDEX "Project_projectType_idx" ON "Project"("projectType");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Project_createdById_idx" ON "Project"("createdById");

-- CreateIndex
CREATE INDEX "ProjectMilestone_projectId_idx" ON "ProjectMilestone"("projectId");

-- CreateIndex
CREATE INDEX "ProjectMilestone_targetDate_idx" ON "ProjectMilestone"("targetDate");

-- CreateIndex
CREATE INDEX "ProjectRisk_projectId_idx" ON "ProjectRisk"("projectId");

-- CreateIndex
CREATE INDEX "ProjectBudget_projectId_idx" ON "ProjectBudget"("projectId");

-- CreateIndex
CREATE INDEX "StakeholderContact_fullName_idx" ON "StakeholderContact"("fullName");

-- CreateIndex
CREATE INDEX "StakeholderContact_contactType_idx" ON "StakeholderContact"("contactType");

-- CreateIndex
CREATE INDEX "StakeholderContact_email_idx" ON "StakeholderContact"("email");

-- CreateIndex
CREATE INDEX "WorkflowApproval_status_idx" ON "WorkflowApproval"("status");

-- CreateIndex
CREATE INDEX "WorkflowApproval_entityType_entityId_idx" ON "WorkflowApproval"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "WorkflowApproval_requestedById_idx" ON "WorkflowApproval"("requestedById");

-- CreateIndex
CREATE INDEX "Support_sortOrder_idx" ON "Support"("sortOrder");

-- CreateIndex
CREATE INDEX "Support_isActive_idx" ON "Support"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Form_slug_key" ON "Form"("slug");

-- CreateIndex
CREATE INDEX "FormVersion_formId_idx" ON "FormVersion"("formId");

-- CreateIndex
CREATE UNIQUE INDEX "FormVersion_formId_versionNumber_key" ON "FormVersion"("formId", "versionNumber");

-- CreateIndex
CREATE INDEX "FormField_formVersionId_idx" ON "FormField"("formVersionId");

-- CreateIndex
CREATE INDEX "FormField_sortOrder_idx" ON "FormField"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_submissionNumber_key" ON "Submission"("submissionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_idempotencyKey_key" ON "Submission"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Submission_formVersionId_idx" ON "Submission"("formVersionId");

-- CreateIndex
CREATE INDEX "Submission_createdAt_idx" ON "Submission"("createdAt");

-- CreateIndex
CREATE INDEX "SubmissionAnswer_submissionId_idx" ON "SubmissionAnswer"("submissionId");

-- CreateIndex
CREATE INDEX "SubmissionAnswer_fieldId_idx" ON "SubmissionAnswer"("fieldId");

-- CreateIndex
CREATE INDEX "SubmissionAnswer_fieldKey_idx" ON "SubmissionAnswer"("fieldKey");

-- CreateIndex
CREATE UNIQUE INDEX "Application_applicationNumber_key" ON "Application"("applicationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Application_submissionId_key" ON "Application"("submissionId");

-- CreateIndex
CREATE INDEX "Application_status_idx" ON "Application"("status");

-- CreateIndex
CREATE INDEX "Application_programId_idx" ON "Application"("programId");

-- CreateIndex
CREATE INDEX "Application_assignedToId_idx" ON "Application"("assignedToId");

-- CreateIndex
CREATE INDEX "Application_createdAt_idx" ON "Application"("createdAt");

-- CreateIndex
CREATE INDEX "ApplicationStatusHistory_applicationId_idx" ON "ApplicationStatusHistory"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationNote_applicationId_idx" ON "ApplicationNote"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationFile_applicationId_idx" ON "ApplicationFile"("applicationId");

-- CreateIndex
CREATE INDEX "EvaluationCriterion_templateId_idx" ON "EvaluationCriterion"("templateId");

-- CreateIndex
CREATE INDEX "Evaluation_applicationId_idx" ON "Evaluation"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_applicationId_evaluatorId_key" ON "Evaluation"("applicationId", "evaluatorId");

-- CreateIndex
CREATE INDEX "EvaluationScore_evaluationId_idx" ON "EvaluationScore"("evaluationId");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationScore_evaluationId_criterionId_key" ON "EvaluationScore"("evaluationId", "criterionId");

-- CreateIndex
CREATE INDEX "ContactRequest_requestType_idx" ON "ContactRequest"("requestType");

-- CreateIndex
CREATE INDEX "ContactRequest_status_idx" ON "ContactRequest"("status");

-- CreateIndex
CREATE INDEX "ContactRequest_createdAt_idx" ON "ContactRequest"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Media_storagePath_key" ON "Media"("storagePath");

-- CreateIndex
CREATE INDEX "Media_folder_idx" ON "Media"("folder");

-- CreateIndex
CREATE INDEX "Media_mimeType_idx" ON "Media"("mimeType");

-- CreateIndex
CREATE INDEX "Media_createdAt_idx" ON "Media"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SiteSetting_key_key" ON "SiteSetting"("key");

-- CreateIndex
CREATE INDEX "SiteSetting_group_idx" ON "SiteSetting"("group");

-- CreateIndex
CREATE INDEX "MenuItem_menuLocation_idx" ON "MenuItem"("menuLocation");

-- CreateIndex
CREATE INDEX "MenuItem_sortOrder_idx" ON "MenuItem"("sortOrder");

-- CreateIndex
CREATE INDEX "Partner_partnerGroup_idx" ON "Partner"("partnerGroup");

-- CreateIndex
CREATE INDEX "Partner_sortOrder_idx" ON "Partner"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Redirect_fromUrl_key" ON "Redirect"("fromUrl");

-- CreateIndex
CREATE INDEX "Redirect_fromUrl_idx" ON "Redirect"("fromUrl");

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplate_templateKey_key" ON "EmailTemplate"("templateKey");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "SystemErrorLog_severity_idx" ON "SystemErrorLog"("severity");

-- CreateIndex
CREATE INDEX "SystemErrorLog_createdAt_idx" ON "SystemErrorLog"("createdAt");

-- CreateIndex
CREATE INDEX "CalendarEventMapping_externalEventId_idx" ON "CalendarEventMapping"("externalEventId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEventMapping_localEventType_localEventId_externalSy_key" ON "CalendarEventMapping"("localEventType", "localEventId", "externalSystem");

-- CreateIndex
CREATE UNIQUE INDEX "Resource_code_key" ON "Resource"("code");

-- CreateIndex
CREATE INDEX "Resource_resourceType_idx" ON "Resource"("resourceType");

-- CreateIndex
CREATE INDEX "Resource_isActive_idx" ON "Resource"("isActive");

-- CreateIndex
CREATE INDEX "Reservation_resourceId_idx" ON "Reservation"("resourceId");

-- CreateIndex
CREATE INDEX "Reservation_userId_idx" ON "Reservation"("userId");

-- CreateIndex
CREATE INDEX "Reservation_startTime_endTime_idx" ON "Reservation"("startTime", "endTime");

-- CreateIndex
CREATE INDEX "Reservation_status_idx" ON "Reservation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_contractNumber_key" ON "Contract"("contractNumber");

-- CreateIndex
CREATE INDEX "Contract_contractType_idx" ON "Contract"("contractType");

-- CreateIndex
CREATE INDEX "Contract_status_idx" ON "Contract"("status");

-- CreateIndex
CREATE INDEX "Contract_responsibleUserId_idx" ON "Contract"("responsibleUserId");

-- CreateIndex
CREATE INDEX "Contract_endDate_idx" ON "Contract"("endDate");

-- CreateIndex
CREATE INDEX "ContractDocument_contractId_idx" ON "ContractDocument"("contractId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeArticle_slug_key" ON "KnowledgeArticle"("slug");

-- CreateIndex
CREATE INDEX "KnowledgeArticle_category_idx" ON "KnowledgeArticle"("category");

-- CreateIndex
CREATE INDEX "KnowledgeArticle_audience_idx" ON "KnowledgeArticle"("audience");

-- CreateIndex
CREATE INDEX "KnowledgeArticle_isPublished_idx" ON "KnowledgeArticle"("isPublished");

-- CreateIndex
CREATE INDEX "PortalAccount_accountType_idx" ON "PortalAccount"("accountType");

-- CreateIndex
CREATE INDEX "PortalAccount_entrepreneurId_idx" ON "PortalAccount"("entrepreneurId");

-- CreateIndex
CREATE INDEX "PortalAccount_mentorId_idx" ON "PortalAccount"("mentorId");

-- CreateIndex
CREATE UNIQUE INDEX "PortalAccount_userId_accountType_key" ON "PortalAccount"("userId", "accountType");

-- CreateIndex
CREATE INDEX "AutomationRule_triggerType_idx" ON "AutomationRule"("triggerType");

-- CreateIndex
CREATE INDEX "AutomationRule_isActive_idx" ON "AutomationRule"("isActive");

-- CreateIndex
CREATE INDEX "AutomationLog_ruleId_idx" ON "AutomationLog"("ruleId");

-- CreateIndex
CREATE INDEX "AutomationLog_status_idx" ON "AutomationLog"("status");

-- CreateIndex
CREATE INDEX "AutomationLog_executedAt_idx" ON "AutomationLog"("executedAt");

-- CreateIndex
CREATE INDEX "AiTaskLog_taskType_idx" ON "AiTaskLog"("taskType");

-- CreateIndex
CREATE INDEX "AiTaskLog_status_idx" ON "AiTaskLog"("status");

-- CreateIndex
CREATE UNIQUE INDEX "UserInvite_email_key" ON "UserInvite"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserInvite_tokenHash_key" ON "UserInvite"("tokenHash");

-- CreateIndex
CREATE INDEX "UserInvite_tokenHash_idx" ON "UserInvite"("tokenHash");

-- CreateIndex
CREATE INDEX "UserInvite_email_idx" ON "UserInvite"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_tokenHash_idx" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "TerminologyLabel_key_key" ON "TerminologyLabel"("key");

-- CreateIndex
CREATE INDEX "TerminologyLabel_group_idx" ON "TerminologyLabel"("group");

-- CreateIndex
CREATE INDEX "CustomFieldDefinition_moduleKey_idx" ON "CustomFieldDefinition"("moduleKey");

-- CreateIndex
CREATE UNIQUE INDEX "CustomFieldDefinition_moduleKey_fieldKey_key" ON "CustomFieldDefinition"("moduleKey", "fieldKey");

-- CreateIndex
CREATE INDEX "CustomFieldValue_entityId_idx" ON "CustomFieldValue"("entityId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomFieldValue_definitionId_entityId_key" ON "CustomFieldValue"("definitionId", "entityId");

-- CreateIndex
CREATE INDEX "PipelineStatus_moduleKey_idx" ON "PipelineStatus"("moduleKey");

-- CreateIndex
CREATE UNIQUE INDEX "PipelineStatus_moduleKey_statusKey_key" ON "PipelineStatus"("moduleKey", "statusKey");

-- CreateIndex
CREATE INDEX "EmailOutbox_status_idx" ON "EmailOutbox"("status");

-- CreateIndex
CREATE INDEX "EmailOutbox_recipientEmail_idx" ON "EmailOutbox"("recipientEmail");

-- CreateIndex
CREATE INDEX "EmailOutbox_createdAt_idx" ON "EmailOutbox"("createdAt");

-- CreateIndex
CREATE INDEX "NotificationRule_eventType_idx" ON "NotificationRule"("eventType");

-- CreateIndex
CREATE INDEX "NotificationRule_isActive_idx" ON "NotificationRule"("isActive");

-- CreateIndex
CREATE INDEX "SecurityEvent_eventType_idx" ON "SecurityEvent"("eventType");

-- CreateIndex
CREATE INDEX "SecurityEvent_severity_idx" ON "SecurityEvent"("severity");

-- CreateIndex
CREATE INDEX "SecurityEvent_createdAt_idx" ON "SecurityEvent"("createdAt");

-- CreateIndex
CREATE INDEX "SecurityEvent_userId_idx" ON "SecurityEvent"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CaseStudy_slug_key" ON "CaseStudy"("slug");

-- CreateIndex
CREATE INDEX "CaseStudy_slug_idx" ON "CaseStudy"("slug");

-- CreateIndex
CREATE INDEX "CaseStudy_isPublished_idx" ON "CaseStudy"("isPublished");

-- CreateIndex
CREATE INDEX "FaqItem_isActive_idx" ON "FaqItem"("isActive");

-- CreateIndex
CREATE INDEX "FaqItem_category_idx" ON "FaqItem"("category");

-- CreateIndex
CREATE INDEX "Testimonial_isPublished_idx" ON "Testimonial"("isPublished");

-- CreateIndex
CREATE INDEX "TeamMember_isActive_idx" ON "TeamMember"("isActive");

-- CreateIndex
CREATE INDEX "BoardMember_boardType_idx" ON "BoardMember"("boardType");

-- CreateIndex
CREATE INDEX "BoardMember_isActive_idx" ON "BoardMember"("isActive");

-- CreateIndex
CREATE INDEX "BoardMember_sortOrder_idx" ON "BoardMember"("sortOrder");

-- CreateIndex
CREATE INDEX "Facility_facilityType_idx" ON "Facility"("facilityType");

-- CreateIndex
CREATE INDEX "Facility_isActive_idx" ON "Facility"("isActive");

-- CreateIndex
CREATE INDEX "Facility_sortOrder_idx" ON "Facility"("sortOrder");

-- CreateIndex
CREATE INDEX "ServiceItem_isActive_idx" ON "ServiceItem"("isActive");

-- CreateIndex
CREATE INDEX "ServiceItem_sortOrder_idx" ON "ServiceItem"("sortOrder");

-- CreateIndex
CREATE INDEX "LegislationDocument_category_idx" ON "LegislationDocument"("category");

-- CreateIndex
CREATE INDEX "LegislationDocument_isActive_idx" ON "LegislationDocument"("isActive");

-- CreateIndex
CREATE INDEX "LegislationDocument_sortOrder_idx" ON "LegislationDocument"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "SocialAccount_accountId_key" ON "SocialAccount"("accountId");

-- CreateIndex
CREATE INDEX "SocialAccount_provider_idx" ON "SocialAccount"("provider");

-- CreateIndex
CREATE INDEX "SocialAccount_isActive_idx" ON "SocialAccount"("isActive");

-- CreateIndex
CREATE INDEX "SocialPost_syncStatus_idx" ON "SocialPost"("syncStatus");

-- CreateIndex
CREATE INDEX "SocialPost_postDate_idx" ON "SocialPost"("postDate");

-- CreateIndex
CREATE UNIQUE INDEX "SocialPost_socialAccountId_externalId_key" ON "SocialPost"("socialAccountId", "externalId");

-- CreateIndex
CREATE INDEX "SocialImportRule_socialAccountId_idx" ON "SocialImportRule"("socialAccountId");

-- CreateIndex
CREATE INDEX "SocialSyncRun_socialAccountId_idx" ON "SocialSyncRun"("socialAccountId");

-- CreateIndex
CREATE INDEX "SocialContentLink_socialPostId_idx" ON "SocialContentLink"("socialPostId");

-- CreateIndex
CREATE INDEX "SocialContentLink_entityType_entityId_idx" ON "SocialContentLink"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "PersonalTodo_userId_idx" ON "PersonalTodo"("userId");

-- CreateIndex
CREATE INDEX "PersonalTodo_isCompleted_idx" ON "PersonalTodo"("isCompleted");

-- CreateIndex
CREATE INDEX "PersonalTodo_dueDate_idx" ON "PersonalTodo"("dueDate");

-- CreateIndex
CREATE INDEX "PersonalNote_userId_idx" ON "PersonalNote"("userId");

-- CreateIndex
CREATE INDEX "PersonalNote_relatedEntityType_relatedEntityId_idx" ON "PersonalNote"("relatedEntityType", "relatedEntityId");

-- CreateIndex
CREATE INDEX "UserReminder_userId_idx" ON "UserReminder"("userId");

-- CreateIndex
CREATE INDEX "UserReminder_remindAt_idx" ON "UserReminder"("remindAt");

-- CreateIndex
CREATE INDEX "UserReminder_isTriggered_idx" ON "UserReminder"("isTriggered");

-- CreateIndex
CREATE INDEX "UserFavorite_userId_idx" ON "UserFavorite"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFavorite_userId_entityType_entityId_key" ON "UserFavorite"("userId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "RecentItem_userId_viewedAt_idx" ON "RecentItem"("userId", "viewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RecentItem_userId_entityType_entityId_key" ON "RecentItem"("userId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "MeetingNote_createdById_idx" ON "MeetingNote"("createdById");

-- CreateIndex
CREATE INDEX "MeetingNote_meetingId_idx" ON "MeetingNote"("meetingId");

-- CreateIndex
CREATE INDEX "UserDelegation_userId_idx" ON "UserDelegation"("userId");

-- CreateIndex
CREATE INDEX "UserDelegation_delegateUserId_idx" ON "UserDelegation"("delegateUserId");

-- CreateIndex
CREATE INDEX "UserDelegation_isActive_idx" ON "UserDelegation"("isActive");

-- CreateIndex
CREATE INDEX "DashboardWidgetConfig_userId_idx" ON "DashboardWidgetConfig"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DashboardWidgetConfig_userId_widgetKey_key" ON "DashboardWidgetConfig"("userId", "widgetKey");

-- CreateIndex
CREATE UNIQUE INDEX "OperationalReport_slug_key" ON "OperationalReport"("slug");

-- CreateIndex
CREATE INDEX "OperationalReport_reportType_idx" ON "OperationalReport"("reportType");

-- CreateIndex
CREATE INDEX "OperationalReport_status_idx" ON "OperationalReport"("status");

-- CreateIndex
CREATE INDEX "OperationalReport_authorId_idx" ON "OperationalReport"("authorId");

-- CreateIndex
CREATE INDEX "OperationalReport_periodStart_periodEnd_idx" ON "OperationalReport"("periodStart", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "ReportTemplate_key_key" ON "ReportTemplate"("key");

-- CreateIndex
CREATE INDEX "ReportSchedule_isActive_idx" ON "ReportSchedule"("isActive");

-- CreateIndex
CREATE INDEX "DailyInteraction_date_idx" ON "DailyInteraction"("date");

-- CreateIndex
CREATE INDEX "DailyInteraction_interactionType_idx" ON "DailyInteraction"("interactionType");

-- CreateIndex
CREATE INDEX "DailyInteraction_status_idx" ON "DailyInteraction"("status");

-- CreateIndex
CREATE INDEX "DailyInteraction_hostUserId_idx" ON "DailyInteraction"("hostUserId");

-- CreateIndex
CREATE INDEX "DailyInteraction_entrepreneurId_idx" ON "DailyInteraction"("entrepreneurId");

-- CreateIndex
CREATE INDEX "DailyInteraction_followUpDate_idx" ON "DailyInteraction"("followUpDate");

-- CreateIndex
CREATE INDEX "EntrepreneurProgram_entrepreneurId_idx" ON "EntrepreneurProgram"("entrepreneurId");

-- CreateIndex
CREATE INDEX "EntrepreneurProgram_programId_idx" ON "EntrepreneurProgram"("programId");

-- CreateIndex
CREATE INDEX "EntrepreneurProgram_status_idx" ON "EntrepreneurProgram"("status");

-- CreateIndex
CREATE UNIQUE INDEX "KvkkTextVersion_title_version_key" ON "KvkkTextVersion"("title", "version");

-- CreateIndex
CREATE INDEX "KvkkConsent_subjectType_idx" ON "KvkkConsent"("subjectType");

-- CreateIndex
CREATE INDEX "KvkkConsent_status_idx" ON "KvkkConsent"("status");

-- CreateIndex
CREATE INDEX "KvkkConsent_email_idx" ON "KvkkConsent"("email");

-- CreateIndex
CREATE INDEX "KvkkConsent_consentedAt_idx" ON "KvkkConsent"("consentedAt");

-- CreateIndex
CREATE INDEX "FundingSource_projectId_idx" ON "FundingSource"("projectId");

-- CreateIndex
CREATE INDEX "FundingSource_status_idx" ON "FundingSource"("status");

-- CreateIndex
CREATE INDEX "FundingReceipt_fundingSourceId_idx" ON "FundingReceipt"("fundingSourceId");

-- CreateIndex
CREATE INDEX "FundingReceipt_status_idx" ON "FundingReceipt"("status");

-- CreateIndex
CREATE INDEX "FundingReceipt_expectedDate_idx" ON "FundingReceipt"("expectedDate");

-- CreateIndex
CREATE INDEX "ProjectBudgetLine_projectId_idx" ON "ProjectBudgetLine"("projectId");

-- CreateIndex
CREATE INDEX "ProjectExpense_projectId_idx" ON "ProjectExpense"("projectId");

-- CreateIndex
CREATE INDEX "ProjectExpense_fundingSourceId_idx" ON "ProjectExpense"("fundingSourceId");

-- CreateIndex
CREATE INDEX "ProjectExpense_budgetLineId_idx" ON "ProjectExpense"("budgetLineId");

-- CreateIndex
CREATE INDEX "ProjectExpense_paymentStatus_idx" ON "ProjectExpense"("paymentStatus");

-- CreateIndex
CREATE INDEX "ProjectExpense_expenseDate_idx" ON "ProjectExpense"("expenseDate");

-- CreateIndex
CREATE INDEX "InvoiceRecord_vendorName_invoiceNumber_idx" ON "InvoiceRecord"("vendorName", "invoiceNumber");

-- CreateIndex
CREATE INDEX "InvoiceRecord_projectId_idx" ON "InvoiceRecord"("projectId");

-- CreateIndex
CREATE INDEX "InvoiceRecord_entrepreneurId_idx" ON "InvoiceRecord"("entrepreneurId");

-- CreateIndex
CREATE UNIQUE INDEX "RentContract_contractNo_key" ON "RentContract"("contractNo");

-- CreateIndex
CREATE INDEX "RentContract_entrepreneurId_idx" ON "RentContract"("entrepreneurId");

-- CreateIndex
CREATE INDEX "RentContract_organizationId_idx" ON "RentContract"("organizationId");

-- CreateIndex
CREATE INDEX "RentContract_financeContactPersonId_idx" ON "RentContract"("financeContactPersonId");

-- CreateIndex
CREATE INDEX "RentContract_status_idx" ON "RentContract"("status");

-- CreateIndex
CREATE INDEX "RentContractDocument_contractId_idx" ON "RentContractDocument"("contractId");

-- CreateIndex
CREATE INDEX "RentContractDocument_documentType_idx" ON "RentContractDocument"("documentType");

-- CreateIndex
CREATE INDEX "RentAccrual_entrepreneurId_idx" ON "RentAccrual"("entrepreneurId");

-- CreateIndex
CREATE INDEX "RentAccrual_status_idx" ON "RentAccrual"("status");

-- CreateIndex
CREATE INDEX "RentAccrual_dueDate_idx" ON "RentAccrual"("dueDate");

-- CreateIndex
CREATE INDEX "RentAccrual_year_month_idx" ON "RentAccrual"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "RentAccrual_contractId_year_month_key" ON "RentAccrual"("contractId", "year", "month");

-- CreateIndex
CREATE INDEX "RentPayment_accrualId_idx" ON "RentPayment"("accrualId");

-- CreateIndex
CREATE INDEX "RentPayment_entrepreneurId_idx" ON "RentPayment"("entrepreneurId");

-- CreateIndex
CREATE INDEX "RentPayment_paymentDate_idx" ON "RentPayment"("paymentDate");

-- CreateIndex
CREATE INDEX "Receivable_source_idx" ON "Receivable"("source");

-- CreateIndex
CREATE INDEX "Receivable_status_idx" ON "Receivable"("status");

-- CreateIndex
CREATE INDEX "Receivable_dueDate_idx" ON "Receivable"("dueDate");

-- CreateIndex
CREATE INDEX "Receivable_currency_idx" ON "Receivable"("currency");

-- CreateIndex
CREATE INDEX "Receivable_relatedProjectId_idx" ON "Receivable"("relatedProjectId");

-- CreateIndex
CREATE INDEX "Receivable_relatedEntrepreneurId_idx" ON "Receivable"("relatedEntrepreneurId");

-- CreateIndex
CREATE INDEX "Receivable_relatedOrganizationId_idx" ON "Receivable"("relatedOrganizationId");

-- CreateIndex
CREATE INDEX "ExchangeRate_sourceCurrency_targetCurrency_idx" ON "ExchangeRate"("sourceCurrency", "targetCurrency");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeRate_sourceCurrency_targetCurrency_rateDate_key" ON "ExchangeRate"("sourceCurrency", "targetCurrency", "rateDate");

-- CreateIndex
CREATE UNIQUE INDEX "Person_email_key" ON "Person"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Person_userId_key" ON "Person"("userId");

-- CreateIndex
CREATE INDEX "Person_fullName_idx" ON "Person"("fullName");

-- CreateIndex
CREATE INDEX "Person_email_idx" ON "Person"("email");

-- CreateIndex
CREATE INDEX "Person_phone_idx" ON "Person"("phone");

-- CreateIndex
CREATE INDEX "Person_status_idx" ON "Person"("status");

-- CreateIndex
CREATE INDEX "PersonOrganizationMembership_personId_idx" ON "PersonOrganizationMembership"("personId");

-- CreateIndex
CREATE INDEX "PersonOrganizationMembership_organizationId_idx" ON "PersonOrganizationMembership"("organizationId");

-- CreateIndex
CREATE INDEX "PersonOrganizationMembership_role_idx" ON "PersonOrganizationMembership"("role");

-- CreateIndex
CREATE INDEX "PersonOrganizationMembership_status_idx" ON "PersonOrganizationMembership"("status");

-- CreateIndex
CREATE INDEX "EntrepreneurOrganization_entrepreneurId_idx" ON "EntrepreneurOrganization"("entrepreneurId");

-- CreateIndex
CREATE INDEX "EntrepreneurOrganization_organizationId_idx" ON "EntrepreneurOrganization"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "EntrepreneurOrganization_entrepreneurId_organizationId_key" ON "EntrepreneurOrganization"("entrepreneurId", "organizationId");

-- CreateIndex
CREATE INDEX "StakeholderRelationship_entityType_idx" ON "StakeholderRelationship"("entityType");

-- CreateIndex
CREATE INDEX "StakeholderRelationship_personId_idx" ON "StakeholderRelationship"("personId");

-- CreateIndex
CREATE INDEX "StakeholderRelationship_organizationId_idx" ON "StakeholderRelationship"("organizationId");

-- CreateIndex
CREATE INDEX "StakeholderRelationship_stakeholderType_idx" ON "StakeholderRelationship"("stakeholderType");

-- CreateIndex
CREATE INDEX "AiChangeSet_userId_idx" ON "AiChangeSet"("userId");

-- CreateIndex
CREATE INDEX "AiChangeSet_intent_idx" ON "AiChangeSet"("intent");

-- CreateIndex
CREATE INDEX "AiChangeSet_status_idx" ON "AiChangeSet"("status");

-- CreateIndex
CREATE INDEX "AiChangeSet_createdAt_idx" ON "AiChangeSet"("createdAt");

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntrepreneurFounder" ADD CONSTRAINT "EntrepreneurFounder_entrepreneurId_fkey" FOREIGN KEY ("entrepreneurId") REFERENCES "Entrepreneur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntrepreneurFounder" ADD CONSTRAINT "EntrepreneurFounder_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntrepreneurInvestment" ADD CONSTRAINT "EntrepreneurInvestment_entrepreneurId_fkey" FOREIGN KEY ("entrepreneurId") REFERENCES "Entrepreneur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntrepreneurPatent" ADD CONSTRAINT "EntrepreneurPatent_entrepreneurId_fkey" FOREIGN KEY ("entrepreneurId") REFERENCES "Entrepreneur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntrepreneurGrant" ADD CONSTRAINT "EntrepreneurGrant_entrepreneurId_fkey" FOREIGN KEY ("entrepreneurId") REFERENCES "Entrepreneur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntrepreneurMilestone" ADD CONSTRAINT "EntrepreneurMilestone_entrepreneurId_fkey" FOREIGN KEY ("entrepreneurId") REFERENCES "Entrepreneur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntrepreneurDocument" ADD CONSTRAINT "EntrepreneurDocument_entrepreneurId_fkey" FOREIGN KEY ("entrepreneurId") REFERENCES "Entrepreneur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntrepreneurGallery" ADD CONSTRAINT "EntrepreneurGallery_entrepreneurId_fkey" FOREIGN KEY ("entrepreneurId") REFERENCES "Entrepreneur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mentor" ADD CONSTRAINT "Mentor_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorProgram" ADD CONSTRAINT "MentorProgram_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "Mentor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorProgram" ADD CONSTRAINT "MentorProgram_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorSession" ADD CONSTRAINT "MentorSession_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "Mentor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorSession" ADD CONSTRAINT "MentorSession_entrepreneurId_fkey" FOREIGN KEY ("entrepreneurId") REFERENCES "Entrepreneur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Training" ADD CONSTRAINT "Training_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingInstructor" ADD CONSTRAINT "TrainingInstructor_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingInstructor" ADD CONSTRAINT "TrainingInstructor_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "Mentor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingEnrollment" ADD CONSTRAINT "TrainingEnrollment_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingAttendance" ADD CONSTRAINT "TrainingAttendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TrainingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingAttendance" ADD CONSTRAINT "TrainingAttendance_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "TrainingEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingFeedback" ADD CONSTRAINT "TrainingFeedback_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingFeedback" ADD CONSTRAINT "TrainingFeedback_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "TrainingEnrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventSession" ADD CONSTRAINT "EventSession_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventSpeaker" ADD CONSTRAINT "EventSpeaker_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "News" ADD CONSTRAINT "News_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_entrepreneurId_fkey" FOREIGN KEY ("entrepreneurId") REFERENCES "Entrepreneur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "Mentor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "News"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "CorporateActivity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignee" ADD CONSTRAINT "TaskAssignee_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignee" ADD CONSTRAINT "TaskAssignee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskChecklistItem" ADD CONSTRAINT "TaskChecklistItem_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAttachment" ADD CONSTRAINT "TaskAttachment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskActivity" ADD CONSTRAINT "TaskActivity_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateActivity" ADD CONSTRAINT "CorporateActivity_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ActivityCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateActivity" ADD CONSTRAINT "CorporateActivity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateActivity" ADD CONSTRAINT "CorporateActivity_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateActivity" ADD CONSTRAINT "CorporateActivity_entrepreneurId_fkey" FOREIGN KEY ("entrepreneurId") REFERENCES "Entrepreneur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateActivity" ADD CONSTRAINT "CorporateActivity_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "Mentor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateActivity" ADD CONSTRAINT "CorporateActivity_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateActivity" ADD CONSTRAINT "CorporateActivity_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvidence" ADD CONSTRAINT "ActivityEvidence_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "CorporateActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityParticipant" ADD CONSTRAINT "ActivityParticipant_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "CorporateActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_entrepreneurId_fkey" FOREIGN KEY ("entrepreneurId") REFERENCES "Entrepreneur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMilestone" ADD CONSTRAINT "ProjectMilestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectRisk" ADD CONSTRAINT "ProjectRisk_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectBudget" ADD CONSTRAINT "ProjectBudget_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StakeholderContact" ADD CONSTRAINT "StakeholderContact_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowApproval" ADD CONSTRAINT "WorkflowApproval_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowApproval" ADD CONSTRAINT "WorkflowApproval_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormVersion" ADD CONSTRAINT "FormVersion_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormVersion" ADD CONSTRAINT "FormVersion_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormField" ADD CONSTRAINT "FormField_formVersionId_fkey" FOREIGN KEY ("formVersionId") REFERENCES "FormVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_formVersionId_fkey" FOREIGN KEY ("formVersionId") REFERENCES "FormVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionAnswer" ADD CONSTRAINT "SubmissionAnswer_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionAnswer" ADD CONSTRAINT "SubmissionAnswer_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "FormField"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_formVersionId_fkey" FOREIGN KEY ("formVersionId") REFERENCES "FormVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationStatusHistory" ADD CONSTRAINT "ApplicationStatusHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationNote" ADD CONSTRAINT "ApplicationNote_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationNote" ADD CONSTRAINT "ApplicationNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationFile" ADD CONSTRAINT "ApplicationFile_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationCriterion" ADD CONSTRAINT "EvaluationCriterion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "EvaluationTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "EvaluationTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationScore" ADD CONSTRAINT "EvaluationScore_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationScore" ADD CONSTRAINT "EvaluationScore_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "EvaluationCriterion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactRequest" ADD CONSTRAINT "ContactRequest_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_responsibleUserId_fkey" FOREIGN KEY ("responsibleUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractDocument" ADD CONSTRAINT "ContractDocument_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeArticle" ADD CONSTRAINT "KnowledgeArticle_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortalAccount" ADD CONSTRAINT "PortalAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortalAccount" ADD CONSTRAINT "PortalAccount_entrepreneurId_fkey" FOREIGN KEY ("entrepreneurId") REFERENCES "Entrepreneur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortalAccount" ADD CONSTRAINT "PortalAccount_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "Mentor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationLog" ADD CONSTRAINT "AutomationLog_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AutomationRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiTaskLog" ADD CONSTRAINT "AiTaskLog_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInvite" ADD CONSTRAINT "UserInvite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInvite" ADD CONSTRAINT "UserInvite_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomFieldValue" ADD CONSTRAINT "CustomFieldValue_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "CustomFieldDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityEvent" ADD CONSTRAINT "SecurityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseStudy" ADD CONSTRAINT "CaseStudy_entrepreneurId_fkey" FOREIGN KEY ("entrepreneurId") REFERENCES "Entrepreneur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseStudy" ADD CONSTRAINT "CaseStudy_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "SocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialImportRule" ADD CONSTRAINT "SocialImportRule_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "SocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialSyncRun" ADD CONSTRAINT "SocialSyncRun_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "SocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialContentLink" ADD CONSTRAINT "SocialContentLink_socialPostId_fkey" FOREIGN KEY ("socialPostId") REFERENCES "SocialPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalTodo" ADD CONSTRAINT "PersonalTodo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalNote" ADD CONSTRAINT "PersonalNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReminder" ADD CONSTRAINT "UserReminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFavorite" ADD CONSTRAINT "UserFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecentItem" ADD CONSTRAINT "RecentItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingNote" ADD CONSTRAINT "MeetingNote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDelegation" ADD CONSTRAINT "UserDelegation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDelegation" ADD CONSTRAINT "UserDelegation_delegateUserId_fkey" FOREIGN KEY ("delegateUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardWidgetConfig" ADD CONSTRAINT "DashboardWidgetConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalReport" ADD CONSTRAINT "OperationalReport_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalReport" ADD CONSTRAINT "OperationalReport_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyInteraction" ADD CONSTRAINT "DailyInteraction_hostUserId_fkey" FOREIGN KEY ("hostUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyInteraction" ADD CONSTRAINT "DailyInteraction_entrepreneurId_fkey" FOREIGN KEY ("entrepreneurId") REFERENCES "Entrepreneur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyInteraction" ADD CONSTRAINT "DailyInteraction_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "Mentor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyInteraction" ADD CONSTRAINT "DailyInteraction_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyInteraction" ADD CONSTRAINT "DailyInteraction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyInteraction" ADD CONSTRAINT "DailyInteraction_kvkkConsentId_fkey" FOREIGN KEY ("kvkkConsentId") REFERENCES "KvkkConsent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntrepreneurProgram" ADD CONSTRAINT "EntrepreneurProgram_entrepreneurId_fkey" FOREIGN KEY ("entrepreneurId") REFERENCES "Entrepreneur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntrepreneurProgram" ADD CONSTRAINT "EntrepreneurProgram_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntrepreneurProgram" ADD CONSTRAINT "EntrepreneurProgram_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KvkkConsent" ADD CONSTRAINT "KvkkConsent_textVersionId_fkey" FOREIGN KEY ("textVersionId") REFERENCES "KvkkTextVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KvkkConsent" ADD CONSTRAINT "KvkkConsent_entrepreneurId_fkey" FOREIGN KEY ("entrepreneurId") REFERENCES "Entrepreneur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KvkkConsent" ADD CONSTRAINT "KvkkConsent_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "Mentor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundingSource" ADD CONSTRAINT "FundingSource_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundingReceipt" ADD CONSTRAINT "FundingReceipt_fundingSourceId_fkey" FOREIGN KEY ("fundingSourceId") REFERENCES "FundingSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectBudgetLine" ADD CONSTRAINT "ProjectBudgetLine_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectExpense" ADD CONSTRAINT "ProjectExpense_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectExpense" ADD CONSTRAINT "ProjectExpense_fundingSourceId_fkey" FOREIGN KEY ("fundingSourceId") REFERENCES "FundingSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectExpense" ADD CONSTRAINT "ProjectExpense_budgetLineId_fkey" FOREIGN KEY ("budgetLineId") REFERENCES "ProjectBudgetLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceRecord" ADD CONSTRAINT "InvoiceRecord_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "ProjectExpense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceRecord" ADD CONSTRAINT "InvoiceRecord_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceRecord" ADD CONSTRAINT "InvoiceRecord_entrepreneurId_fkey" FOREIGN KEY ("entrepreneurId") REFERENCES "Entrepreneur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentContract" ADD CONSTRAINT "RentContract_entrepreneurId_fkey" FOREIGN KEY ("entrepreneurId") REFERENCES "Entrepreneur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentContract" ADD CONSTRAINT "RentContract_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentContract" ADD CONSTRAINT "RentContract_financeContactPersonId_fkey" FOREIGN KEY ("financeContactPersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentContract" ADD CONSTRAINT "RentContract_spaceFacilityId_fkey" FOREIGN KEY ("spaceFacilityId") REFERENCES "Facility"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentContractDocument" ADD CONSTRAINT "RentContractDocument_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "RentContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentAccrual" ADD CONSTRAINT "RentAccrual_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "RentContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentAccrual" ADD CONSTRAINT "RentAccrual_entrepreneurId_fkey" FOREIGN KEY ("entrepreneurId") REFERENCES "Entrepreneur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentPayment" ADD CONSTRAINT "RentPayment_accrualId_fkey" FOREIGN KEY ("accrualId") REFERENCES "RentAccrual"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentPayment" ADD CONSTRAINT "RentPayment_entrepreneurId_fkey" FOREIGN KEY ("entrepreneurId") REFERENCES "Entrepreneur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receivable" ADD CONSTRAINT "Receivable_relatedProjectId_fkey" FOREIGN KEY ("relatedProjectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receivable" ADD CONSTRAINT "Receivable_relatedEntrepreneurId_fkey" FOREIGN KEY ("relatedEntrepreneurId") REFERENCES "Entrepreneur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receivable" ADD CONSTRAINT "Receivable_relatedOrganizationId_fkey" FOREIGN KEY ("relatedOrganizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonOrganizationMembership" ADD CONSTRAINT "PersonOrganizationMembership_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonOrganizationMembership" ADD CONSTRAINT "PersonOrganizationMembership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntrepreneurOrganization" ADD CONSTRAINT "EntrepreneurOrganization_entrepreneurId_fkey" FOREIGN KEY ("entrepreneurId") REFERENCES "Entrepreneur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntrepreneurOrganization" ADD CONSTRAINT "EntrepreneurOrganization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StakeholderRelationship" ADD CONSTRAINT "StakeholderRelationship_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StakeholderRelationship" ADD CONSTRAINT "StakeholderRelationship_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiChangeSet" ADD CONSTRAINT "AiChangeSet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

