import { Static, Type as t } from "@sinclair/typebox";
import { InferSelectModel } from "drizzle-orm";
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
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { DatesToString } from "@fireside/utils";

export const getOneYearAheadDate = () => {
  const currentDate = new Date();
  return new Date(
    currentDate.getFullYear() + 1,
    currentDate.getMonth(),
    currentDate.getDate()
  );
};
export const user = pgTable("user", {
  id: uuid("id").defaultRandom().primaryKey(),
  displayName: text("name").notNull(),
  token: text("token").references(() => token.value),
  email: text("email").notNull(),
  password: text("password").notNull(),
  role: text("role").$type<"instructor" | "student">().notNull(),
  createdAt: timestamp("createdAt", { mode: "string" })
    .$defaultFn(() => new Date().toISOString())
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }),
});

export const safeUserSelectSchema = createSelectSchema(user, {
  token: t.Optional(t.Never()),
  password: t.Optional(t.Never()),
});

export type User = InferSelectModel<typeof user>;

export const token = pgTable("token", {
  value: text("id").primaryKey(),
  expires: timestamp("expires", { mode: "string" }).$defaultFn(() =>
    getOneYearAheadDate().toISOString()
  ),
});

export const user_to_user = pgTable("friend", {
  id: uuid("id").defaultRandom().primaryKey(),
  userOneId: uuid("userOneId").references(() => user.id),
  userTwoId: uuid("userTwoId").references(() => user.id),
});

export const camp = pgTable("camp", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("createdAt", { mode: "string" })
    .$defaultFn(() => new Date().toISOString())
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }),
});

export type FiresideCamp = InferSelectModel<typeof camp>;

export const campSchema = createInsertSchema(camp);

export const campMessage = pgTable("campMessage", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  campId: uuid("campId")
    .notNull()
    .references(() => camp.id),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt", { mode: "string" })
    .$defaultFn(() => new Date().toISOString())
    .notNull(),
});

export const campThread = pgTable("campThread", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdBy: uuid("createdBy")
    .notNull()
    .references(() => user.id),
  parentMessageId: uuid("campMessage")
    .notNull()
    .references(() => campMessage.id),
  createdAt: timestamp("createdAt", { mode: "string" })
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
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  threadId: uuid("threadId")
    .notNull()
    .references(() => campThread.id),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt", { mode: "string" })
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
  id: uuid("id").defaultRandom().primaryKey(),
  campId: uuid("camp_id")
    .references(() => camp.id)
    .notNull(),
  userId: uuid("user_id")
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
  id: uuid("id").defaultRandom().primaryKey(),
  campId: uuid("camp_id")
    .references(() => camp.id)
    .notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("createdAt", { mode: "string" })
    .$defaultFn(() => new Date().toISOString())
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }),
});

export const bonfireInsertSchema = createInsertSchema(bonfire);

export const userToBonfire = pgTable("userToBonfire", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .references(() => user.id)
    .notNull(),
  bonfireId: uuid("bonfireId")
    .references(() => bonfire.id)
    .notNull(),
  joinedAt: timestamp("createdAt", { mode: "string" })
    .$defaultFn(() => new Date().toISOString())
    .notNull(),
});

export const friendRequest = pgTable("friendRequest", {
  id: uuid("id").defaultRandom().primaryKey(),
  fromUserId: uuid("fromUserId")
    .references(() => user.id)
    .notNull(),
  toUserId: uuid("toUserId")
    .references(() => user.id)
    .notNull(),
  deleted: boolean("deleted").default(false),
  createdAt: timestamp("createdAt", { mode: "string" })
    .$defaultFn(() => new Date().toISOString())
    .notNull(),
});
export type FriendRequest = InferSelectModel<typeof friendRequest>;

export const friend = pgTable("friend", {
  id: uuid("id").defaultRandom().primaryKey(),
  userOneId: uuid("userOneId")
    .references(() => user.id)
    .notNull(),
  userTwoId: uuid("userTwoId")
    .references(() => user.id)
    .notNull(),
  // problem for later
  // createdAt: timestamp("createdAt", { mode: "string" })
  //   .$defaultFn(() => new Date().toISOString())
  //   .notNull(),
});

export type Friend = InferSelectModel<typeof friend>;

export const userMessageReaction = pgTable("userMessageReaction", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .references(() => user.id)
    .notNull(),
  messageId: uuid("messageId")
    .references(() => campMessage.id)
    .notNull(),
  createdAt: timestamp("createdAt", { mode: "string" })
    .$defaultFn(() => new Date().toISOString())
    .notNull(),
  reactionAssetId: uuid("reactionAssetId")
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
  id: uuid("id").defaultRandom().primaryKey(),
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

export const genWhiteBoardPointId = () =>
  "white_board_point_" + crypto.randomUUID();
export const genWhiteBoardPointGroupId = () =>
  "white_board_point_group_" + crypto.randomUUID();

export const whiteBoard = pgTable("whiteBoard", {
  id: uuid("id").defaultRandom().primaryKey(),
});
export const whiteBoardInsertSchema = createInsertSchema(whiteBoard);
export const whiteBoardPointGroup = pgTable("whiteBoardPointGroup", {
  id: text("id").$defaultFn(genWhiteBoardPointId).primaryKey(),
  color: text("color").$type<(typeof whiteBoardColors)[number]>().notNull(),
  whiteBoardId: uuid("whiteBoardId").references(() => whiteBoard.id, {
    onDelete: "cascade",
  }),
});

export const whiteBoardPoint = pgTable("whiteBoardPoint", {
  id: text("id").$defaultFn(genWhiteBoardPointId).primaryKey(),
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

export const getWhiteBoardMouseId = () =>
  "white_board_mouse_" + crypto.randomUUID();

export const whiteBoardMouse = pgTable("whiteBoardMouseSchema", {
  id: text("id").$defaultFn(getWhiteBoardMouseId).primaryKey(),
  x: doublePrecision("x").notNull(),
  y: doublePrecision("y").notNull(),
  whiteBoardId: uuid("whiteBoardId").references(() => whiteBoard.id, {
    onDelete: "cascade",
  }),
  kind: text("kind")
    .$type<"mouse">()
    .$defaultFn(() => "mouse")
    .notNull(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
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
  }
);
export const requiredWhiteBoardMouseInsertSchema = t.Required(
  whiteBoardMouseInsertSchema
);

export type WhiteBoardMouse = Static<typeof whiteBoardMouseInsertSchema>;

export const connectedToCamp = pgTable("connectToCamp", {
  id: uuid("id").defaultRandom().primaryKey(),
});

export const messageWhiteBoard = pgTable("messageWhiteBoard", {
  id: text("id").$defaultFn(genWhiteBoardPointId).primaryKey(),
  messageId: uuid("messageId")
    .references(() => campMessage.id)
    .notNull(),
  whiteBoardId: uuid("whiteBoardId")
    .references(() => whiteBoard.id)
    .notNull(),
});

export const messageWhiteBoardSchema = createInsertSchema(messageWhiteBoard);

export type MessageWhiteBoardInsertSchema = Static<
  typeof messageWhiteBoardSchema
>;

export const whiteBoardImg = pgTable("whiteBoardImg", {
  id: text("id").$defaultFn(genWhiteBoardPointId).primaryKey(),
  whiteBoardId: uuid("whiteBoardId").references(() => whiteBoard.id, {
    onDelete: "cascade",
  }),
  imgUrl: text("imgUrl").notNull(),
  x: doublePrecision("x").notNull(),
  y: doublePrecision("y").notNull(),
});

export type WhiteBoardImgSelect = InferSelectModel<typeof whiteBoardImg>;
