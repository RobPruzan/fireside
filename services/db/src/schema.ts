import { Type } from "@sinclair/typebox";
import { InferSelectModel } from "drizzle-orm";
import { serial, text, timestamp, pgTable, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-typebox";

export const getOneYearAheadDate = () => {
  const currentDate = new Date();
  return new Date(
    currentDate.getFullYear() + 1,
    currentDate.getMonth(),
    currentDate.getDate(),
  );
};
export const user = pgTable("user", {
  id: uuid("id").defaultRandom().primaryKey(),
  displayName: text("name").notNull(),
  token: text("token").references(() => token.value),
  email: text("email").notNull(),
  password: text("password").notNull(),
  role: text("role").$type<"instructor" | "student">().notNull(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at"),
});

export type User = InferSelectModel<typeof user>;

export const token = pgTable("token", {
  value: text("id").primaryKey(),
  expires: timestamp("expires").$defaultFn(() => getOneYearAheadDate()),
});

export const user_to_user = pgTable("friend", {
  id: uuid("id").defaultRandom().primaryKey(),
  userOneId: uuid("userOneId").references(() => user.id),
  userTwoId: uuid("userTwoId").references(() => user.id),
});

export const camp = pgTable("camp", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at"),
});

export const campSchema = createInsertSchema(camp);

export const campMembers = pgTable("campMembers", {
  id: uuid("id").defaultRandom().primaryKey(),
  camp_id: uuid("camp_id").references(() => camp.id),
  user_id: uuid("user_id").references(() => user.id),
});

export const campMembersSchema = createInsertSchema(campMembers, {
  user_id: Type.Optional(Type.String()),
});

export const campMembersWithoutUserSchema = createInsertSchema(campMembers, {
  user_id: Type.Optional(Type.String()),
});
