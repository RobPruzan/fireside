import {
  user,
  eq,
  getOneYearAheadDate,
  count,
  type User,
  friendRequest,
  and,
  or,
  getTableColumns,
  aliasedTable,
  token,
  friend,
  // alias,
} from "@fireside/db";

import E, { Elysia, t, type CookieOptions } from "elysia";
import { ProtectedElysia, getDeleteAuthCookie } from "./lib";

import { StatusMap } from "@fireside/utils/src/constants";
import { db } from ".";

const getHash = async ({ str }: { str: string }) =>
  await Bun.password.hash(str, {
    algorithm: "argon2id",
    timeCost: 2,
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

      if (ctx.params.to === ctx.user.id) {
        ctx.set.status = 400;
        throw new Error("Cannot send friend request to self");
      }

      if (
        existingRequest &&
        ctx.user.id === existingRequest.fromUserId &&
        !existingRequest.deleted
      ) {
        ctx.set.status = 409;
        throw new Error("Friend request already sent to user");
      }
      if (
        existingRequest &&
        ctx.user.id === existingRequest.toUserId &&
        !existingRequest.deleted
      ) {
        const insertPromise = db
          .insert(friend)
          .values({
            userOneId: existingRequest.fromUserId,
            userTwoId: existingRequest.toUserId,
          })
          .returning();
        const deleteRequestPromise = db
          .update(friendRequest)
          .set({
            deleted: true,
          })
          .where(eq(friendRequest.id, existingRequest.id));
        const otherUserPromise = db
          .select()
          .from(user)
          .where(eq(user.id, ctx.params.to));
        const [newFriendRows, otherUserRows] = await Promise.all([
          insertPromise,
          otherUserPromise,
          deleteRequestPromise,
        ]);

        return {
          kind: "created-friend" as const,
          friend: newFriendRows[0],
          user: ctx.user,
          otherUser: cleanUser(otherUserRows[0]),
          existingRequest: { ...existingRequest, deleted: true },
        };
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

      // const toRequestUser = await db
      //   .select()
      //   .from(user)
      //   .where(eq(user.id, newFriendRequest.toUserId));

      // return { ...newFriendRequest, toUser: toRequestUser[0] };

      return {
        kind: "new-request" as const,
        newFriendRequest,
      };
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
      const friendRows = await db
        .select()
        .from(friend)
        .where(
          and(
            or(
              eq(friend.userOneId, ctx.user.id),
              eq(friend.userTwoId, ctx.user.id)
            ),
            or(
              eq(friend.userOneId, ctx.params.requestId),
              eq(friend.userTwoId, ctx.params.requestId)
            )
          )
        );

      if (friendRows.at(0)) {
        ctx.set.status = 400;
        throw new Error("Already friends");
      }

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

      if (requestToAccept.deleted) {
        ctx.set.status = 400;
        throw new Error("Friend request no longer valid");
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

      const createdUserId =
        createdFriendRows[0].userOneId === ctx.user.id
          ? createdFriendRows[0].userTwoId
          : createdFriendRows[0].userOneId;

      const createdFriend = await db
        .select()
        .from(user)
        .where(eq(user.id, createdUserId));

      return {
        friend: createdFriendRows[0],
        user: ctx.user,
        otherUser: createdFriend[0],
      };
    },
    {
      params: t.Object({
        requestId: t.String(),
      }),
    }
  )
  .get("/friends/retrieve", (ctx) =>
    db
      .select({
        friend: getTableColumns(friend),
        user: cleanedUser,
        otherUser: cleanedOtherUser,
      })
      .from(friend)
      .where(
        or(eq(friend.userOneId, ctx.user.id), eq(friend.userTwoId, ctx.user.id))
      )
      .innerJoin(user, eq(friend.userOneId, user.id))
      .innerJoin(otherUserAlias, eq(friend.userTwoId, otherUserAlias.id))
  );

const otherUserAlias = aliasedTable(user, "otherUser");

const {
  token: _,
  password: __,
  ...cleanedOtherUser
} = getTableColumns(otherUserAlias);
const { token: tkn, password: pwd, ...cleanedUser } = getTableColumns(user);
