import { FriendRequest } from "@fireside/db";
import { Button } from "../ui/button";
import { LoadingSpinner } from "../ui/loading";
import { useDefinedUser } from "./camps-state";
import {
  useAcceptFriendRequestMutation,
  useGetUserFriendRequests,
} from "./friends-state";

export const Inbox = () => {
  const { friendRequests } = useGetUserFriendRequests();
  const user = useDefinedUser();
  const acceptFriendRequestMutation = useAcceptFriendRequestMutation();
  return (
    <div className="h-full w-full flex flex-col">
      {friendRequests.length === 0 && "No friend request"}
      {friendRequests.map((friendRequest) => (
        <div
          className="w-full border-2 border-accent/50 rounded"
          key={friendRequest.id}
        >
          From:{" "}
          {user.id === friendRequest.fromUserId ? "Me" : friendRequest.toUserId}
          To:{" "}
          {user.id === friendRequest.toUserId ? "Me" : friendRequest.toUserId}
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
        </div>
      ))}
    </div>
  );
};

const FriendRequestItem = ({
  friendRequests,
}: {
  friendRequests: FriendRequest;
}) => {
  // retur
};
