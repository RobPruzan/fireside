import {
  getTableColumns,
  campMessage,
  eq,
  user,
  campMessageInsertSchema,
  count,
  userMessageReaction,
  and,
  userMessageReactionInsertSchema,
  reactionAsset,
  campThread,
  requiredCampMessageInsertSchema,
  requiredThreadInsertSchema,
  db,
  safeUserSelectSchema,
  transcribeGroup,
  transcribeJob,
  desc,
  transcription,
  aiMessageBoardAnswers,
  campThreadMessage,
} from "@fireside/db";
import { t, type Static } from "elysia";

import { cleanedUserCols } from "./camp-endpoints";
import { ProtectedElysia } from "./lib";
import { createSelectSchema } from "drizzle-typebox";
import { createChatConfig, mistralClient } from "./mistral";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import { run } from "@fireside/utils";
const publishMessageSchema = t.Object({
  message: requiredCampMessageInsertSchema,
  thread: requiredThreadInsertSchema,
  user: safeUserSelectSchema,
});

export type PublishedMessage = Static<typeof publishMessageSchema>;

export const messageRouter = ProtectedElysia({ prefix: "/message" })
  .get(
    "/retrieve/:campId",
    async ({ params }) => {
      return db
        .select({
          ...getTableColumns(campMessage),
          user: cleanedUserCols,
        })
        .from(campMessage)
        .where(eq(campMessage.campId, params.campId))
        .innerJoin(user, eq(user.id, campMessage.userId));
    },
    {
      params: t.Object({
        campId: t.String(),
      }),
    }
  )

  .post(
    "/react/:reactionAssetId/:messageId",
    async (ctx) => {
      const userReactionsOnMessage = await db
        .select()
        .from(userMessageReaction)
        .where(
          and(
            eq(userMessageReaction.messageId, ctx.params.messageId),
            eq(userMessageReaction.userId, ctx.user.id)
          )
        );

      if (
        userReactionsOnMessage.some(
          (reaction) => reaction.reactionAssetId === ctx.params.reactionAssetId
        )
      ) {
        throw ctx.error("Bad Request");
      }
      // need special logic for unliking on dislike later
      // if (userReactionsOnMessage.some(reaction => ))

      // const hasDislikedQuery = (await db.select().from(userMessageReaction))

      return db.insert(userMessageReaction).values({
        messageId: ctx.params.messageId,
        userId: ctx.user.id,
        reactionAssetId: ctx.params.reactionAssetId,
        id: ctx.body.id,
      });
    },
    {
      params: userMessageReactionInsertSchema,
      body: t.Pick(userMessageReactionInsertSchema, ["id"]),
    }
  )
  .get(
    "/react/retrieve/:campId",
    (ctx) =>
      db
        .select({
          ...getTableColumns(userMessageReaction),
          campId: campMessage.campId,
        })
        .from(userMessageReaction)
        .innerJoin(
          campMessage,
          eq(campMessage.id, userMessageReaction.messageId)
        )
        .where(eq(campMessage.campId, ctx.params.campId)),
    {
      params: t.Object({
        campId: t.String(),
      }),
    }
  )
  .get("/assets/react", () => db.select().from(reactionAsset))
  .post(
    "/react/remove/:reactionId",
    (ctx) =>
      db
        .delete(userMessageReaction)
        .where(eq(userMessageReaction.id, ctx.params.reactionId)),
    {
      params: t.Object({
        reactionId: t.String(),
      }),
    }
  )
  .ws("/ws/:campId", {
    body: publishMessageSchema,
    params: t.Object({
      campId: t.String(),
    }),
    open: (ws) => {
      ws.subscribe(`camp-${ws.data.params.campId}`);
    },
    close: (ws) => {
      ws.unsubscribe(`camp-${ws.data.params.campId}`);
    },
    message: async (ws, data) => {
      // message must exist before the thread is created
      const messageObj = await db
        .insert(campMessage)
        .values({ ...data.message, userId: ws.data.user.id })
        .returning()
        .then((data) => data[0]);

      const threadObj = await db
        .insert(campThread)
        .values({ ...data.thread, createdBy: ws.data.user.id })
        .returning()
        .then((data) => data[0]);

      Promise.resolve().then(async () => {
        console.log("CALLING PROMISE RESOLVE");
        const transcriptionGroupRes = (
          await db
            .select()
            .from(transcribeGroup)
            .where(eq(transcribeGroup.campId, ws.data.params.campId))
            .orderBy(desc(transcribeGroup.createdAt))
            .limit(1)
        ).at(0);

        if (!transcriptionGroupRes) {
          return;
        }

        const transcriptRes = await db
          .select()
          .from(transcribeGroup)
          .innerJoin(
            transcribeJob,
            eq(transcribeJob.transcribeGroupId, transcribeGroup.id)
          )
          .innerJoin(transcription, eq(transcription.jobId, transcribeJob.id))
          .where(eq(transcribeGroup.id, transcriptionGroupRes.id));

        const retryCall = async (retries = 5) => {
          try {
            const transcriptionText = transcriptRes
              .map(({ transcription }) => transcription.text)
              .join("\n");

            const chatConfig = createChatConfig({
              question: messageObj.message,
              transcript: transcriptionText,
            });

            let responseJsonString = (await mistralClient.chat(chatConfig))
              .choices[0].message.content;
            const json = JSON.parse(responseJsonString);
            console.log("GOT MISTRAL RESPONSE ->", responseJsonString);
            const jsonSchema = t.Union([
              t.Object({
                relevantTranscript: t.String(),
                attemptedAnswer: t.String(),
                kind: t.Literal("found"),
              }),
              t.Object({
                kind: t.Literal("not-found"),
                attemptedAnswer: t.String(),
              }),
            ]);

            const compiler = TypeCompiler.Compile(jsonSchema);

            const isValid = compiler.Check(json);

            if (!isValid) {
              console.log("gg");
              throw compiler.Errors;
            }

            const aiMessageBoardAnswerRes = await db
              .insert(aiMessageBoardAnswers)
              .values({
                threadId: threadObj.id,
                transcriptGroupId: transcriptionGroupRes.id,
                attemptedAnswer: json.attemptedAnswer,
                ...("relevantTranscript" in json
                  ? { relevantTranscript: json.relevantTranscript }
                  : {}),
              })
              .returning()
              .then((data) => data[0]);

            const existingThread = await db
              .select()
              .from(campThread)
              .where(eq(campThread.parentMessageId, messageObj.id))
              .then((data) => data[0]);
            const newThreadMessage = run(() => {
              switch (json.kind) {
                case "found": {
                  return `Relevant Transcript: ${json.relevantTranscript} \n\nAttempted Answer: ${json.attemptedAnswer}`;
                }
                case "not-found": {
                  return `Attempted Answer: ${json.attemptedAnswer}`;
                }
              }
            });

            console.log("new thread message", newThreadMessage);
            await db.insert(campThreadMessage).values({
              threadId: existingThread.id,
              message: newThreadMessage,
              userId: "ai-corbin",
            });
            //   const newThread = db.insert(campThread).values({

            // })
            console.log("CREATED OBJECT", aiMessageBoardAnswerRes);
            // return {
            //   kind: "success" as const,
            //   ...aiMessageBoardAnswerRes,
            // };
          } catch (e) {
            console.log(e);
            if (retries === 0) {
              return null;
            } else {
              retryCall(retries - 1);
            }
          }
        };

        retryCall();
      });

      ws.publish(`camp-${ws.data.params.campId}`, data);
    },
  });

export type UserConnectedToCamp = {
  userId: string;
  joinedAt: string;
};
