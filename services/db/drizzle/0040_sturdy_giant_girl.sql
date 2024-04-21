ALTER TABLE "transcription" ALTER COLUMN "text" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "transcription" ADD COLUMN "createdAt" double precision NOT NULL;