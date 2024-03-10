import { Input } from "../ui/input";
import { useState } from "react";
import { useAllCamps, useJoinCampMutation, useUserCamps } from "./camps-state";
import { Button } from "../ui/button";
import { LoadingSpinner } from "../ui/loading";
import { FiresideCamp } from "@fireside/db";
import { CheckCircle } from "lucide-react";
import { ExploreCard } from "./ExploreCard";

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
          .toSorted(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
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
