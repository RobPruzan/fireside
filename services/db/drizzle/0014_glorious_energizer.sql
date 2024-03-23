ALTER TABLE "userLikedMessages" RENAME TO "userUpVotedMessages";--> statement-breakpoint
ALTER TABLE "userUpVotedMessages" DROP CONSTRAINT "userLikedMessages_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "userUpVotedMessages" DROP CONSTRAINT "userLikedMessages_messageId_user_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "userUpVotedMessages" ADD CONSTRAINT "userUpVotedMessages_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "userUpVotedMessages" ADD CONSTRAINT "userUpVotedMessages_messageId_user_id_fk" FOREIGN KEY ("messageId") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
