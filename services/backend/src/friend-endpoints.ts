import {
  friendRequest,
  and,
  or,
  eq,
  friend,
  user,
  getTableColumns,
  aliasedTable,
} from "@fireside/db";
import { t } from "elysia";
import { db } from ".";
import { ProtectedElysia, cleanUser } from "./lib";

export const friendRoute = ProtectedElysia({ prefix: "/friend" })
  .post(
    "/request/:to",
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
  .get("/request/retrieve", ({ user }) =>
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

  .post(
    "/request/accept/:requestId",
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
        otherUser: cleanUser(createdFriend[0]),
      };
    },
    {
      params: t.Object({
        requestId: t.String(),
      }),
    }
  )
  .get("/retrieve", (ctx) =>
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
