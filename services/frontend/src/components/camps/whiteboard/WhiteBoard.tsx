import { buttonVariants } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { XIcon } from "lucide-react";
import { useRef } from "react";

export const WhiteBoard = ({}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  return (
    <>
      <Link
        from="/camp/$campId"
        preload={false}
        search={(prev) => ({ ...prev, whiteBoardId: undefined })}
        className={buttonVariants({
          className: "absolute top-1 right-1",
          variant: "ghost",
        })}
      >
        <XIcon />
      </Link>
      <canvas className="h-full w-full bg-white" ref={canvasRef} />
    </>
  );
};
