import { FiresideUser } from "@/lib/useUserQuery";
import { Button } from "../ui/button";
import { LoadingSpinner } from "../ui/loading";
import { useMakeFriendRequestMutation } from "./friends-state";
import { run } from "@fireside/utils";
import { Check, Heart } from "lucide-react";

export const SearchFriendItem = ({
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
      <div>{externalUser.username}</div>
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
