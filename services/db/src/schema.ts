import { InferSelectModel } from "drizzle-orm";
import { serial, text, timestamp, pgTable, uuid } from "drizzle-orm/pg-core";
export const user = pgTable("user", {
  id: uuid("id").defaultRandom().primaryKey(),
  displayName: text("name").notNull(),
  token: text("token").notNull(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  role: text("role").$type<"instructor" | "student">().notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at"),
});

export type User = InferSelectModel<typeof user>;
