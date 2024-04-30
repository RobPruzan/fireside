import { Static, Type as t } from "@sinclair/typebox";
import { InferSelectModel, SQL, sql } from "drizzle-orm";
import {
  serial,
  timestamp,
  pgTable,
  uuid,
  boolean,
  alias,
  integer,
  AnyPgTable,
  AnyPgColumn,
  text,
  doublePrecision,
  PgColumn,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { DatesToString } from "@fireside/utils";
import { nanoid } from "nanoid";
export const getOneYearAheadDate = () => {
  const currentDate = new Date();
  return new Date(
    currentDate.getFullYear() + 1,
    currentDate.getMonth(),
    currentDate.getDate()
  );
};
export const user = pgTable("user", {
  id: text("id")
    .$defaultFn(() => nanoid())
    .primaryKey(),
  displayName: text("name").notNull(),
  token: text("token").references(() => token.value),
  username: text("username").notNull(),
  password: text("password").notNull(),
  createdAt: timestamp("createdAt", { mode: "string", withTimezone: true })
    .$defaultFn(() => new Date().toISOString())
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }),
  // profilePictureSrc: text("imgSrc"),
});

export const userSelectSchema = createSelectSchema(user);

export const safeUserSelectSchema = t.Intersect([
  t.Omit(userSelectSchema, ["token", "password"]),
  t.Object({
    id: t.String(),
    createdAt: t.String(),
  }),
]);

// export const safeUserInsertSchema = createInsertSchema(user, {
//   token: t.Optional(t.Never()),
//   password: t.Optional(t.Never()),
// });

export type User = InferSelectModel<typeof user>;

export const token = pgTable("token", {
  value: text("id").primaryKey(),
  expires: timestamp("expires", { mode: "string" }).$defaultFn(() =>
    getOneYearAheadDate().toISOString()
  ),
});

export const user_to_user = pgTable("friend", {
  id: text("id")
    .$defaultFn(() => nanoid())
    .primaryKey(),
  userOneId: text("userOneId").references(() => user.id),
  userTwoId: text("userTwoId").references(() => user.id),
});

export const camp = pgTable("camp", {
  id: text("id")
    .$defaultFn(() => nanoid())
    .primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("createdAt", { mode: "string", withTimezone: true })
    .$defaultFn(() => new Date().toISOString())
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }),
  createdBy: text("createdBy")
    .references(() => user.id)
    .notNull(),
});

export type FiresideCamp = InferSelectModel<typeof camp>;

export const campSchema = createInsertSchema(camp);

// export function getISOFormatDateQuery(dateTimeColumn: PgColumn): SQL<string> {
//   // Using TO_CHAR in PostgreSQL to format the date in ISO 8601 format
//   return sql<string>`TO_CHAR(${dateTimeColumn}, 'YYYY-MM-DD"T"HH24:MI:SSTZ')`;
// }
export const campMessage = pgTable("campMessage", {
  id: text("id")
    .$defaultFn(() => nanoid())
    .primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
  campId: text("campId")
    .notNull()
    .references(() => camp.id),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt", { mode: "string", withTimezone: true })
    .$defaultFn(() => new Date().toISOString())
    .notNull(),
});

export const campThread = pgTable("campThread", {
  id: text("id")
    .$defaultFn(() => nanoid())
    .primaryKey(),
  createdBy: text("createdBy")
    .notNull()
    .references(() => user.id),
  parentMessageId: text("campMessage")
    .notNull()
    .references(() => campMessage.id),
  createdAt: timestamp("createdAt", { mode: "string", withTimezone: true })
    .$defaultFn(() => new Date().toISOString())
    .notNull(),
});

export const campThreadInsertSchema = createInsertSchema(campThread, {
  createdBy: t.Optional(t.Never()),
});

// export const requiredThreadInsertSchema = t.Required(campThreadInsertSchema);
export const requiredThreadInsertSchema = t.Intersect([
  t.Omit(t.Required(campThreadInsertSchema), ["createdBy"]), // make this whole mess a helper tbh
  t.Pick(campThreadInsertSchema, ["createdBy"]),
]);

export const campThreadMessage = pgTable("campThreadMessage", {
  id: text("id")
    .$defaultFn(() => nanoid())
    .primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
  threadId: text("threadId")
    .notNull()
    .references(() => campThread.id),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt", { mode: "string", withTimezone: true })
    .$defaultFn(() => new Date().toISOString())
    .notNull(),
});

export const campThreadMessageInsertSchema = createInsertSchema(
  campThreadMessage,
  {
    userId: t.Optional(t.Never()),
  }
);

export type CampMessage = InferSelectModel<typeof campMessage>;

export const campMessageInsertSchema = createInsertSchema(campMessage, {
  userId: t.Optional(t.Never()),
});

export const requiredCampMessageInsertSchema = t.Intersect([
  t.Omit(t.Required(campMessageInsertSchema), ["userId"]),
  t.Pick(campMessageInsertSchema, ["userId"]),
]);

export const campMember = pgTable("campMember", {
  id: text("id")
    .$defaultFn(() => nanoid())
    .primaryKey(),
  campId: text("camp_id")
    .references(() => camp.id)
    .notNull(),
  userId: text("user_id")
    .references(() => user.id)
    .notNull(),
});

export const campMembersInsertSchema = createInsertSchema(campMember, {
  userId: t.Optional(t.String()),
});

export const campMembersWithoutUserInsertSchema = createInsertSchema(
  campMember,
  {
    userId: t.Optional(t.String()),
  }
);

export const bonfire = pgTable("bonfire", {
  id: text("id")
    .$defaultFn(() => nanoid())
    .primaryKey(),
  campId: text("camp_id")
    .references(() => camp.id)
    .notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("createdAt", { mode: "string", withTimezone: true })
    .$defaultFn(() => new Date().toISOString())
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }),
});

export const bonfireInsertSchema = createInsertSchema(bonfire);

export const userToBonfire = pgTable("userToBonfire", {
  id: text("id")
    .$defaultFn(() => nanoid())
    .primaryKey(),
  userId: text("userId")
    .references(() => user.id)
    .notNull(),
  bonfireId: text("bonfireId")
    .references(() => bonfire.id)
    .notNull(),
  joinedAt: timestamp("createdAt", { mode: "string", withTimezone: true })
    .$defaultFn(() => new Date().toISOString())
    .notNull(),
});

export const friendRequest = pgTable("friendRequest", {
  id: text("id")
    .$defaultFn(() => nanoid())
    .primaryKey(),
  fromUserId: text("fromUserId")
    .references(() => user.id)
    .notNull(),
  toUserId: text("toUserId")
    .references(() => user.id)
    .notNull(),
  deleted: boolean("deleted").default(false),
  createdAt: timestamp("createdAt", { mode: "string", withTimezone: true })
    .$defaultFn(() => new Date().toISOString())
    .notNull(),
});
export type FriendRequest = InferSelectModel<typeof friendRequest>;

export const friend = pgTable("friend", {
  id: text("id")
    .$defaultFn(() => nanoid())
    .primaryKey(),
  userOneId: text("userOneId")
    .references(() => user.id)
    .notNull(),
  userTwoId: text("userTwoId")
    .references(() => user.id)
    .notNull(),
  // problem for later
  // createdAt: timestamp("createdAt", { mode: "string",withTimezone: true })
  //   .$defaultFn(() => new Date().toISOString())
  //   .notNull(),
});

export type Friend = InferSelectModel<typeof friend>;

export const userMessageReaction = pgTable("userMessageReaction", {
  id: text("id")
    .$defaultFn(() => nanoid())
    .primaryKey(),
  userId: text("userId")
    .references(() => user.id)
    .notNull(),
  messageId: text("messageId")
    .references(() => campMessage.id)
    .notNull(),
  createdAt: timestamp("createdAt", { mode: "string", withTimezone: true })
    .$defaultFn(() => new Date().toISOString())
    .notNull(),
  reactionAssetId: text("reactionAssetId")
    .references(() => reactionAsset.id)
    .notNull(),
});

export const userMessageReactionInsertSchema = createInsertSchema(
  userMessageReaction,
  {
    userId: t.Optional(t.Never()),
  }
);

export const reactionAsset = pgTable("reactionAsset", {
  id: text("id")
    .$defaultFn(() => nanoid())
    .primaryKey(),
  imgSrc: text("imgSrc").notNull(),
  alt: text("alt").notNull(),
});

export type Reaction = InferSelectModel<typeof reactionAsset>;

export const emojis = [
  {
    src: "/alien.png",
    alt: "Alien",
  },
  {
    src: "/check.png",
    alt: "Check",
  },
  {
    src: "/cool.png",
    alt: "Cool",
  },
  {
    src: "/party.png",
    alt: "Party",
  },
  {
    src: "/skull.png",
    alt: "Skull",
  },
  {
    src: "/smile.png",
    alt: "Smile",
  },
  {
    src: "/thinking.png",
    alt: "Thinking",
  },
  {
    src: "/dats-fire.jpg",
    alt: "Fire",
  },
  {
    src: "/punchy.gif",
    alt: "Punch",
  },
  {
    src: "/angry.png",
    alt: "Angry",
  },
  {
    src: "/peeky-titan-bro.png",
    alt: "Peeky titan bro",
  },
  { src: "/frieren-embarrassed.png", alt: "Frieren Embarrassed" },
  {
    src: "/fern.png",
    alt: "Fern smile",
  },
  {
    src: "/bocchi-bruh.png",
    alt: "Bocchi bruh",
  },
  {
    src: "/frieren-mimiced.png",
    alt: "Frieren mimiced",
  },
  {
    src: "/nobora-smirk.png",
    alt: "Nobora smirk",
  },

  {
    src: "/gojo-breathing.gif",
    alt: "Gojo breathing",
  },
  {
    src: "/nezuko-jumpin.gif",
    alt: "Nezuko jumpin",
  },
  {
    src: "/makima.gif",
    alt: "Makima",
  },
  {
    src: "/power.gif",
    alt: "Power",
  },
];

export const genWhiteBoardPointId = () => "white_board_point_" + nanoid();
export const genWhiteBoardPointGroupId = () =>
  "white_board_point_group_" + nanoid();

export const genWhiteBoardId = () => "white_board_point_" + nanoid();

export const whiteBoard = pgTable("whiteBoard", {
  id: text("id")
    .$defaultFn(() => nanoid())
    .primaryKey(),
});
export const whiteBoardInsertSchema = createInsertSchema(whiteBoard);
export const whiteBoardPointGroup = pgTable("whiteBoardPointGroup", {
  id: text("id").$defaultFn(genWhiteBoardPointGroupId).primaryKey(),
  color: text("color").$type<(typeof whiteBoardColors)[number]>().notNull(),
  whiteBoardId: text("whiteBoardId").references(() => whiteBoard.id, {
    onDelete: "cascade",
  }),
});

export const whiteBoardPoint = pgTable("whiteBoardPoint", {
  id: text("id").$defaultFn(genWhiteBoardPointGroupId).primaryKey(),
  whiteBoardPointGroupId: text("whiteBoardPointGroupId")
    // .notNull()
    .references(() => whiteBoardPointGroup.id, {
      onDelete: "cascade",
    }),
  x: doublePrecision("x").notNull(),
  y: doublePrecision("y").notNull(),
  kind: text("kind")
    .$type<"point">()
    .$defaultFn(() => "point")
    .notNull(),
  createdAt: doublePrecision("createdAt"),
});

export const whiteBoardPointInsertSchema = createInsertSchema(whiteBoardPoint);
export type WhiteBoardPoint = InferSelectModel<typeof whiteBoardPoint>;

export const whiteBoardColors = [
  "blue",
  "red",
  "green",
  "black",
  "white",
] as const;

export type WhiteBoardColor = (typeof whiteBoardColors)[number];

export const getWhiteBoardMouseId = () => "white_board_mouse_" + nanoid();

export const whiteBoardMouse = pgTable("whiteBoardMouseSchema", {
  id: text("id").$defaultFn(getWhiteBoardMouseId).primaryKey(),
  x: doublePrecision("x").notNull(),
  y: doublePrecision("y").notNull(),
  whiteBoardId: text("whiteBoardId").references(() => whiteBoard.id, {
    onDelete: "cascade",
  }),
  kind: text("kind")
    .$type<"mouse">()
    .$defaultFn(() => "mouse")
    .notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
  createdAt: text("createdAt"),
});

export const whiteBoardMouseInsertSchema = createInsertSchema(
  whiteBoardMouse,

  {
    kind: t.Literal("mouse"),
  }
);
export const whiteBoardMouseSelectSchema = createSelectSchema(
  whiteBoardMouse,

  {
    kind: t.Literal("mouse"),
    createdAt: t.String(),
  }
);
export const requiredWhiteBoardMouseInsertSchema = t.Required(
  whiteBoardMouseInsertSchema
);

export type WhiteBoardMouse = Static<typeof whiteBoardMouseInsertSchema>;

export const whiteBoardEraser = pgTable("whiteBoardErased", {
  id: text("id").$defaultFn(getWhiteBoardMouseId).primaryKey(),
  x: doublePrecision("x").notNull(),
  y: doublePrecision("y").notNull(),
  whiteBoardId: text("whiteBoardId").references(() => whiteBoard.id, {
    onDelete: "cascade",
  }),
  kind: text("kind")
    .$type<"eraser">()
    .$defaultFn(() => "eraser")
    .notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
  createdAt: timestamp("createdAt", {
    mode: "string",
    withTimezone: true,
  }),
  // .notNull(),
});

export const whiteBoardEraserInsertSchema = createInsertSchema(
  whiteBoardEraser,

  {
    kind: t.Literal("eraser"),
  }
);
export const whiteBoardEraserSelectSchema = createSelectSchema(
  whiteBoardEraser,

  {
    kind: t.Literal("eraser"),
    createdAt: t.String(),
  }
);
export const requiredWhiteBoardEraserInsertSchema = t.Required(
  whiteBoardEraserInsertSchema
);

export type WhiteBoardErased = Static<typeof whiteBoardEraserInsertSchema>;

export const connectedToCamp = pgTable("connectToCamp", {
  id: text("id")
    .$defaultFn(() => nanoid())
    .primaryKey(),
});

export const messageWhiteBoard = pgTable("messageWhiteBoard", {
  id: text("id").$defaultFn(genWhiteBoardId).primaryKey(),
  messageId: text("messageId")
    .references(() => campMessage.id)
    .notNull(),
  whiteBoardId: text("whiteBoardId")
    .references(() => whiteBoard.id)
    .notNull(),
});

export const messageWhiteBoardSchema = createInsertSchema(messageWhiteBoard);

export type MessageWhiteBoardInsertSchema = Static<
  typeof messageWhiteBoardSchema
>;

export const whiteBoardImg = pgTable("whiteBoardImg", {
  id: text("id")
    .$defaultFn(() => nanoid())
    .primaryKey(),
  whiteBoardId: text("whiteBoardId").references(() => whiteBoard.id, {
    onDelete: "cascade",
  }),
  imgUrl: text("imgUrl").notNull(),
  x: doublePrecision("x").notNull(),
  y: doublePrecision("y").notNull(),
});

export type WhiteBoardImgSelect = InferSelectModel<typeof whiteBoardImg>;

export const transcribeGroup = pgTable("transcribeGroup", {
  id: text("id")
    .$defaultFn(() => nanoid())
    .primaryKey(),
  createdAt: doublePrecision("createdAt")
    .$defaultFn(() => Date.now())
    .notNull(),
  campId: text("campID").references(() => camp.id),
});

export const transcribeJob = pgTable("job", {
  id: text("id")
    .$defaultFn(() => nanoid())
    .primaryKey(),
  transcribeGroupId: text("transcribeGroupId").references(
    () => transcribeGroup.id
  ),
});

export const transcription = pgTable("transcription", {
  id: text("id")
    .$defaultFn(() => nanoid())
    .primaryKey(),
  jobId: text("transcribeJobId").references(() => transcribeJob.id),
  text: text("text").notNull(),
  createdAt: doublePrecision("createdAt")
    .$defaultFn(() => Date.now())
    .notNull(),
});

export const aiMessageBoardAnswers = pgTable("aiMessageBoardAnswers", {
  id: text("id")
    .$defaultFn(() => nanoid())
    .primaryKey(),
  threadId: text("threadId")
    .references(() => campThread.id)
    .notNull(),
  transcriptGroupId: text("transcriptId")
    .references(() => transcribeGroup.id)
    .notNull(),
  relevantTranscript: text("relevantTranscript"),
  attemptedAnswer: text("attemptedAnswer").notNull(),
  createdAt: doublePrecision("createdAt").$defaultFn(() => Date.now()),
});
