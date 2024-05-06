import {
  campMember,
  campMembersWithoutUserInsertSchema,
  campSchema,
  user,
  eq,
  getTableColumns,
  count,
  sql,
  and,
  campMessageInsertSchema,
  campMessage,
  questionSchema,
  question,
  questionOption,
  asc,
  questionAnswer,
  type QuestionAnswer,
  questionAnswerSchema,
  db,
  transcribeJob,
  transcription,
  camp,
  transcribeGroup,
  desc,
} from "@fireside/db";
import { ProtectedElysia } from "./lib";

import { t, type Static } from "elysia";
import type { ElysiaWS } from "elysia/ws";

const createQuestionBodySchema = t.Object({
  question: questionSchema,
  questionOptions: t.Array(t.String()),
});

const questionSchema2 = t.Object({
  questionText: t.String(),
  dateOfCreation: t.String(),
  startTime: t.String(),
  endTime: t.String(),
  campId: t.String(),
});

const createQuestionBodySchema2 = t.Object({
  question: questionSchema2,
  questionOptions: t.Array(t.String()),
});

type Socket = { id: string; send: (...args: unknown[]) => void };
type CampId = string;

const pollSocketsRef: { current: Record<CampId, Array<Socket>> } = {
  current: {},
};

export type CreateQuestionBodyOpts = Static<typeof createQuestionBodySchema2>;

const createQuestionAnswerSchema = t.Object({
  answer: t.String(),
  questionId: t.String(),
  userId: t.String(),
});
export type CreateAnswerBodyOpts = Static<typeof createQuestionAnswerSchema>;
import type { ServerWebSocket } from "bun";

export const getAudioRoom = ({
  broadcasterId,
  campId,
  receiverId,
}: {
  campId: string;
  broadcasterId: string;
  receiverId: string;
}) => `audio/${campId}/${broadcasterId}/${receiverId}`;

const transcribeMessageSchema = t.Object({
  kind: t.Literal("update"),
  jobId: t.String(),
  text: t.String(),
  createdAt: t.Number(),
});

export type TranscribeMessageSchema = Static<typeof transcribeMessageSchema>;

export const campRouter = ProtectedElysia({ prefix: "/camp" })
  .get(
    "/question-information/:campId",
    async ({ params }) => {
      // retrieve questions for current camp
      const campQuestions = await db
        .select()
        .from(question)
        .where(eq(question.campId, params.campId));

      // retrieve answers for each question
      const questionsWithAnswers = await Promise.all(
        campQuestions.map(async (question) => {
          const answers = await db
            .select()
            .from(questionAnswer)
            .where(eq(questionAnswer.questionId, question.id));

          return {
            question: question,
            answers: answers,
          };
        })
      );

      return questionsWithAnswers;
    },
    {
      params: t.Object({
        campId: t.String(),
      }),
    }
  )

  .ws("/retrieve-questions/:campId", {
    idleTimeout: 1000 * 1000,

    params: t.Object({
      campId: t.String(),
    }),

    body: t.Union([t.Object({ kind: t.Literal("subscribe-to-events") })]),

    open: (ws) => {
      console.log("OPEN", ws.id);

      const prev = pollSocketsRef.current[ws.data.params.campId] ?? [];

      pollSocketsRef.current[ws.data.params.campId] = [...prev, ws];
    },
    close: (ws) => {
      console.log("CLOSE", ws.id);
      // ws.unsubscribe(`retrieve-questions-${ws.data.params.campId}`)
      // pollSocketsRef.current = pollSocketsRef.current.filter(s => s.id !== ws.id)

      pollSocketsRef.current[ws.data.params.campId] = pollSocketsRef.current[
        ws.data.params.campId
      ].filter((socket) => socket.id !== ws.id);
    },
    message: async (ws, body) => {},
  })
  .post(
    "/question-answer",
    async ({ body }) => {
      // check if user already answered question
      const campAnswers = await db
        .select()
        .from(questionAnswer)
        .where(
          eq(questionAnswer.userId, body.userId) &&
            eq(questionAnswer.userId, body.userId)
        );

      if (campAnswers.length > 0) {
        throw new Error("Already answered question.");
      }

      const createdAnswer = (
        await db.insert(questionAnswer).values(body).returning()
      )[0];

      return { answer: createdAnswer };
    },
    {
      body: questionAnswerSchema,
    }
  )
  .post(
    "/create-question",
    async ({ body }) => {
      // console.log("STARTING TIME RECEIVED: ", new Date(body.question.startTime).toLocaleTimeString())
      // console.log("ENDING TIME RECEIVED: ", new Date(body.question.endTime).toLocaleTimeString())

      const createdQuestion = (
        await db.insert(question).values(body.question).returning()
      )[0];
      return Promise.all(
        body.questionOptions.map((answer) =>
          db.insert(questionOption).values({
            questionId: createdQuestion.id,
            optionText: answer,
          })
        )
      );
    },
    {
      body: createQuestionBodySchema,
    }
  )
  .get(
    "/retrieve/:campId",
    async ({ params }) =>
      (await db.select().from(camp).where(eq(camp.id, params.campId)))[0],
    {
      params: t.Object({
        campId: t.String(),
      }),
    }
  )
  .post(
    "/create",
    async ({ body, user }) => {
      const createdCamp = (await db.insert(camp).values(body).returning())[0];

      const createdCampMemberCount =
        (
          await db
            .select({ count: count() })
            .from(campMember)
            .where(eq(campMember.campId, createdCamp.id))
        )[0].count + 1;

      const createdCampMember = (
        await db
          .insert(campMember)
          .values({
            campId: createdCamp.id,
            userId: user.id,
          })
          .returning()
      )[0];

      return {
        ...createdCamp,
        count: createdCampMemberCount,
        campMember: createdCampMember,
        user,
      };
    },
    {
      body: campSchema,
    }
  )
  .post(
    "/join/:campId",
    async ({ params, user, set }) => {
      const existingCamp = (
        await db
          .select()
          .from(campMember)
          .where(
            and(
              eq(campMember.userId, user.id),
              eq(campMember.campId, params.campId)
            )
          )
      ).at(0);
      if (existingCamp) {
        set.status = 409;
        throw new Error("Already in camp");
      }
      const newCampMember = (
        await db
          .insert(campMember)
          .values({ campId: params.campId, userId: user.id })
          .returning()
      )[0];

      const joinedCamp = (
        await db.select().from(camp).where(eq(camp.id, newCampMember.campId))
      )[0];

      return { ...joinedCamp, user, campMember: newCampMember };
    },
    {
      params: t.Object({
        campId: t.String(),
      }),
    }
  )
  .get("/retrieve/me", (ctx) =>
    db
      .select({
        ...getTableColumns(camp),
        user: cleanedUserCols,
        campMember: getTableColumns(campMember),
      })
      .from(campMember)
      .innerJoin(camp, eq(camp.id, campMember.campId))
      .innerJoin(user, eq(campMember.userId, user.id))
      .where(eq(campMember.userId, ctx.user.id))
  )
  .get("/retrieve", async () => {
    const res = await db
      .select({
        ...getTableColumns(camp),
        count: sql<number>`cast(count(${campMember.campId}) as int)`,
      })
      .from(camp)
      .leftJoin(campMember, eq(camp.id, campMember.campId))
      .groupBy(camp.id);

    return res;
  })
  .ws("/audio/:campId", {
    message: async (ws, data) => {
      if ((data as { kind: string }).kind === "user-joined") {
        ws.publish(`audio-${ws.data.params.campId}`, {
          kind: "user-joined",
          userId: ws.data.user.id,
        });
        return;
      }
      if ((data as { kind: string }).kind === "join-channel-request") {
        ws.publish(`audio-${ws.data.params.campId}`, {
          kind: "join-channel-request",
          userId: ws.data.user.id,
          ...(data as any),
        });
        ws.subscribe(
          getAudioRoom({
            broadcasterId: (data as { broadcasterId: string }).broadcasterId,
            campId: ws.data.params.campId,
            receiverId: (data as { receiverId: string }).receiverId,
          })
        );
      }

      if ((data as { kind: string }).kind === "join-channel-response") {
        ws.subscribe(
          getAudioRoom({
            broadcasterId: (data as { broadcasterId: string }).broadcasterId,
            campId: ws.data.params.campId,
            receiverId: (data as { receiverId: string }).receiverId,
          })
        );
      }

      if ((data as { kind: string }).kind === "ended-broadcast") {
        ws.publish(`audio-${ws.data.params.campId}`, {
          kind: "ended-broadcast",
          userId: ws.data.user.id,
        });
      }

      // if ((data as { kind: string }).kind === "user-joined") {
      //   ws.publish(`audio-${ws.data.params.campId}`, {
      //     kind: "user-joined",
      //     userId: ws.data.user.id,
      //   });
      // }

      if ((data as { kind: string }).kind === "leave-channel-request") {
        ws.publish(
          getAudioRoom({
            broadcasterId: (data as { broadcasterId: string }).broadcasterId,
            campId: ws.data.params.campId,
            receiverId: (data as { receiverId: string }).receiverId,
          }),
          {
            ...(data as any),
            userId: ws.data.user.id,
          }
        );
        ws.unsubscribe(
          getAudioRoom({
            broadcasterId: (data as { broadcasterId: string }).broadcasterId,
            campId: ws.data.params.campId,
            receiverId: (data as { receiverId: string }).receiverId,
          })
        );
      }

      if ((data as { kind: string }).kind === "started-broadcast") {
        ws.publish(`audio-${ws.data.params.campId}`, {
          kind: "started-broadcast",
          userId: ws.data.user.id,
        });
      }

      ws.publish(
        getAudioRoom({
          broadcasterId: (data as { broadcasterId: string }).broadcasterId,
          campId: ws.data.params.campId,
          receiverId: (data as { receiverId: string }).receiverId,
        }),
        {
          ...(data as any),
          userId: ws.data.user.id,
        }
      );
    },
    open: (ws) => {
      ws.subscribe(`audio-${ws.data.params.campId}`);

      // ws.publish(`audio-${ws.data.params.campId}`, {
      //   kind: "user-joined",
      //   userId: ws.data.user.id,
      // });
    },
    close: (ws) => {
      ws.publish(`audio-${ws.data.params.campId}`, {
        kind: "user-left",
        userId: ws.data.user.id,
      });
    },
    params: t.Object({
      campId: t.String(),
    }),
    body: t.Unknown(),
  })
  // .guard((app) =>
  //   app

  // .derive(
  //   async ({ params, set }: { params: { campId: string }; set: any }) => {
  //     console.log("dub");
  //     const currCamp = (
  //       await db.select().from(camp).where(eq(camp.id, params.campId))
  //     ).at(0);

  //     if (!currCamp) {
  //       // console.log("EL LOLLLL");
  //       set.status = 400;
  //       throw new Error("must have a camp");
  //     }

  //     // console.log("returning smile");

  //     return { camp: currCamp };
  //   }
  // )
  .post("/transcribe/group/create/:campId", ({ params }) =>
    db.insert(transcribeGroup).values({
      campId: params.campId,
    })
  )
  .get("/transcribe/group/retrieve/:campId", async ({ params }) =>
    (
      await db
        .select()
        .from(transcribeGroup)
        .where(eq(transcribeGroup.campId, params.campId))
        .orderBy(desc(transcribeGroup.createdAt))
        .limit(1)
    ).at(0)
  )
  .ws("/transcribe/:groupId", {
    params: t.Object({
      groupId: t.String(),
    }),
    body: t.Union([
      t.Object({
        jobId: t.String(),
        text: t.String(),
      }),
    ]),

    open: async (ws) => {
      ws.subscribe(`transcription-${ws.data.params.groupId}`);
    },

    message: async (ws, data) => {
      // if (ws.data.user.id !== ws.data.camp.createdBy) {
      //   ws.close();
      //   return;
      // }
      let existingJob = await db
        .select()
        .from(transcribeJob)
        .where(eq(transcribeJob.id, data.jobId));

      if (existingJob.length === 0) {
        existingJob = await db
          .insert(transcribeJob)
          .values({
            id: data.jobId,
            transcribeGroupId: ws.data.params.groupId,
          })
          .returning();
      }

      const insertedTranscription = await db
        .insert(transcription)
        .values({
          // campId: ws.data.params.campId,
          jobId: data.jobId,
          text: data.text,
        })
        .returning()
        .then((data) => data[0]);

      ws.publish(`transcription-${ws.data.params.groupId}`, {
        ...data,
        id: insertedTranscription.id,
        createdAt: insertedTranscription.createdAt,
      });

      return;
    },
  })
  // )
  .get(
    "/transcribe/retrieve/:groupId",
    async ({ params }) => {
      const res = await db
        .select()
        .from(transcribeGroup)
        .where(eq(transcribeGroup.id, params.groupId))
        .innerJoin(
          transcribeJob,
          eq(transcribeGroup.id, transcribeJob.transcribeGroupId)
        )
        .innerJoin(transcription, eq(transcribeJob.id, transcription.jobId));

      return res;
    },

    { params: t.Object({ groupId: t.String() }) }
  );

export const {
  token: tk,
  password: pwd,
  ...cleanedUserCols
} = getTableColumns(user);
// const getCampsWithCount = ({}:{campId:string,camMember}) => {}

(async () => {
  while (true) {
    await new Promise((res) => {
      setTimeout(() => {
        res(null);
      }, 500);
    });

    const campsThatNeedInfo = Object.keys(pollSocketsRef.current);

    campsThatNeedInfo.forEach(async (campId) => {
      const campsQuestions = await db
        .select()
        .from(question)
        .where(eq(question.campId, campId))
        .orderBy(asc(question.startTime));

      const validQuestion = campsQuestions
        .filter(({ startTime, endTime }) => {
          return (
            Date.now() - new Date(startTime).getTime() > 0 &&
            Date.now() - new Date(endTime).getTime() < 0
          );
        })
        .at(0);

      const questionOptions = validQuestion
        ? await db
            .select()
            .from(questionOption)
            .where(eq(questionOption.questionId, validQuestion.id))
        : null;
      pollSocketsRef.current[campId].forEach((socket) => {
        if (questionOptions) {
          socket.send({
            kind: "exists",
            questionOptions,
            validQuestion,
          });
        } else {
          socket.send({
            kind: "not-exists",
          });
        }
      });
    });
  }
})().catch((e) => {
  console.log("handled exception", e);
});

// has it come out yet?
