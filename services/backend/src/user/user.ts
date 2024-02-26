import { db, user, eq, token, getOneYearAheadDate, count } from "@fireside/db";

import { Elysia, NotFoundError, t, type CookieOptions } from "elysia";

const getHashedToken = async ({ token }: { token: string }) =>
  await Bun.password.hash(token, {
    algorithm: "bcrypt",
    cost: 12,
  });

const getAuthCookie = async ({ token }: { token: string }) =>
  ({
    value: await getHashedToken({ token }),
    httpOnly: true,
    expires: getOneYearAheadDate(),
    secure: true,
    domain: "localhost",
    path: "/",
    sameSite: "none",
  } satisfies CookieOptions & { value: unknown });

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

      const insertedToken = (
        await db
          .insert(token)
          .values({
            value: crypto.randomUUID(),
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
            token: insertedToken.value,
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

      ctx.cookie["auth"].add(await getAuthCookie({ token: newUser.token }));
      const { password, token: _, ...cleanedNewUser } = newUser;
      return cleanedNewUser;
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

      const token = crypto.randomUUID();
      await db
        .update(user)
        .set({
          token,
        })
        .where(eq(user.id, potentialUser.id));

      ctx.cookie["auth"].add(await getAuthCookie({ token }));
      return {
        kind: "success" as const,
      };
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    }
  )
  .post("/is-logged-in", async ({ cookie, set }) => {
    if (!cookie.auth) {
      return {
        kind: "not-logged-in" as const,
        reason: "No authorization token",
      };
    }

    const hashedToken = await getHashedToken({ token: String(cookie.auth) });

    const countObj = (
      await db
        .select({ count: count() })
        .from(user)
        .where(eq(user.token, hashedToken))
    ).at(0);

    if (!countObj) {
      set.status = 500;
      throw new Error("Error when searching users");
    }

    if (countObj.count === 0) {
      set.status = 401;
      return "Unauthorized";
    }

    return {
      kind: "logged-in" as const,
    };
  })
  .post("/log-out", (ctx) => {
    delete ctx.cookie["auth"];
  });
