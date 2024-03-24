import { useJoinCampMutation, useUserCamps } from "./camps-state";
import { Button, buttonVariants } from "../ui/button";
import { LoadingSpinner } from "../ui/loading";
import { FiresideCamp } from "@fireside/db";
import { CheckCircle, DoorClosed, DoorOpen, Image } from "lucide-react";
import { Link } from "@tanstack/react-router";

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
      className="h-52 w-52 rounded-sm border-2 border-accent/50 p-3"
    >
      <div className="h-1/2 grid place-items-center">
        <Image size={50} />
      </div>
      <div className="font-semibold text-lg">{camp.name}</div>
      <div>Members: {camp.count}</div>

      <div>
        {!camps.some((userCamp) => userCamp.id === camp.id) ? (
          <Button
            className="w-full gap-x-3"
            onClick={() => {
              joinCampMutation.mutate({ campId: camp.id });
            }}
          >
            {joinCampMutation.isPending ? <LoadingSpinner /> : "Join"}
            <DoorClosed />
          </Button>
        ) : (
          <Link
            to="/camp/$campId"
            params={{
              campId: camp.id,
            }}
            className={buttonVariants({
              className: "w-full gap-x-3 flex",
            })}
          >
            View <DoorOpen />
          </Link>
        )}
        {/* <div>{new Date(camp.createdAt).toLocaleString()}</div> */}
      </div>
    </div>
  );
};
