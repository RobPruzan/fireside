import React from "react";
import { useTheme } from "../hooks/useTheme";
import { useNavigate } from "@tanstack/react-router"; 
import darkAsset from "../assets/dark.png";
import lightAsset from "../assets/light.png";
import logo from "../assets/bonfire.png";

function Landing() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate(); 

  const toggleTheme = () => {
    setTheme(theme.value === "light" ? "dark" : "light");
  };

  const handleLoginClick = () => {
    navigate({to: "/login"});
  };

  const handleGetStartedClick = () => {
    navigate({to: "/register"});
  };

  return (
    <div
      className={`min-h-screen w-full p-8 ${
        theme.value === "light" ? "bg-[#F8F8F8]" : "bg-[#161616]"
      }`}
    >
      <div className="flex justify-between items-center max-w-4xl mx-auto">
        <div className="flex items-center">
          <img src={logo} alt="Logo" className="h-8 w-8 mr-2" />
          <h1
            className={`text-xl ${
              theme.value === "light" ? "text-black" : "text-white"
            }`}
          >
            Fireside
          </h1>
        </div>
        <div className="flex items-center">
          <button onClick={toggleTheme} className="mr-3">
            <img
              src={theme.value === "light" ? lightAsset : darkAsset}
              alt="Theme toggle"
              className="h-6 w-6"
            />
          </button>
          <div className="mx-3 h-6 w-px bg-gray-400"></div>
          <button
            onClick={handleLoginClick}  
            className={`text-sm mr-3 ${
              theme.value === "light" ? "text-black" : "text-white"
            }`}
          >
            Log in
          </button>
          <button
            onClick={handleGetStartedClick}
            className={`px-4 py-2 rounded ${
              theme.value === "light"
                ? "bg-black text-white"
                : "bg-white text-black"
            }`}
          >
            Get Started
          </button>
        </div>
      </div>
      <div className="text-center mt-16">
        <h2
          className={`text-5xl font-bold mt-24 ${
            theme.value === "light" ? "text-black" : "text-white"
          }`}
        >
          Empowering Education,
          <br />
          one connection at a time.
        </h2>
        <p
          className={`mt-8 ${
            theme.value === "light" ? "text-black" : "text-white"
          }`}
        >
          Fireside is the connected workspace where students get answers
        </p>
        <button
          onClick={handleGetStartedClick} 
          className={`mt-10 px-6 py-3 rounded font-bold ${
            theme.value === "light"
              ? "bg-black text-white"
              : "bg-white text-black"
          }`}
        >
          Get Started
        </button>
      </div>
    </div>
  );
}

export default Landing;
