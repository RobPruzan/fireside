CREATE TABLE IF NOT EXISTS "campMessage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"campId" uuid NOT NULL,
	"message" text NOT NULL,
	"createdAt" timestamp NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "campMessage" ADD CONSTRAINT "campMessage_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "campMessage" ADD CONSTRAINT "campMessage_campId_camp_id_fk" FOREIGN KEY ("campId") REFERENCES "camp"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
