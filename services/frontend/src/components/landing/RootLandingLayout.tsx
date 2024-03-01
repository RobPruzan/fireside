import { ThemeToggle, useTheme } from "@/hooks/useTheme";
import { useUser, FiresideUser, userQueryOptions } from "@/lib/useUser";
import { cn } from "@/lib/utils";
import { client } from "@/main";
import { run } from "@fireside/utils";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  useNavigate,
  useRouterState,
  Outlet,
  Link,
} from "@tanstack/react-router";
import { CircleUser } from "lucide-react";
import { Button } from "../ui/button";
import { LoadingSpinner } from "../ui/loading";
import { Toaster } from "../ui/toaster";
import { useToast } from "../ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export const RootLandingLayout = () => {
  const { theme, setTheme } = useTheme();
  const user = useUser();
  const navigate = useNavigate({
    from: "/",
  });
  const router = useRouterState();

  const toggleTheme = () => {
    setTheme(theme.value === "light" ? "dark" : "light");
  };

  const handleLoginClick = () => {
    navigate({ to: "/login" });
  };

  const { toast } = useToast();

  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await client.protected.user["log-out"].post({
        $fetch: {
          credentials: "include",
        },
      });
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
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Could not log out",
        description: err.message,
      });
    },
  });
  return (
    <div className="min-h-calc flex flex-col items-start w-screen justify-start">
      <div className="flex justify-between items-center mx-auto w-full px-10 h-16">
        <Link to="/" className="flex items-center">
          <img src={"/bonfire.png"} alt="Logo" className="h-8 w-8 mr-2" />
          <span className={`text-xl`}>Fireside</span>
        </Link>
        <div className="flex items-center">
          <ThemeToggle />
          <div className="mx-3 h-6 w-px bg-foreground"></div>

          {run(() => {
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
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => navigate({ to: "/profile" })}
                        >
                          Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => logoutMutation.mutate()}
                        >
                          Logout
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                }
                return (
                  <Button
                    disabled={router.location.pathname === "/register"}
                    variant={"ghost"}
                    onClick={() => {
                      navigate({ to: "/register" });
                    }}
                    className={`px-4 py-2 rounded`}
                  >
                    Get Started
                  </Button>
                );
              }
            }
          })}
          {!user.data && (
            <Button
              variant={"ghost"}
              disabled={router.location.pathname === "/login"}
              onClick={handleLoginClick}
              className={"text-sm mr-3 "}
            >
              Log in
            </Button>
          )}
        </div>
      </div>
      <Toaster />
      <Outlet />
      <ReactQueryDevtools buttonPosition="bottom-left" />
    </div>
  );
};
