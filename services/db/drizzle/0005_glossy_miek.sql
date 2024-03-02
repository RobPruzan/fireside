ALTER TABLE "campMembers" RENAME TO "campMember";--> statement-breakpoint
ALTER TABLE "campMember" DROP CONSTRAINT "campMembers_camp_id_camp_id_fk";
--> statement-breakpoint
ALTER TABLE "campMember" DROP CONSTRAINT "campMembers_user_id_user_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "campMember" ADD CONSTRAINT "campMember_camp_id_camp_id_fk" FOREIGN KEY ("camp_id") REFERENCES "camp"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "campMember" ADD CONSTRAINT "campMember_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
