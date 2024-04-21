ALTER TABLE "transcriptionSchema" RENAME TO "transcription";--> statement-breakpoint
ALTER TABLE "transcription" DROP CONSTRAINT "transcriptionSchema_transcribeJobId_job_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transcription" ADD CONSTRAINT "transcription_transcribeJobId_job_id_fk" FOREIGN KEY ("transcribeJobId") REFERENCES "job"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
