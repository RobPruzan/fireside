import { useState } from "react";
import { useDefinedUser } from "./camps-state";
import { Avatar, AvatarFallback } from '../ui/avatar';
import { SquarePen } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { useMutation } from "@tanstack/react-query";
import { client } from "@/edenClient";

export const Profile = () => {
  const user = useDefinedUser();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [nickname, setNickname] = useState("");
  const activities = [
    { date: "2023-09-01", activity: "Updated profile picture."},
    { date: "2023-08-24", activity: "Changed nickname to 'CoolUser'."},
    { date: "2023-08-15", activity: "Joined the 'Advanced React' camp." }
  ];

  const updateNicknameMutation = useMutation({
    mutationFn: ({ newNickname }:{newNickname: string}) => {
      return client.api.protected.user["update-nickname"].post({ nickname: newNickname });
    },
  });

  const saveChanges = () => {
  if (nickname.trim() !== "") {
    updateNicknameMutation.mutate({ newNickname: nickname }, {
      onSuccess: () => {
        console.log("Nickname updated successfully");
        setEditDialogOpen(false);
      },
      onError: (error: Error) => {
        console.error("Failed to update nickname", error);
      }
    });
  }
};


  return (
    <div className="h-screen w-screen flex">
      <section className="flex-1 flex flex-col justify-start">
        <div className="bg-zinc-900 w-full text-center h-[25%]">
          {/* masthead, will change this later on */}
        </div>

        <div className="absolute top-[calc(25%-5rem)] ml-20">
          <Avatar className="w-36 h-36">
            <AvatarFallback delayMs={600}>
              {user.email[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="mt-20 w-full flex items-center pl-20 pr-20 justify-between">
          <div className="text-5xl text-foreground/30 mr-4">
          {user.displayName || "No Nickname Set"}
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <button>
                <SquarePen className="cursor-pointer" size={24} />
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
              </DialogHeader>
              <DialogDescription>Change your nickname and profile picture.</DialogDescription>
              <Label htmlFor="nickname">Nickname</Label>
              <Input id="nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} />
              <DialogFooter>
                <Button onClick={saveChanges}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="text-md justify-start text-foreground/30 mt-5 pl-20">
          {user.email}
        </div>

        <div className="mt-10 pl-20 pr-20">
          <h2 className="text-md font-semibold mb-10">Recent Activity</h2>
          <div>
          {activities.map((activity, index) => (
              <div key={index} className="flex items-center mb-10">
                <Avatar className="w-10 h-10 mr-4">
                  <AvatarFallback delayMs={600}>
                    {activity.activity[0]} 
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p>{activity.activity}</p>
                </div>
                <div className="text-sm text-gray-500" style={{ marginLeft: "auto" }}>
                  {activity.date}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
