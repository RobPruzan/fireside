CREATE TABLE IF NOT EXISTS "reaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"imgSrc" text,
	"alt" text
);
--> statement-breakpoint
ALTER TABLE "userUpVotedMessages" RENAME TO "userMessageReaction";--> statement-breakpoint
ALTER TABLE "userMessageReaction" DROP CONSTRAINT "userUpVotedMessages_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "userMessageReaction" DROP CONSTRAINT "userUpVotedMessages_messageId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "userMessageReaction" ADD COLUMN "reactionId" uuid NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "userMessageReaction" ADD CONSTRAINT "userMessageReaction_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "userMessageReaction" ADD CONSTRAINT "userMessageReaction_messageId_user_id_fk" FOREIGN KEY ("messageId") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "userMessageReaction" ADD CONSTRAINT "userMessageReaction_reactionId_reaction_id_fk" FOREIGN KEY ("reactionId") REFERENCES "reaction"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
