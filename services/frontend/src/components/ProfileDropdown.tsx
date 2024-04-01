import {
  FiresideUser,
  useUserQuery,
  userQueryOptions,
} from "@/lib/useUserQuery";
import { run } from "@fireside/utils";
import { LoadingSpinner } from "./ui/loading";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { CircleUser } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "./ui/use-toast";
import { client, dataOrThrow } from "@/edenClient";
import { useState } from "react";

export const ProfileDropdown = () => {
  const user = useUserQuery();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return dataOrThrow(await client.api.protected.user["log-out"].post());
    },
    onSuccess: () => {
      setOpen(false);
      navigate({
        to: "/",
      });
      queryClient.setQueryData<FiresideUser>(userQueryOptions.queryKey, null);
      toast({
        title: "Logged out!",
      });
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Could not log out",
        description: err.message,
      });
    },
  });
  return run(() => {
    switch (user.status) {
      case "error": {
        return null;
      }
      case "pending": {
        return <LoadingSpinner />;
      }

      case "success": {
        if (user.data) {
          return (
            <DropdownMenu
              open={open}
              onOpenChange={(v) => {
                setOpen(v);
              }}
            >
              <DropdownMenuTrigger asChild>
                <Button variant={"ghost"}>
                  <CircleUser />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>{user.data.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    logoutMutation.mutate();
                  }}
                >
                  {logoutMutation.isPending ? <LoadingSpinner /> : "Logout"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }
      }
    }
  });
};
