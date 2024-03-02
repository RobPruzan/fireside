import { Input } from "../ui/input";
import { useState } from "react";
import { useCamps } from "./camp-state";

export const Explore = () => {
  const { camps } = useCamps();
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
      <div className="h-[90%] flex flex-wrap gap-4">
        {" "}
        {camps
          .filter((camp) =>
            camp.name.toLowerCase().includes(searchFilter.toLowerCase())
          )
          .map((camp) => (
            <div key={camp.id} className="h-52 w-52 border rounded-sm">
              {camp.name}
            </div>
          ))}
      </div>
    </div>
  );
};
