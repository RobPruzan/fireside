CREATE TABLE IF NOT EXISTS "whiteBoardErased" (
	"id" text PRIMARY KEY NOT NULL,
	"x" double precision NOT NULL,
	"y" double precision NOT NULL,
	"whiteBoardId" uuid,
	"kind" text NOT NULL,
	"userId" uuid NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "whiteBoardErased" ADD CONSTRAINT "whiteBoardErased_whiteBoardId_whiteBoard_id_fk" FOREIGN KEY ("whiteBoardId") REFERENCES "whiteBoard"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "whiteBoardErased" ADD CONSTRAINT "whiteBoardErased_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
