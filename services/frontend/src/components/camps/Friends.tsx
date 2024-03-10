import { FiresideUser } from "@/lib/useUserQuery";
import { Button } from "../ui/button";
import { LoadingSpinner } from "../ui/loading";
import { useDefinedUser } from "./camps-state";
import {
  useGetFriends,
  useGetUserFriendRequests,
  useGetUsers,
  useMakeFriendRequestMutation,
} from "./friends-state";
import { Nullish, run } from "@fireside/utils";
import { Check, Heart } from "lucide-react";
import { getNotMeUser } from "@/lib/utils";

export const Friends = () => {
  const { users, usersWithStatus } = useGetUsers();
  const { friends } = useGetFriends();
  const user = useDefinedUser();
  return (
    <div className="h-full w-full flex ">
      <div className="flex-col overflow-y-auto w-1/2 gap-y-2">
        <span className="text-2xl">Make new friends</span>
        {users.length === 0 && "No users"}
        {usersWithStatus
          .filter((u) => u.id !== user.id)
          .map((externalUser) => (
            <SearchFriendItem
              externalUser={externalUser}
              key={externalUser.id}
            />
          ))}
      </div>

      <div className="flex-col overflow-y-auto w-1/2 gap-y-2">
        <span className="text-2xl">My Friends</span>
        {friends.map((friendRes) =>
          run(() => {
            const currentFriend =
              user.id === friendRes.user.id
                ? friendRes.otherUser
                : friendRes.user;

            return (
              <CurrentFriendItem
                key={currentFriend.id}
                friend={currentFriend}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

const SearchFriendItem = ({
  externalUser,
}: {
  externalUser: NonNullable<FiresideUser> & {
    status: "is-friend" | "sent-request" | "no-relation";
  };
}) => {
  const makeFriendRequestMutation = useMakeFriendRequestMutation();

  return (
    <div
      className="w-full border-2 border-accent/50 rounded flex flex-col"
      key={externalUser.id}
    >
      <div>{externalUser.email}</div>
      {run(() => {
        switch (externalUser.status) {
          case "is-friend": {
            return (
              <div className="flex">
                Already friends <Heart className="text-red-500" />
              </div>
            );
          }

          case "sent-request": {
            return (
              <div className="flex">
                Request sent <Check className="text-green-500" />
              </div>
            );
          }
          case "no-relation": {
            return (
              <Button
                onClick={() =>
                  makeFriendRequestMutation.mutate({
                    to: externalUser.id,
                  })
                }
              >
                {makeFriendRequestMutation.isPending ? (
                  <LoadingSpinner />
                ) : (
                  "Make Friend Request"
                )}
              </Button>
            );
          }
        }
      })}
    </div>
  );
};

const CurrentFriendItem = ({
  friend,
}: {
  friend: NonNullable<FiresideUser>;
}) => {
  return (
    <div
      className="w-full border-2 border-accent/50 rounded-md"
      key={friend.id}
    >
      Email:{friend.email}
    </div>
  );
};
