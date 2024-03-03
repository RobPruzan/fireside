CREATE TABLE IF NOT EXISTS "friendRequest" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fromUserId" uuid NOT NULL,
	"delete" boolean DEFAULT false
);
--> statement-breakpoint
ALTER TABLE "bonfire" ALTER COLUMN "camp_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "campMember" ALTER COLUMN "camp_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "campMember" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "userToBonfire" ALTER COLUMN "userId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "userToBonfire" ALTER COLUMN "bonfireId" SET NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "friendRequest" ADD CONSTRAINT "friendRequest_fromUserId_user_id_fk" FOREIGN KEY ("fromUserId") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
