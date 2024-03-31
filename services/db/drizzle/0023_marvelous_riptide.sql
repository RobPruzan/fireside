CREATE TABLE IF NOT EXISTS "whiteBoardPoint" (
	"id" text PRIMARY KEY NOT NULL,
	"whiteBoardPointGroupId" text,
	"x" double precision NOT NULL,
	"y" double precision NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "whiteBoardPoint" ADD CONSTRAINT "whiteBoardPoint_whiteBoardPointGroupId_whiteBoardPointGroup_id_fk" FOREIGN KEY ("whiteBoardPointGroupId") REFERENCES "whiteBoardPointGroup"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
