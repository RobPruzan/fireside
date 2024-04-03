import * as React from "react";
import Lottie from "react-lottie";
import exampleAnimation from "../ui/raise-hand-animation.json";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const CampTextArea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    const [isHovered, setIsHovered] = React.useState(false);

    const defaultOptions = {
      loop: true,
      autoplay: false,
      animationData: exampleAnimation,
      rendererSettings: {
        preserveAspectRatio: "xMidYMid slice",
      },
    };

    return (
      <div
        className="relative flex items-center"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className="absolute top-0 right-0 z-10 w-full h-full"
          style={{ pointerEvents: "none" }}
        >
          <Lottie
            options={defaultOptions}
            height={30}
            width={30}
            isStopped={!isHovered}
            style={{ position: 'absolute', top: '50%', right: '10px', pointerEvents: 'none' }}
          />
        </div>
        <textarea
          className={cn(
            "appearance-none block w-full bg-background text-sm border border-r-3 border-input rounded-3xl px-3 py-1 leading-snug text-muted-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);

CampTextArea.displayName = "CampTextArea";

export { CampTextArea };
