CREATE TABLE IF NOT EXISTS "transcribeGroup" (
	"id" uuid PRIMARY KEY NOT NULL,
	"createdAt" double precision NOT NULL,
	"campID" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "job" (
	"id" uuid PRIMARY KEY NOT NULL,
	"transcribeGroupId" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transcriptionSchema" (
	"id" uuid PRIMARY KEY NOT NULL,
	"transcribeJobId" uuid,
	"text" text
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transcribeGroup" ADD CONSTRAINT "transcribeGroup_campID_camp_id_fk" FOREIGN KEY ("campID") REFERENCES "camp"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "job" ADD CONSTRAINT "job_transcribeGroupId_transcribeGroup_id_fk" FOREIGN KEY ("transcribeGroupId") REFERENCES "transcribeGroup"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transcriptionSchema" ADD CONSTRAINT "transcriptionSchema_transcribeJobId_job_id_fk" FOREIGN KEY ("transcribeJobId") REFERENCES "job"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
