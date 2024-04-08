import { Loader2 } from "lucide-react";

export const LoadingSpinner = () => {
  return <Loader2 className="animate-spin" />;
};

export const LoadingScreen = () => {
  return (
    <div className="h-[100dvh] w-screen flex items-center justify-center">
      <Loader2 className="animate-spin" />
    </div>
  );
};

export const LoadingSection = () => {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <Loader2 className="animate-spin" />
    </div>
  );
};
