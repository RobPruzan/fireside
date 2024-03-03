ALTER TABLE "friendRequest" ADD COLUMN "toUserId" uuid NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "friendRequest" ADD CONSTRAINT "friendRequest_toUserId_user_id_fk" FOREIGN KEY ("toUserId") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
