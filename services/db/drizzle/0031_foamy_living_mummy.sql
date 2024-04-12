ALTER TABLE "camp" ADD COLUMN "createdBy" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "camp" ADD CONSTRAINT "camp_createdBy_user_id_fk" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
