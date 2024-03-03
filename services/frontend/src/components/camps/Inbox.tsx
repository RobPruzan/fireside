import { useDefinedUser } from "./camps-state";
import { useGetUserFriendRequests } from "./friends-state";

export const Inbox = () => {
  const { friendRequests } = useGetUserFriendRequests();
  const user = useDefinedUser();
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
        </div>
      ))}
    </div>
  );
};
