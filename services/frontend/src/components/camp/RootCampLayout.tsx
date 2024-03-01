import { ThemeToggle } from "@/hooks/useTheme";
import { Outlet } from "@tanstack/react-router";
import { ArrowLeftIcon, ChevronLeft } from "lucide-react";

export const RootCampLayout = () => {
  return (
    <div className="h-screen w-screen flex">
      <div className="w-1/6 min-w-[200px] border-r-2 border-r-accent h-full">
        fdsaf what
        <div className="h-5/6"></div>
        <div className="h-1/6 min-h-[50px] flex items-center p-4">
          <ThemeToggle />
        </div>
      </div>
      <div className="w-2/6 h-full flex flex-col">
        <div className="h-1/6 flex justify-end p-4">
          <ChevronLeft />
        </div>
      </div>
      <div className="flex w-3/6 h-full">
        <Outlet />
      </div>
    </div>
  );
};
