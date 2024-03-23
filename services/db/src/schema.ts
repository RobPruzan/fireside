import { Type as t } from "@sinclair/typebox";
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
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-typebox";
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
  parentMessageId: uuid("parentMessageId").references(
    (): AnyPgColumn => campMessage.id
  ),
});

export type CampMessage = InferSelectModel<typeof campMessage>;

export const campMessageInsertSchema = createInsertSchema(campMessage, {
  userId: t.Optional(t.Never()),
});

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
    .references(() => user.id)
    .notNull(),
  createdAt: timestamp("createdAt", { mode: "string" })
    .$defaultFn(() => new Date().toISOString())
    .notNull(),
  reactionId: uuid("reactionId")
    .references(() => reaction.id)
    .notNull(),
});

export const userMessageReactionInsertSchema = createInsertSchema(
  userMessageReaction,
  {
    userId: t.Optional(t.Never()),
  }
);

export const reaction = pgTable("reaction", {
  id: uuid("id").defaultRandom().primaryKey(),
  imgSrc: text("imgSrc"),
  alt: text("alt"),
});
