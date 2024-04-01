CREATE TABLE IF NOT EXISTS "whiteBoardMouseSchema" (
	"id" text PRIMARY KEY NOT NULL,
	"x" double precision NOT NULL,
	"y" double precision NOT NULL,
	"whiteBoardId" uuid,
	"kind" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "whiteBoardPoint" ADD COLUMN "kind" text NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "whiteBoardMouseSchema" ADD CONSTRAINT "whiteBoardMouseSchema_whiteBoardId_whiteBoard_id_fk" FOREIGN KEY ("whiteBoardId") REFERENCES "whiteBoard"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
