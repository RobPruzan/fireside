import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import React, { useEffect } from "react";
import { useRouteContext } from "../context/RouteContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/main";
import { useToast } from "./ui/use-toast";
import { useState } from "react";
import { Label } from "./ui/label";
import { User } from "../../../db/src";
import { FiresideUser, userQueryOptions } from "@/lib/useUser";
import { LoadingSpinner } from "./ui/loading";

type CreateUserInfo = {
  email: string;
  password: string;
  confirmedPassword: string;
};

function Register() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createUserMutation = useMutation({
    mutationFn: async (createOpts: CreateUserInfo) => {
      const res = await client.user.create.post(createOpts, {
        fetch: {
          credentials: "include",
        },
      });

      if (res.error) {
        throw new Error(res.error.value);
      }
      return res;
    },
    onError: (e) => {
      toast({
        variant: "destructive",
        title: "Failed to register",
        description: e.message,
      });
    },
    onSuccess: ({ data }) => {
      queryClient.setQueryData<FiresideUser>(
        userQueryOptions.queryKey,
        () => data
      );
      navigate({ to: "/" });
    },
  });
  const navigate = useNavigate({ from: "/register" });

  const [userInfo, setUserInfo] = useState<CreateUserInfo>({
    confirmedPassword: "",
    email: "",
    password: "",
  });
  return (
    <div className={`flex flex-col justify-between w-full `}>
      <div className="flex flex-col items-center justify-start flex-grow pt-32">
        <h2 className={`text-5xl font-semibold mb-10 `}>Sign Up</h2>
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

            <div>
              <Label htmlFor="password" className={`block text-sm font-medium`}>
                Confirm Password
              </Label>
              <Input
                onChange={(e) =>
                  setUserInfo((prev) => ({
                    ...prev,
                    confirmedPassword: e.target.value,
                  }))
                }
                value={userInfo.confirmedPassword}
                id="password"
                type={"password"}
                placeholder={"Confirm Password"}
                className={`mt-1 w-full rounded p-2 dark:bg-secondary border-secondary/90 dark:border-2 bg-muted text-sm`}
              />
            </div>
          </div>
          <Button
            disabled={createUserMutation.isPending}
            onClick={async () => {
              if (userInfo.password !== userInfo.confirmedPassword) {
                toast({
                  variant: "destructive",
                  title: "Passwords don't match",
                });
                return;
              }
              createUserMutation.mutate(userInfo);
            }}
            className={`w-full py-2 rounded font-bold text-white`}
          >
            {createUserMutation.isPending ? <LoadingSpinner /> : "Continue"}
          </Button>
          <Link
            className="text-primary text-sm hover:text-primary/80"
            to="/login"
          >
            Already have an account?
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
