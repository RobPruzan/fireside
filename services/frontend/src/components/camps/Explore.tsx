import React, { useEffect, useState } from "react";
import { Input } from "../ui/input";
import { useAllCamps, useCreateCampMutation } from "./camps-state";
import { ExploreCard } from "./ExploreCard";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../ui/dialog";

import { PlusCircle, Image, DoorOpen } from "lucide-react";
import { CreateCampDialog } from "./CreateCampDialog";

export const Explore = () => {
  const { camps } = useAllCamps();
  const [searchFilter, setSearchFilter] = useState("");
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("hasVisited")) {
      setShowWelcomeDialog(true);
      localStorage.setItem("hasVisited", "true");
    }
  }, []);

  return (
    <div className="w-full flex flex-col justify-center items-center p-5 gap-4 h-[100dvh] overflow-y-auto">
      {showWelcomeDialog && (
        <Dialog open={showWelcomeDialog} onOpenChange={setShowWelcomeDialog}>
          <DialogContent className="fixed left-[50%] top-[50%] z-50 grid max-w-xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-8 shadow-lg duration-200 ...">
            <DialogTitle className="text-center">
              Welcome to Fireside!
            </DialogTitle>

            <ul className="list-decimal pl-6 space-y-2 text-left">
              <li className="flex items-center gap-2">
                <PlusCircle className="mt-1 h-5 w-5 text-accent" />
                Press the{" "}
                <strong>
                  <PlusCircle
                    style={{ height: 16, width: 16, paddingTop: 2 }}
                  />
                </strong>{" "}
                icon to start
              </li>

              <li className="flex items-start gap-2">
                <Image className="mt-1 h-5 w-5 text-accent" />
                Once created, your new chatroom will appear on the right
              </li>

              <li className="flex items-start gap-2">
                <DoorOpen className="mt-1 h-5 w-5 text-accent" />
                To join, click <strong>View</strong>
              </li>
            </ul>
            <DialogClose asChild>
              <button
                onClick={() => setShowWelcomeDialog(false)}
                className="mt-4 rounded bg-red-500 py-2 px-4 text-white hover:bg-red-700"
              >
                Close
              </button>
            </DialogClose>
          </DialogContent>
        </Dialog>
      )}
      <div className="flex justify-start w-full ">
        <Input
          placeholder="Search camps"
          className="w-1/2"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
        />
      </div>
      <div className="h-full flex flex-wrap items-start gap-4 overflow-y-auto">
        <CreateCampDialog />
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
