import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from "dotenv";
import { join } from "path";

if (process.env.NODE_ENV === "production") {
  // load dev env as base envs just incase
  config({ path: join(__dirname, "..", ".env.development") });
  config({ path: join(__dirname, ".env.development") });
  config({ path: join(__dirname, "..", ".env") });
  config({ path: join(__dirname, ".env") });
  config({ path: join(__dirname, "..", ".env.production") });
  config({ path: join(__dirname, ".env.production") });
} else {
  config({ path: join(__dirname, "..", ".env") });
  config({ path: join(__dirname, ".env") });
  config({ path: join(__dirname, "..", ".env.development") });
  config({ path: join(__dirname, ".env.development") });
}

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
      // console.log("PARAM CHANGE", key, value);
    },
  });
  console.log("connecting...");
  db = drizzle(drizzleSql);
};

console.log("calling connectDb", process.env.CONNECTION_STRING!);

connectDB({ connString: process.env.CONNECTION_STRING! });
