CREATE TABLE IF NOT EXISTS "whiteBoardPointGroup" (
	"id" text PRIMARY KEY NOT NULL,
	"color" text NOT NULL,
	"whiteBoardId" uuid
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "whiteBoardPointGroup" ADD CONSTRAINT "whiteBoardPointGroup_whiteBoardId_whiteBoard_id_fk" FOREIGN KEY ("whiteBoardId") REFERENCES "whiteBoard"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
