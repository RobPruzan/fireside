CREATE TABLE IF NOT EXISTS "whiteBoardImg" (
	"id" text PRIMARY KEY NOT NULL,
	"whiteBoardId" uuid,
	"imgUrl" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "whiteBoardImg" ADD CONSTRAINT "whiteBoardImg_whiteBoardId_whiteBoard_id_fk" FOREIGN KEY ("whiteBoardId") REFERENCES "whiteBoard"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
