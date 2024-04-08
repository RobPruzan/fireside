import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { PlusCircle } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { useCreateCampMutation } from "./camps-state";
import { LoadingSpinner } from "../ui/loading";
import { cn } from "@/lib/utils";

export const CreateCampDialog = ({ className }: { className?: string }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const createCampMutation = useCreateCampMutation();
  const [newCampRoomName, setNewCampRoomName] = useState("");

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button
          className={cn([
            "w-full text-lg flex gap-x-3 justify-center items-center",
            className,
          ])}
          variant={"ghost"}
        >
          <PlusCircle />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create camp room</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <Label htmlFor="camp-room-name">Name</Label>
        <Input
          value={newCampRoomName}
          onChange={(e) => setNewCampRoomName(e.target.value)}
          className="camp-room-name"
        />
        <DialogFooter>
          <Button
            onClick={() => {
              setDialogOpen(false);
            }}
            variant={"outline"}
          >
            Cancel
          </Button>
          <Button
            className="min-w-[78px]"
            onClick={() => {
              createCampMutation.mutate({
                name: newCampRoomName,
              });
              setDialogOpen(false);
            }}
          >
            {createCampMutation.isPending ? <LoadingSpinner /> : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
