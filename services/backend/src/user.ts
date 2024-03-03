import {
  user,
  eq,
  token,
  getOneYearAheadDate,
  count,
  type User,
  friendRequest,
  and,
  or,
  friend,
  getTableColumns,
} from "@fireside/db";

import E, { Elysia, t, type CookieOptions } from "elysia";
import { ProtectedElysia, getDeleteAuthCookie } from "./lib";
import { StatusMap } from "@fireside/utils/src/constants";
import { db } from ".";

const getHash = async ({ str }: { str: string }) =>
  await Bun.password.hash(str, {
    algorithm: "argon2id",
    timeCost: 3,
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
      ctx.set.status = 200;
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

      ctx.cookie["auth"].add(getAuthCookie({ token: originalToken }));
      ctx.set.status = 200;
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
    set.status = 200;
    return isAuthResult;
  });

export const userProtectedRoute = ProtectedElysia({
  prefix: "/user",
})
  .post("/log-out", (ctx) => {
    ctx.cookie.auth.set(getDeleteAuthCookie());
  })
  .post(
    "/friends/request/:to",
    async (ctx) => {
      const existingRequest = (
        await db
          .select()
          .from(friendRequest)
          .where(
            and(
              or(
                eq(friendRequest.fromUserId, ctx.user.id),
                eq(friendRequest.toUserId, ctx.user.id)
              ),
              or(
                eq(friendRequest.fromUserId, ctx.params.to),
                eq(friendRequest.toUserId, ctx.params.to)
              )
            )
          )
      ).at(0);
      if (existingRequest && ctx.user.id === existingRequest.fromUserId) {
        ctx.set.status = 409;
        throw new Error("Friend request already sent to user");
      }
      if (existingRequest && ctx.user.id === existingRequest.toUserId) {
        const insertPromise = db.insert(friend).values({
          userOneId: ctx.user.id,
          userTwoId: ctx.params.to,
        });
        const deleteRequestPromise = db
          .update(friendRequest)
          .set({
            deleted: true,
          })
          .where(eq(friendRequest.id, existingRequest.id));
        await Promise.all([insertPromise, deleteRequestPromise]);
      }

      const newFriendRequest = (
        await db
          .insert(friendRequest)
          .values({
            fromUserId: ctx.user.id,
            toUserId: ctx.params.to,
          })
          .returning()
      )[0];

      return newFriendRequest;
    },
    {
      params: t.Object({
        to: t.String(),
      }),
    }
  )
  .get("/friends/request/retrieve", ({ user }) =>
    db
      .select()
      .from(friendRequest)
      .where(
        or(
          eq(friendRequest.fromUserId, user.id),
          eq(friendRequest.toUserId, user.id)
        )
      )
  )
  .get("/get-all", () => db.select().from(user))
  .post(
    "/friends/request/accept/:requestId",
    async (ctx) => {
      const requestToAccept = (
        await db
          .select()
          .from(friendRequest)
          .where(eq(friendRequest.id, ctx.params.requestId))
      ).at(0);

      if (!requestToAccept) {
        ctx.set.status = 400;
        throw new Error("No friend request with specified id found");
      }

      if (requestToAccept.toUserId !== ctx.user.id) {
        ctx.set.status = 401;
        throw new Error("Cannot accept friend request not sent to you");
      }

      const createFriendPromise = db
        .insert(friend)
        .values({
          userOneId: requestToAccept.fromUserId,
          userTwoId: requestToAccept.toUserId,
        })
        .returning();

      const deleteRequestPromise = db
        .update(friendRequest)
        .set({
          deleted: true,
        })
        .where(eq(friendRequest.id, requestToAccept.id));

      const [createdFriendRows] = await Promise.all([
        createFriendPromise,
        deleteRequestPromise,
      ]);

      const createdFriend = await db
        .select()
        .from(user)
        .where(eq(user.id, createdFriendRows[0].id));
      return createdFriend[0];
    },
    {
      params: t.Object({
        requestId: t.String(),
      }),
    }
  )
  .get("/friends/retrieve", (ctx) =>
    db
      .select(getTableColumns(user))
      .from(friend)
      .where(eq(friend.id, ctx.user.id))
      .innerJoin(
        user,
        or(eq(friend.userOneId, user.id), eq(user.id, friend.userTwoId))
      )
  );
