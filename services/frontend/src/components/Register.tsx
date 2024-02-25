import React from "react";
import { useTheme } from "../hooks/useTheme";
import logo from "../assets/bonfire.png";
import { useNavigate } from "@tanstack/react-router";

function Register() {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const navigateHome = () => {
    navigate({ to: "/" });
  };

  return (
    <div
      className={`flex flex-col justify-between min-h-screen w-full ${
        theme.value === "light" ? "bg-[#F8F8F8]" : "bg-[#161616]"
      }`}
    >
      <div className="p-8">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div
            className="flex items-center cursor-pointer"
            onClick={navigateHome}
          >
            <img src={logo} alt="Logo" className="h-8 w-8 mr-2" />
            <h1
              className={`text-xl ${
                theme.value === "light" ? "text-black" : "text-white"
              }`}
            >
              Fireside
            </h1>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center flex-grow">
        <h2
          className={`text-5xl font-semibold mb-10 bototm-10 ${
            theme.value === "light" ? "text-black" : "text-white"
          }`}
        >
          Sign Up
        </h2>
        <div className="w-full max-w-xs">
          <div className="space-y-4 mb-6">
            {["Email", "Password", "Confirm Password"].map((label, index) => (
              <div key={index}>
                <label
                  className={`block text-sm font-medium ${
                    theme.value === "light" ? "text-black" : "text-white"
                  }`}
                >
                  {label}
                </label>
                <input
                  type={label === "Email" ? "email" : "password"}
                  placeholder={`${label}`}
                  className={`mt-1 w-full rounded p-2 ${
                    theme.value === "light"
                      ? "bg-[#E6E6E6] border-[#C1C1C1]"
                      : "bg-[#232323] border-[#232323]"
                  } border text-sm`}
                />
              </div>
            ))}
          </div>
          <button
            className={`w-full py-2 rounded font-bold text-white ${
              theme.value === "light" ? "bg-[#FBCE76]" : "bg-[#FCAB6B]"
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

export default Register;
