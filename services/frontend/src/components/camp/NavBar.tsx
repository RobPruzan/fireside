import { ThemeToggle } from "@/hooks/useTheme";
import { useUser } from "@/lib/useUser";

import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Button } from "../ui/button";
import { useToast } from "../ui/use-toast";
import { ProfileDropdown } from "../ProfileDropdown";

export const NavBar = () => {
  const user = useUser();
  const navigate = useNavigate({
    from: "/",
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouterState();

  return (
    <div className="flex justify-between items-center mx-auto w-full px-10 h-16">
      <Link to="/" className="flex items-center">
        <img src={"/bonfire.png"} alt="Logo" className="h-8 w-8 mr-2" />
        <span className={`text-xl`}>Fireside</span>
      </Link>
      <div className="flex items-center">
        <ThemeToggle />
        <div className="mx-3 h-6 w-px bg-foreground"></div>
        <ProfileDropdown />

        {!user.data && (
          <>
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
            <Button
              variant={"ghost"}
              disabled={router.location.pathname === "/login"}
              onClick={() => {
                navigate({ to: "/login" });
              }}
              className={"text-sm mr-3 "}
            >
              Log in
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
