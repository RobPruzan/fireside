import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import React, { useEffect } from "react";
import { useRouteContext } from "../context/RouteContext";
import { Label } from "./ui/label";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/main";
import { FiresideUser, userQueryOptions } from "@/lib/useUser";
import { LoadingSpinner } from "./ui/loading";

function SignUp() {
  const navigate = useNavigate({ from: "/login" });
  const [userInfo, setUserInfo] = useState({
    email: "",
    password: "",
  });
  const queryClient = useQueryClient();
  const loginMutation = useMutation({
    mutationFn: async (loginInfo: typeof userInfo) => {
      const res = await client.user.login.post(loginInfo, {
        fetch: {
          credentials: "include",
        },
      });

      if (res.error) {
        throw new Error(res.error.value);
      }

      switch (res.data.kind) {
        case "success": {
          queryClient.setQueryData<FiresideUser>(
            userQueryOptions.queryKey,
            () => res.data.user
          );
          navigate({ to: "/" });
          return;
        }
      }
    },
  });
  return (
    <div className={`flex flex-col justify-between w-full `}>
      <div className="flex flex-col items-center justify-start flex-grow pt-32">
        <h2 className={`text-5xl font-semibold mb-10 `}>Login</h2>
        <div className="w-full max-w-xs">
          <div className="space-y-4 mb-6">
            <div>
              <Label
                htmlFor={"email-input"}
                className={`block text-sm font-medium`}
              >
                Email
              </Label>
              <Input
                onChange={(e) =>
                  setUserInfo((prev) => ({ ...prev, email: e.target.value }))
                }
                value={userInfo.email}
                id={`email-input`}
                type={"Email"}
                placeholder={"Email"}
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
                  setUserInfo((prev) => ({ ...prev, password: e.target.value }))
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
          <Link
            className="text-primary text-sm hover:text-primary/80"
            to="/register"
          >
            Don't have an account?
          </Link>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
