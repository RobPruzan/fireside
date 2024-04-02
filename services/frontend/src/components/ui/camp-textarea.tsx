import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const CampTextArea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "appearance-none block w-full md:w-7/8 lg:w-3/4 xl:w-2/3 bg-background text-sm border border-input rounded-2xl px-3 py-3 leading-snug text-muted-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mx-auto",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

CampTextArea.displayName = "CampTextArea";

export { CampTextArea };
