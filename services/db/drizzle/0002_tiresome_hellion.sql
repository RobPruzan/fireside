ALTER TABLE "aiMessageBoardAnswers" DROP CONSTRAINT "aiMessageBoardAnswers_messageId_campMessage_id_fk";
--> statement-breakpoint
ALTER TABLE "aiMessageBoardAnswers" ADD COLUMN "threadId" text NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aiMessageBoardAnswers" ADD CONSTRAINT "aiMessageBoardAnswers_threadId_campThread_id_fk" FOREIGN KEY ("threadId") REFERENCES "campThread"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "aiMessageBoardAnswers" DROP COLUMN IF EXISTS "messageId";