CREATE TABLE IF NOT EXISTS "camp" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "campMembers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"camp_id" uuid,
	"user_id" uuid
);
--> statement-breakpoint
ALTER TABLE "friend" DROP CONSTRAINT "friend_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "friend" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "friend" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "friend" ALTER COLUMN "id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "friend" ADD COLUMN "userOneId" uuid;--> statement-breakpoint
ALTER TABLE "friend" ADD COLUMN "userTwoId" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "friend" ADD CONSTRAINT "friend_userOneId_user_id_fk" FOREIGN KEY ("userOneId") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "friend" ADD CONSTRAINT "friend_userTwoId_user_id_fk" FOREIGN KEY ("userTwoId") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "campMembers" ADD CONSTRAINT "campMembers_camp_id_camp_id_fk" FOREIGN KEY ("camp_id") REFERENCES "camp"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "campMembers" ADD CONSTRAINT "campMembers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
