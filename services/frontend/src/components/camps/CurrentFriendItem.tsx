import { FiresideUser } from "@/lib/useUserQuery";

export const CurrentFriendItem = ({
  friend,
}: {
  friend: NonNullable<FiresideUser>;
}) => {
  return (
    <div
      className="w-full border-2 border-accent/50 rounded-md"
      key={friend.id}
    >
      Username:{friend.username}
    </div>
  );
};
