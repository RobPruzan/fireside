import { Input } from "../ui/input";
import { useState } from "react";
import { useAllCamps, useJoinCampMutation, useUserCamps } from "./camp-state";
import { Button } from "../ui/button";
import { LoadingSpinner } from "../ui/loading";
import { FiresideCamp } from "@fireside/db";

export const Explore = () => {
  const { camps } = useAllCamps();
  const [searchFilter, setSearchFilter] = useState("");
  return (
    <div className="w-full flex flex-col justify-center items-center p-5 gap-4 h-screen overflow-y-auto">
      <div className="h-[10%] flex w-full ">
        <Input
          placeholder="Search camps"
          className="w-1/2"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
        />
      </div>
      <div className="h-[90%] flex flex-wrap gap-4 overflow-y-auto">
        {camps
          .filter((camp) =>
            camp.name.toLowerCase().includes(searchFilter.toLowerCase())
          )
          .map((camp) => (
            <ExploreCard key={camp.id} camp={camp} />
          ))}
      </div>
    </div>
  );
};

const ExploreCard = ({ camp }: { camp: FiresideCamp & { count: number } }) => {
  const joinCampMutation = useJoinCampMutation();

  return (
    <div
      key={camp.id}
      className="h-40 w-full rounded-sm border-2 border-accent/50 p-3"
    >
      <div>Member count: {camp.count}</div>
      <div>{camp.name}</div>

      <div>
        <Button
          onClick={() => {
            joinCampMutation.mutate({ campId: camp.id });
          }}
        >
          {joinCampMutation.isPending ? <LoadingSpinner /> : "Join Camp"}
        </Button>
      </div>
    </div>
  );
};
