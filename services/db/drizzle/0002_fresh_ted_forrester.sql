CREATE TABLE IF NOT EXISTS "friend" (
	"id" uuid
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "friend" ADD CONSTRAINT "friend_id_user_id_fk" FOREIGN KEY ("id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
