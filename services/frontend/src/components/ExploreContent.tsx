import { useParams } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { client } from "@/main";

export const ExploreCamp = () => {
  const { id } = useParams({ from: "/explore/$id" });
  // maybe a layout page for searching, then in the inner we get id, onclick of an explored camp it renders in the child, that would be neat
  return (
    <div>
      <Button
        onClick={() => {
          client.protected.camp.join.post({
            camp_id: id,
          });
        }}
      ></Button>
    </div>
  );
};
