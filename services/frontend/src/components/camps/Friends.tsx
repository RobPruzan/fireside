import { FiresideUser } from "@/lib/useUserQuery";
import { Button } from "../ui/button";
import { LoadingSpinner } from "../ui/loading";
import { useDefinedUser } from "./camps-state";
import {
  useGetFriends,
  useGetUsers,
  useMakeFriendRequestMutation,
} from "./friends-state";

export const Friends = () => {
  const { users } = useGetUsers();
  const { friends } = useGetFriends();
  const user = useDefinedUser();
  return (
    <div className="h-full w-full flex ">
      <div className="flex-col overflow-y-auto w-1/2 gap-y-2">
        {" "}
        {users.length === 0 && "No users"}
        {users
          .filter((u) => u.id !== user.id)
          .map((externalUser) => (
            <FriendItem externalUser={externalUser} key={externalUser.id} />
          ))}
      </div>

      <div className="flex-col overflow-y-auto w-1/2 gap-y-2">
        {friends.map((friend) => (
          <div
            className="w-full border-2 border-accent/50 rounded-md"
            key={friend.id}
          >
            {friend.email}
          </div>
        ))}
      </div>
    </div>
  );
};

const FriendItem = ({
  externalUser,
}: {
  externalUser: NonNullable<FiresideUser>;
}) => {
  const makeFriendRequestMutation = useMakeFriendRequestMutation();

  return (
    <div
      className="w-full border-2 border-accent/50 rounded flex flex-col"
      key={externalUser.id}
    >
      <div>{externalUser.email}</div>
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
    </div>
  );
};
