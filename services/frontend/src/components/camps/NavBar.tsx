import { ThemeToggle } from "@/hooks/useTheme";
import { useUserQuery } from "@/lib/useUserQuery";

import { Link, useRouterState } from "@tanstack/react-router";
import { buttonVariants } from "../ui/button";
import { ProfileDropdown } from "../ProfileDropdown";
import { cn } from "@/lib/utils";
import { useCurrentRoute } from "@/hooks/useCurrentRoute";

export const NavBar = () => {
  const user = useUserQuery();
  const match = useCurrentRoute();

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
            disabled={
              match.routeId === "/root/login" ||
              match.routeId === "/root/register"
            }
            to="/register"
            className={buttonVariants({
              variant: "ghost",
              className: cn([
                (match.routeId === "/root/login" ||
                  match.routeId === "/root/register") &&
                  "bg-accent",
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
