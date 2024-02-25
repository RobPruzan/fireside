import { serial, text, timestamp, pgTable, uuid } from "drizzle-orm/pg-core";
export const user = pgTable("user", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email"),
  password: text("password"),
  role: text("role").$type<"instructor" | "student">(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});
