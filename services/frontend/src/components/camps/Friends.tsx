import { useDefinedUser } from "./camps-state";
import { useGetFriends, useGetUsers } from "./friends-state";
import { run } from "@fireside/utils";
import { SearchFriendItem } from "./SearchFriendItem";
import { CurrentFriendItem } from "./CurrentFriendItem";
import { useQueryClient } from "@tanstack/react-query";

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
