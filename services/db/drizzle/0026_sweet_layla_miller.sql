CREATE TABLE IF NOT EXISTS "connectToCamp" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "messageWhiteBoard" (
	"id" text PRIMARY KEY NOT NULL,
	"messageId" uuid NOT NULL,
	"whiteBoardId" uuid NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messageWhiteBoard" ADD CONSTRAINT "messageWhiteBoard_messageId_campMessage_id_fk" FOREIGN KEY ("messageId") REFERENCES "campMessage"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messageWhiteBoard" ADD CONSTRAINT "messageWhiteBoard_whiteBoardId_whiteBoard_id_fk" FOREIGN KEY ("whiteBoardId") REFERENCES "whiteBoard"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
