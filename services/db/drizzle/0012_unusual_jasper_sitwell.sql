CREATE TABLE IF NOT EXISTS "campMessageLikes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"messageId" uuid NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "campMessageLikes" ADD CONSTRAINT "campMessageLikes_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "campMessageLikes" ADD CONSTRAINT "campMessageLikes_messageId_campMessage_id_fk" FOREIGN KEY ("messageId") REFERENCES "campMessage"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
