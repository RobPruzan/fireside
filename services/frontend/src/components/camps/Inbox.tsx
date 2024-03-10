import { useGetUserFriendRequests } from "./friends-state";
import { InboxItem } from "./InboxItem";

export const Inbox = () => {
  const { friendRequests, openFriendRequests } = useGetUserFriendRequests();

  return (
    <div className="h-full w-full flex flex-col">
      {friendRequests.length === 0 && "No friend request"}
      {openFriendRequests.map((friendRequest) => (
        <InboxItem friendRequest={friendRequest} />
      ))}
    </div>
  );
};
