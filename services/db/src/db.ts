import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from "dotenv";
import { join } from "path";

config({ path: join(__dirname, "..", ".env") });
config({ path: join(__dirname, ".env") });

export let drizzleSql: ReturnType<typeof postgres>;
export let db: ReturnType<typeof drizzle>;

const connectDB = ({ connString }: { connString: string }) => {
  drizzleSql = postgres(connString, {
    onnotice: (notice) => {
      console.log("PG NOTICE", notice);
    },
    onclose: () => {
      console.log("Connection closed, attempting to reconnect...");
      setTimeout(() => connectDB({ connString }), 3000);
    },
    onparameter: (key, value) => {
      console.log("PARAM CHANGE", key, value);
    },
  });
  console.log("connecting...");
  db = drizzle(drizzleSql);
};

console.log("calling connectDb");

connectDB({ connString: process.env.CONNECTION_STRING! });
