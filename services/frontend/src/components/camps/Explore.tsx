import { getCampQueryOptions } from "@/lib/useCampsQuery";
import { userQueryOptions } from "@/lib/useUserQuery";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useLoaderData } from "@tanstack/react-router";
import { Input } from "../ui/input";
import { useState } from "react";

export const Explore = () => {
  // const { user } = useLoaderData({ from: "/camp/" });
  const loaderData = useLoaderData({ from: "/camp/" });
  const user =
    useSuspenseQuery({ ...userQueryOptions, initialData: loaderData.user })
      .data ?? loaderData.user;
  const camps =
    useSuspenseQuery(getCampQueryOptions({ userId: user.id })).data ?? [];
  const [searchFilter, setSearchFilter] = useState("");

  return (
    <div className="w-full flex justify-center items-center flex-wrap p-5 gap-4 h-screen overflow-y-auto">
      <Input
        // className="w-"
        placeholder="Search camps"
        className="w-3/4"
        value={searchFilter}
        onChange={(e) => setSearchFilter(e.target.value)}
      />
      {camps
        .filter((camp) =>
          camp.name.toLowerCase().includes(searchFilter.toLowerCase())
        )
        .map((camp) => (
          <div className="h-52 w-52 border rounded-sm">{camp.name}</div>
        ))}
    </div>
  );
};
