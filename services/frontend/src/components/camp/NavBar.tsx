import { ThemeToggle } from "@/hooks/useTheme";
import { useUser } from "@/lib/useUser";

import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Button, buttonVariants } from "../ui/button";
import { useToast } from "../ui/use-toast";
import { ProfileDropdown } from "../ProfileDropdown";
import { cn } from "@/lib/utils";

export const NavBar = () => {
  const user = useUser();
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
          <Link
            to="/register"
            className={buttonVariants({
              variant: "ghost",
              className: cn([
                router.location.pathname === "/register" ||
                  (router.location.pathname === "/login" && "bg-accent"),
              ]),
            })}
          >
            Get Started
          </Link>
        )}
      </div>
    </div>
  );
};
