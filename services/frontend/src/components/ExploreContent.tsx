import { useParams } from "@tanstack/react-router";
import React from "react";

type Props = {};

export const ExploreContent = () => {
  const { campId } = useParams({ from: "/explore/$campId" });

  return <div>ExploreContent</div>;
};
