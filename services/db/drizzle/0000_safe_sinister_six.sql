CREATE TABLE IF NOT EXISTS "bonfire" (
	"id" text PRIMARY KEY NOT NULL,
	"camp_id" text NOT NULL,
	"name" text NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "camp" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updated_at" timestamp,
	"createdBy" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "campMember" (
	"id" text PRIMARY KEY NOT NULL,
	"camp_id" text NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "campMessage" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"campId" text NOT NULL,
	"message" text NOT NULL,
	"createdAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "campThread" (
	"id" text PRIMARY KEY NOT NULL,
	"createdBy" text NOT NULL,
	"campMessage" text NOT NULL,
	"createdAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "campThreadMessage" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"threadId" text NOT NULL,
	"message" text NOT NULL,
	"createdAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "connectToCamp" (
	"id" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "friend" (
	"id" text PRIMARY KEY NOT NULL,
	"userOneId" text,
	"userTwoId" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "friendRequest" (
	"id" text PRIMARY KEY NOT NULL,
	"fromUserId" text NOT NULL,
	"toUserId" text NOT NULL,
	"deleted" boolean DEFAULT false,
	"createdAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "messageWhiteBoard" (
	"id" text PRIMARY KEY NOT NULL,
	"messageId" text NOT NULL,
	"whiteBoardId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reactionAsset" (
	"id" text PRIMARY KEY NOT NULL,
	"imgSrc" text NOT NULL,
	"alt" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "token" (
	"id" text PRIMARY KEY NOT NULL,
	"expires" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transcribeGroup" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" double precision NOT NULL,
	"campID" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "job" (
	"id" text PRIMARY KEY NOT NULL,
	"transcribeGroupId" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transcription" (
	"id" text PRIMARY KEY NOT NULL,
	"transcribeJobId" text,
	"text" text NOT NULL,
	"createdAt" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"token" text,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "userMessageReaction" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"messageId" text NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"reactionAssetId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "userToBonfire" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"bonfireId" text NOT NULL,
	"createdAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "whiteBoard" (
	"id" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "whiteBoardErased" (
	"id" text PRIMARY KEY NOT NULL,
	"x" double precision NOT NULL,
	"y" double precision NOT NULL,
	"whiteBoardId" text,
	"kind" text NOT NULL,
	"userId" text NOT NULL,
	"createdAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "whiteBoardImg" (
	"id" text PRIMARY KEY NOT NULL,
	"whiteBoardId" text,
	"imgUrl" text NOT NULL,
	"x" double precision NOT NULL,
	"y" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "whiteBoardMouseSchema" (
	"id" text PRIMARY KEY NOT NULL,
	"x" double precision NOT NULL,
	"y" double precision NOT NULL,
	"whiteBoardId" text,
	"kind" text NOT NULL,
	"userId" text NOT NULL,
	"createdAt" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "whiteBoardPoint" (
	"id" text PRIMARY KEY NOT NULL,
	"whiteBoardPointGroupId" text,
	"x" double precision NOT NULL,
	"y" double precision NOT NULL,
	"kind" text NOT NULL,
	"createdAt" double precision
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "whiteBoardPointGroup" (
	"id" text PRIMARY KEY NOT NULL,
	"color" text NOT NULL,
	"whiteBoardId" text
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bonfire" ADD CONSTRAINT "bonfire_camp_id_camp_id_fk" FOREIGN KEY ("camp_id") REFERENCES "camp"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "camp" ADD CONSTRAINT "camp_createdBy_user_id_fk" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
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
--> statement-breakpoint
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
--> statement-breakpoint
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
 ALTER TABLE "friendRequest" ADD CONSTRAINT "friendRequest_fromUserId_user_id_fk" FOREIGN KEY ("fromUserId") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "friendRequest" ADD CONSTRAINT "friendRequest_toUserId_user_id_fk" FOREIGN KEY ("toUserId") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
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
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transcribeGroup" ADD CONSTRAINT "transcribeGroup_campID_camp_id_fk" FOREIGN KEY ("campID") REFERENCES "camp"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "job" ADD CONSTRAINT "job_transcribeGroupId_transcribeGroup_id_fk" FOREIGN KEY ("transcribeGroupId") REFERENCES "transcribeGroup"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transcription" ADD CONSTRAINT "transcription_transcribeJobId_job_id_fk" FOREIGN KEY ("transcribeJobId") REFERENCES "job"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user" ADD CONSTRAINT "user_token_token_id_fk" FOREIGN KEY ("token") REFERENCES "token"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "userMessageReaction" ADD CONSTRAINT "userMessageReaction_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "userMessageReaction" ADD CONSTRAINT "userMessageReaction_messageId_campMessage_id_fk" FOREIGN KEY ("messageId") REFERENCES "campMessage"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "userMessageReaction" ADD CONSTRAINT "userMessageReaction_reactionAssetId_reactionAsset_id_fk" FOREIGN KEY ("reactionAssetId") REFERENCES "reactionAsset"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "userToBonfire" ADD CONSTRAINT "userToBonfire_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "userToBonfire" ADD CONSTRAINT "userToBonfire_bonfireId_bonfire_id_fk" FOREIGN KEY ("bonfireId") REFERENCES "bonfire"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
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
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "whiteBoardImg" ADD CONSTRAINT "whiteBoardImg_whiteBoardId_whiteBoard_id_fk" FOREIGN KEY ("whiteBoardId") REFERENCES "whiteBoard"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "whiteBoardMouseSchema" ADD CONSTRAINT "whiteBoardMouseSchema_whiteBoardId_whiteBoard_id_fk" FOREIGN KEY ("whiteBoardId") REFERENCES "whiteBoard"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "whiteBoardMouseSchema" ADD CONSTRAINT "whiteBoardMouseSchema_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "whiteBoardPoint" ADD CONSTRAINT "whiteBoardPoint_whiteBoardPointGroupId_whiteBoardPointGroup_id_fk" FOREIGN KEY ("whiteBoardPointGroupId") REFERENCES "whiteBoardPointGroup"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "whiteBoardPointGroup" ADD CONSTRAINT "whiteBoardPointGroup_whiteBoardId_whiteBoard_id_fk" FOREIGN KEY ("whiteBoardId") REFERENCES "whiteBoard"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
