CREATE TABLE IF NOT EXISTS "userLikedMessages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"messageId" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "campMessage" ADD COLUMN "parentMessageId" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "campMessage" ADD CONSTRAINT "campMessage_parentMessageId_campMessage_id_fk" FOREIGN KEY ("parentMessageId") REFERENCES "campMessage"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "userLikedMessages" ADD CONSTRAINT "userLikedMessages_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "userLikedMessages" ADD CONSTRAINT "userLikedMessages_messageId_user_id_fk" FOREIGN KEY ("messageId") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
