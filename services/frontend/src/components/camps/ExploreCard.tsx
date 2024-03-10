import { useJoinCampMutation, useUserCamps } from "./camps-state";
import { Button } from "../ui/button";
import { LoadingSpinner } from "../ui/loading";
import { FiresideCamp } from "@fireside/db";
import { CheckCircle } from "lucide-react";

export const ExploreCard = ({
  camp,
}: {
  camp: FiresideCamp & { count: number };
}) => {
  const joinCampMutation = useJoinCampMutation();
  const { camps } = useUserCamps();
  return (
    <div
      key={camp.id}
      className="h-40 w-full rounded-sm border-2 border-accent/50 p-3"
    >
      <div>Member count: {camp.count}</div>
      <div>{camp.name}</div>

      <div>
        {!camps.some((userCamp) => userCamp.id === camp.id) ? (
          <Button
            onClick={() => {
              joinCampMutation.mutate({ campId: camp.id });
            }}
          >
            {joinCampMutation.isPending ? <LoadingSpinner /> : "Join Camp"}
          </Button>
        ) : (
          <div className="flex gap-x-2 items-center">
            <span>Joined</span> <CheckCircle className="text-green-500" />
          </div>
        )}
        <div>{new Date(camp.createdAt).toLocaleString()}</div>
      </div>
    </div>
  );
};
