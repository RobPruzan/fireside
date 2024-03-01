import { useMatch, useParams } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { client, exploreRoute } from "@/main";

export const ExploreCamp = () => {
  return (
    <div>
      <Button
        onClick={async () => {
          const res = await client.protected.camp.create.post({
            name: "whatever",
          });
          console.log({ res });
        }}
      >
        Make camp
      </Button>
    </div>
  );
};
