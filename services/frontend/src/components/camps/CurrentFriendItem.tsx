import { FiresideUser } from "@/lib/useUserQuery";

export const CurrentFriendItem = ({
  friend,
}: {
  friend: NonNullable<FiresideUser>;
}) => {
  return (
    <div
      className="w-full border-accent/50 rounded-md"
      key={friend.id}
    >
      Email:{friend.email}
    </div>
  );
};
