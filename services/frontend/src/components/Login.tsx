import { useNavigate } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import React, { useEffect } from "react";
import { useRouteContext } from "../context/RouteContext";

function Login() {
  const navigate = useNavigate({ from: "/login" });
  const { setIsLoginOrRegister } = useRouteContext();

  useEffect(() => {
    setIsLoginOrRegister(true);
    return () => setIsLoginOrRegister(false); 
  }, []);

  return (
    <div className={`flex flex-col justify-between w-full `}>
      <div className="flex flex-col items-center justify-start flex-grow pt-32">
        <h2 className={`text-5xl font-semibold mb-10 `}>Sign Up</h2>
        <div className="w-full max-w-xs">
          <div className="space-y-4 mb-6">
            {["Email", "Password"].map((label, index) => (
              <div key={index}>
                <label className={`block text-sm font-medium`}>{label}</label>
                <Input
                  type={label === "Email" ? "email" : "password"}
                  placeholder={`${label}`}
                  className={`mt-1 w-full rounded p-2 border-secondary/70 border-2 text-sm `}
                />
              </div>
            ))}
          </div>
          <Button
            onClick={() => {
              navigate({ to: "/" });
            }}
            className={`w-full py-2 rounded font-bold text-white`}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Login;
