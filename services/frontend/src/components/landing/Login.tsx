import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FiresideUser, userQueryOptions } from "@/lib/useUserQuery";
import { LoadingSpinner } from "../ui/loading";
import { useToast } from "../ui/use-toast";
import { client, dataOrThrow } from "@/edenClient";

function Login() {
  const navigate = useNavigate({ from: "/login" });
  const [userInfo, setUserInfo] = useState({
    username: "",
    password: "",
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const loginMutation = useMutation({
    mutationFn: async (loginInfo: typeof userInfo) => {
      const res = await client.api.user.login.post(loginInfo);

      const data = dataOrThrow(res);

      switch (data.kind) {
        case "success": {
          queryClient.setQueryData<FiresideUser>(
            userQueryOptions.queryKey,
            () => data.user
          );
          navigate({ to: "/camp" });
          return;
        }
      }
    },
    onError: (e) => {
      toast({ variant: "destructive", title: e.message });
    },
  });
  return (
    <div className={`flex flex-col justify-between w-full `}>
      <div className="flex flex-col items-center justify-start flex-grow pt-32">
        <h2 className={`text-5xl font-semibold mb-10 `}>Login</h2>
        <div className="w-full max-w-xs flex flex-col gap-y-2">
          <div className="flex flex-col">
            <div className="space-y-4 mb-6">
              <div>
                <Label
                  htmlFor={"email-input"}
                  className={`block text-sm font-medium`}
                >
                  Username
                </Label>
                <Input
                  onChange={(e) =>
                    setUserInfo((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  value={userInfo.username}
                  id={`email-input`}
                  placeholder={"Username"}
                  className={`mt-1 w-full rounded p-2 border-secondary/90 dark:border-2 text-sm `}
                />
              </div>
              <div>
                <Label
                  htmlFor={"password-input"}
                  className={`block text-sm font-medium`}
                >
                  Password
                </Label>
                <Input
                  onChange={(e) =>
                    setUserInfo((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  value={userInfo.password}
                  id={"password-input"}
                  type={"password"}
                  placeholder={"Password"}
                  className={`mt-1 w-full rounded p-2 border-secondary/90 dark:border-2 text-sm `}
                />
              </div>
            </div>

            <Button
              disabled={loginMutation.isPending}
              onClick={() => {
                loginMutation.mutate(userInfo);
              }}
              className={`w-full py-2 rounded font-bold text-white`}
            >
              {loginMutation.isPending ? <LoadingSpinner /> : "Continue"}
            </Button>
          </div>
          <div>
            <Link
              className="text-primary text-sm hover:text-primary/80 mt-3"
              to="/register"
            >
              Don't have an account?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
