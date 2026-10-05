-- Program assignments can now record tracks that are not a Program row
-- (TEKMER yer edinme, or an "other" track typed by the admin).
ALTER TABLE "EntrepreneurProgram" ALTER COLUMN "programId" DROP NOT NULL;
ALTER TABLE "EntrepreneurProgram" ADD COLUMN "programLabel" TEXT;
