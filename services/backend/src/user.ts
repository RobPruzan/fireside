import {
  db,
  user,
  eq,
  token,
  getOneYearAheadDate,
  count,
  type User,
} from "@fireside/db";

import { Elysia, t, type CookieOptions } from "elysia";
import { ProtectedElysia, getDeleteAuthCookie } from "./lib";
import { StatusMap } from "@fireside/utils/src/constants";

const getHashedToken = async ({ token }: { token: string }) =>
  await Bun.password.hash(token, {
    algorithm: "bcrypt",
    cost: 12,
  });

const getAuthCookie = ({ token }: { token: string }) =>
  ({
    value: token,
    httpOnly: true,
    expires: getOneYearAheadDate(),
    secure: true,
    domain: "localhost",
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
  const authUser = users.find(async ({ token, ...rest }) => {
    if (!token) {
      return false;
    }

    const res = await Bun.password.verify(authToken, token);
    return res;
  });

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
      if (ctx.body.password !== ctx.body.password) {
        throw new Error("Pass and confirmed password not equal");
      }

      const userWithSameEmail = (
        await db
          .select({ count: count() })
          .from(user)
          .where(eq(user.email, ctx.body.email))
      ).at(0);
      if (!userWithSameEmail) {
        ctx.set.status = 500;
        throw new Error("Failed to fetch users");
      }

      if (userWithSameEmail.count > 0) {
        ctx.set.status = 409;
        throw new Error("User with email already registered");
      }

      const passwordHash = await Bun.password.hash(ctx.body.password, {
        algorithm: "bcrypt",
        cost: 12,
      });

      const originalToken = crypto.randomUUID();

      const hashedToken = await getHashedToken({ token: originalToken });

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
            email: ctx.body.email,
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
      ctx.cookie["auth"].add(cookie);
      return cleanUser(newUser);
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
        confirmedPassword: t.String(),
      }),
    }
  )
  .post(
    "/login",
    async (ctx) => {
      const potentialUser = (
        await db.select().from(user).where(eq(user.email, ctx.body.email))
      ).at(0);
      if (!potentialUser) {
        ctx.set.status = 400;
        throw new Error(`No user with email: ${ctx.body.email} found`);
      }

      const verified = await Bun.password.verify(
        ctx.body.password,
        potentialUser?.password
      );
      if (!verified) {
        ctx.set.status = 401;
        throw new Error(`Invalid password for ${ctx.body.email}`);
      }
      const originalToken = crypto.randomUUID();
      const hashedToken = await getHashedToken({ token: originalToken });

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

      ctx.cookie["auth"].add(getAuthCookie({ token: originalToken }));
      return {
        kind: "success" as const,
        user: cleanUser(insertedUser),
      };
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    }
  )
  .post("/is-logged-in", async ({ cookie: { auth }, set }) => {
    const isAuthResult = await getSession({ authToken: auth.get() });
    return isAuthResult;
  });

export const userProtectedRoute = ProtectedElysia({
  prefix: "/user",
}).post("/log-out", (ctx) => {
  ctx.cookie.auth.set(getDeleteAuthCookie());
});
