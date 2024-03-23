ALTER TABLE "userMessageReaction" DROP CONSTRAINT "userMessageReaction_messageId_user_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "userMessageReaction" ADD CONSTRAINT "userMessageReaction_messageId_campMessage_id_fk" FOREIGN KEY ("messageId") REFERENCES "campMessage"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
