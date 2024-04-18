import {
  user,
  eq,
  getOneYearAheadDate,
  count,
  type User,
  token,
  db,
  // alias,
} from "@fireside/db";

import { Elysia, t, type CookieOptions } from "elysia";
import { ProtectedElysia, getDeleteAuthCookie } from "./lib";

import { cleanedUserCols } from "./camp-endpoints";

const getHash = ({ str }: { str: string }) =>
  Bun.password.hash(str, {
    algorithm: "argon2id",
    memoryCost: 4,
    timeCost: 3,
  });

const getAuthCookie = ({ token }: { token: string }) =>
  ({
    value: token,
    httpOnly: true,
    expires: getOneYearAheadDate(),
    secure: true,
    domain:
      process.env.NODE_ENV === "production" ? "fireside.ninja" : "localhost",
    path: "/",
    sameSite: "none",
  } satisfies CookieOptions & { value: unknown });

const cleanUser = (user: User) => {
  const { token, password, ...cleanedUser } = user;
  return cleanedUser;
};

export const getSession = async ({ authToken }: { authToken: string }) => {
  if (!authToken) {
    return {
      kind: "not-logged-in" as const,
      reason: "No authorization token",
    };
  }

  const users = await db.select().from(user);
  const verifiedStatus = await Promise.all(
    users.map(async (user) => {
      if (!user.token) {
        return { verified: false, user: user };
      }

      const res = await Bun.password.verify(authToken, user.token);

      return { verified: res, user: user };
    })
  );

  const authUser = verifiedStatus.find((user) => user.verified)?.user;

  if (!authUser) {
    return {
      kind: "not-logged-in" as const,
      reason: "No user with auth token found",
    };
  }

  return {
    kind: "logged-in" as const,
    user: cleanUser(authUser),
  };
};

export const userRoute = new Elysia({
  prefix: "/user",
})
  .post(
    "/create",
    async (ctx) => {
      if (ctx.body.password !== ctx.body.confirmedPassword) {
        throw new Error("Pass and confirmed password not equal");
      }

      const userWithSameEmail = (
        await db
          .select({ count: count() })
          .from(user)
          .where(eq(user.username, ctx.body.username))
      ).at(0);
      if (!userWithSameEmail) {
        ctx.set.status = 500;
        throw new Error("Failed to fetch users");
      }

      if (userWithSameEmail.count > 0) {
        ctx.set.status = 409;
        throw new Error("User with email already registered");
      }

      const passwordHash = await getHash({ str: ctx.body.password });

      const originalToken = crypto.randomUUID();

      const hashedToken = await getHash({ str: originalToken });

      const insertedToken = (
        await db
          .insert(token)
          .values({
            value: hashedToken,
          })
          .returning()
      ).at(0);

      if (!insertedToken) {
        ctx.set.status = 500;
        throw new Error("Failed to create user token");
      }

      const newUser = (
        await db
          .insert(user)
          .values({
            displayName: "todo: random names",
            username: ctx.body.username,
            password: passwordHash,
            token: hashedToken,
            role: "student",
          })
          .returning()
      ).at(0);

      if (!newUser) {
        throw new Error(
          "Failed to create user, could not retrieve created user"
        );
      }

      if (!newUser.token) {
        throw new Error("Created user does not have token");
      }
      const cookie = getAuthCookie({
        token: originalToken,
      });

      delete ctx.cookie["auth"];
      ctx.cookie["auth"].set(cookie);
      ctx.set.status = 200;
      return cleanUser(newUser);
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
        confirmedPassword: t.String(),
      }),
    }
  )
  .post(
    "/login",
    async (ctx) => {
      const potentialUser = (
        await db.select().from(user).where(eq(user.username, ctx.body.username))
      ).at(0);
      if (!potentialUser) {
        ctx.set.status = 400;
        throw new Error(`No user with username: ${ctx.body.username} found`);
      }

      const verified = await Bun.password.verify(
        ctx.body.password,
        potentialUser?.password
      );
      if (!verified) {
        ctx.set.status = 401;
        throw new Error(`Invalid password for ${ctx.body.username}`);
      }
      const originalToken = crypto.randomUUID();
      const hashedToken = await getHash({ str: originalToken });

      const insertedToken = (
        await db
          .insert(token)
          .values({
            value: hashedToken,
          })
          .returning()
      ).at(0);

      if (!insertedToken) {
        ctx.set.status = 500;
        throw new Error("Failed to insert auth token");
      }

      const insertedUser = (
        await db
          .update(user)
          .set({
            token: insertedToken.value,
          })
          .where(eq(user.id, potentialUser.id))
          .returning()
      ).at(0);

      if (!insertedUser) {
        ctx.set.status = 500;
        throw new Error("Could not create user");
      }

      ctx.cookie["auth"].set(getAuthCookie({ token: originalToken }));
      ctx.set.status = 200;
      return {
        kind: "success" as const,
        user: cleanUser(insertedUser),
      };
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
      }),
    }
  )
  .post("/is-logged-in", async ({ cookie: { auth }, set }) => {
    const isAuthResult = await getSession({ authToken: auth.value });
    set.status = 200;
    return isAuthResult;
  });

export const userProtectedRoute = ProtectedElysia({
  prefix: "/user",
})
  .post("/log-out", async (ctx) => {
    await db
      .update(user)
      .set({
        token: null,
      })
      .where(eq(user.id, ctx.user.id));
    ctx.cookie.auth.set(getDeleteAuthCookie());
  })
  .get("/get-all", () => db.select(cleanedUserCols).from(user));
