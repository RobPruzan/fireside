import { useNavigate } from "@tanstack/react-router";

import { Button } from "../ui/button";
import { useUserQuery } from "@/lib/useUserQuery";
import { run } from "@fireside/utils";
import { LoadingSpinner } from "../ui/loading";

function Landing() {
  const navigate = useNavigate({
    from: "/",
  });

  const handleGetStartedClick = () => {
    navigate({ to: "/register" });
  };

  const user = useUserQuery();

  return (
    <div className="text-center mt-16 w-full p-8">
      <h2 className={`text-5xl font-bold mt-24 `}>
        Empowering Education,
        <br />
        one connection at a time.
      </h2>
      <p className={`mt-8 `}>
        Fireside is the connected workspace where students get answers
      </p>
      {run(() => {
        switch (user.status) {
          case "pending": {
            return (
              <Button
                size={"lg"}
                disabled
                className={
                  "mt-10 px-6 py-3 rounded font-bold bg-foreground text-white dark:text-black"
                }
              >
                <LoadingSpinner />
              </Button>
            );
          }
          case "error": {
            return null;
          }
          case "success": {
            if (user.data) {
              return (
                <Button
                  size={"lg"}
                  onClick={() => {
                    navigate({
                      to: `/camp`,
                      params: {
                        id: "hello",
                      },
                    });
                  }}
                  className={
                    "mt-10 px-6 py-3 rounded font-bold bg-foreground text-white dark:text-black"
                  }
                >
                  Explore
                </Button>
              );
            }
            return (
              <Button
                size={"lg"}
                onClick={handleGetStartedClick}
                className={
                  "mt-10 px-6 py-3 rounded font-bold bg-foreground text-white dark:text-black"
                }
              >
                Get Started
              </Button>
            );
          }
        }
      })}
    </div>
  );
}

export default Landing;
