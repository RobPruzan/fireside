CREATE TABLE IF NOT EXISTS "campThread" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdBy" uuid NOT NULL,
	"campMessage" uuid NOT NULL,
	"createdAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "campThreadMessage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"threadId" uuid NOT NULL,
	"message" text NOT NULL,
	"createdAt" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "campMessage" DROP CONSTRAINT "campMessage_parentMessageId_campMessage_id_fk";
--> statement-breakpoint
ALTER TABLE "campMessage" DROP COLUMN IF EXISTS "parentMessageId";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "campThread" ADD CONSTRAINT "campThread_createdBy_user_id_fk" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "campThread" ADD CONSTRAINT "campThread_campMessage_campMessage_id_fk" FOREIGN KEY ("campMessage") REFERENCES "campMessage"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "campThreadMessage" ADD CONSTRAINT "campThreadMessage_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "campThreadMessage" ADD CONSTRAINT "campThreadMessage_threadId_campThread_id_fk" FOREIGN KEY ("threadId") REFERENCES "campThread"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
