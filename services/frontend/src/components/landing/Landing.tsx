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
    <div>
      {/* Initial hero section */}
      <div className="text-center mt-16 w-full p-10">
        <h2 className={`text-6xl font-bold mt-24 `}>
          Empowering Education,
          <br />
          one connection at a time.
        </h2>
        <p className={`mt-8 `}>
          Fireside is the connected workspace where students get answers
        </p>
        {/* Existing button logic */}
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
      
      <div className="flex justify-between items-center mt-32 my-20 p-10">
        <div className="w-1/2">
          {/* placeholder for image */}
        </div>
        <div className="w-1/2 text-left pl-10">
          <h3 className="text-4xl font-bold">Get Answers When You Need Them Most</h3>
          <p className="mt-8 ">Post your questions and get detailed, understandable answers quickly from peers and educators alike. With features like upvoting and expert verification, you're ensured quality responses that make learning simpler and more effective."</p>
        </div>
      </div>

      <div className="flex justify-between items-center my-20 p-10">
        <div className="w-1/2 text-right pr-10">
          <h3 className="text-4xl font-bold">Study Smarter, Together</h3>
          <p className="mt-8">Unlock the power of group learning with collaborative campsites. Join a study group to share resources, quiz each other, and tackle challenging concepts as a team. Real-time chat and video calls make it feel like you're studying together in person, no matter where you are.</p>
        </div>
        <div className="w-1/2">
          {/* placeholder for image */}
        </div>
      </div>

      <div className="flex justify-between items-center my-20 p-10">
        <div className="w-1/2">
          {/* placeholder for image */}
        </div>
        <div className="w-1/2 text-left pl-10">
          <h3 className="text-4xl font-bold">Unlock Your Learning Potential</h3>
          <p className="mt-8">Join Fireside today and tap into a world of expert knowledge and resources tailored to your educational journey. By registering, you gain exclusive access to advanced study tools, personalized learning paths, and a global community of learners and educators ready to share their insights</p>
        </div>
      </div>
      <div className="text-center mt-32 my-20 p-10">
        <h3 className="text-6xl font-bold mb-8">Ready to get started?</h3>
        {run(() => {
          switch (user.status) {
            case "pending": {
              return (
                <Button
                  size={"lg"}
                  disabled
                  className="px-6 py-3 rounded font-bold bg-foreground text-white dark:text-black"
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
                        params: { id: "hello" },
                      });
                    }}
                    className="px-6 py-3 rounded font-bold bg-foreground text-white dark:text-black"
                  >
                    Explore
                  </Button>
                );
              }
              return (
                <Button
                  size={"lg"}
                  onClick={handleGetStartedClick}
                  className="px-6 py-3 rounded font-bold bg-foreground text-white dark:text-black"
                >
                  Let's go!
                </Button>
              );
            }
          }
        })}
      </div>
    </div>
  );
}

export default Landing;
