import { FriendRequest } from "@fireside/db";
import { Button } from "../ui/button";
import { LoadingSpinner } from "../ui/loading";
import { useDefinedUser } from "./camps-state";
import { useAcceptFriendRequestMutation } from "./friends-state";

export const InboxItem = ({
  friendRequest,
}: {
  friendRequest: FriendRequest;
}) => {
  const acceptFriendRequestMutation = useAcceptFriendRequestMutation();
  const user = useDefinedUser();

  const from =
    user.id === friendRequest.fromUserId ? "Me" : friendRequest.fromUserId;

  return (
    <div
      className="w-full border-accent/50 rounded"
      key={friendRequest.id}
    >
      From: {from}
      To: {user.id === friendRequest.toUserId ? "Me" : friendRequest.toUserId}
      {from !== "Me" && (
        <Button
          onClick={() => {
            acceptFriendRequestMutation.mutate({
              requestId: friendRequest.id,
            });
          }}
        >
          {acceptFriendRequestMutation.isPending ? (
            <LoadingSpinner />
          ) : (
            "Accept Friend Request"
          )}
        </Button>
      )}
    </div>
  );
};
