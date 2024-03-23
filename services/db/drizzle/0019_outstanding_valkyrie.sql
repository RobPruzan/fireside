ALTER TABLE "userMessageReaction" RENAME COLUMN "reactionId" TO "reactionAssetId";--> statement-breakpoint
ALTER TABLE "userMessageReaction" DROP CONSTRAINT "userMessageReaction_reactionId_reactionAsset_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "userMessageReaction" ADD CONSTRAINT "userMessageReaction_reactionAssetId_reactionAsset_id_fk" FOREIGN KEY ("reactionAssetId") REFERENCES "reactionAsset"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
