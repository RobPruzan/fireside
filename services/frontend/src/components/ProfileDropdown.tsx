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

import { useMutation } from "@tanstack/react-query";
import { toast } from "./ui/use-toast";
import { queryClient } from "@/routes";
import { client } from "@/edenClient";
//
export const ProfileDropdown = () => {
  const user = useUserQuery();
  const navigate = useNavigate();
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await client.protected.user["log-out"].post();
      if (res.error) {
        throw new Error(res.error.value);
      }

      return res.data;
    },
    onSuccess: () => {
      queryClient.setQueryData<FiresideUser>(userQueryOptions.queryKey, null);
      toast({
        title: "Logged out!",
      });
      navigate({
        to: "/",
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
            <DropdownMenu>
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
                <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
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
