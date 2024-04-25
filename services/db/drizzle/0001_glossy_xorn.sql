CREATE TABLE IF NOT EXISTS "aiMessageBoardAnswers" (
	"id" text PRIMARY KEY NOT NULL,
	"messageId" text NOT NULL,
	"transcriptId" text NOT NULL,
	"relevantTranscript" text,
	"attemptedAnswer" text NOT NULL,
	"createdAt" double precision
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aiMessageBoardAnswers" ADD CONSTRAINT "aiMessageBoardAnswers_messageId_campMessage_id_fk" FOREIGN KEY ("messageId") REFERENCES "campMessage"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aiMessageBoardAnswers" ADD CONSTRAINT "aiMessageBoardAnswers_transcriptId_transcribeGroup_id_fk" FOREIGN KEY ("transcriptId") REFERENCES "transcribeGroup"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
