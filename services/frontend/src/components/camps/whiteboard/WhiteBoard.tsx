import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { Eraser, XIcon, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { render } from "react-dom";
const genLineId = () => "line_" + crypto.randomUUID();
const genDrawingPointId = () => "drawing_point_" + crypto.randomUUID();
type Point = {
  x: number;
  y: number;
  pointId: string;
  color: string;
};

const cameraPOV = ({
  x,
  y,
  camera,
}: {
  x: number;
  y: number;
  camera: { x: number; y: number };
}) => ({ x: x - camera.x, y: y - camera.y });

const colors = [
  "blue",
  "red",
  "green",
  // "orange",
  "black",
  "white",
  // "brown",
] as const;

export const WhiteBoard = ({}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [drawnPoints, setDrawnPoints] = useState<Array<Array<Point>>>([]);
  const currentMousePositionRef = useRef<{ x: number; y: number } | null>(null);
  const [drawingPoints, setDrawingPoints] = useState<Array<Point>>([]);
  const [erased, setErased] = useState<Array<{ x: number; y: number }>>([]);

  const mouseCords = currentMousePositionRef.current;

  const parentCanvasRef = useRef<HTMLDivElement | null>(null);
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const [selectedTool, setSelectedTool] = useState<
    { kind: "marker"; color: (typeof colors)[number] } | { kind: "eraser" }
  >({ kind: "marker", color: "blue" });
  const render = () => {
    const canvasEl = canvasRef.current!;
    const parentEl = parentCanvasRef.current!;

    const ctx = canvasEl.getContext("2d")!;

    const dpr = window.devicePixelRatio;
    const rect = parentEl.getBoundingClientRect();

    canvasEl.width = rect.width * dpr;
    canvasEl.height = rect.height * dpr;

    canvasEl.style.width = `${rect.width}px`;
    canvasEl.style.height = `${rect.height}px`;

    ctx.scale(dpr, dpr);

    ctx.save();

    ctx.translate(camera.x, camera.y);

    const drawLine = ({
      points,
      initialPoint,
    }: {
      points: Array<Point>;
      initialPoint: Point;
    }) => {
      ctx.moveTo(initialPoint.x, initialPoint.y);
      ctx.strokeStyle = initialPoint.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      points.forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    };

    const pointsArr = [drawingPoints, ...drawnPoints];

    pointsArr.forEach((points) => {
      const initialPoint = points.at(0);
      if (initialPoint) {
        drawLine({ points, initialPoint });
      }
    });

    ctx.beginPath();
    ctx.strokeStyle = "white";
    ctx.fillStyle = "white";
    ctx.lineWidth = 55;
    erased.forEach((erasedPoint) => {
      ctx.lineTo(erasedPoint.x, erasedPoint.y);
    });
    ctx.stroke();

    ctx.fillStyle = "black";
    if (selectedTool.kind === "eraser" && mouseCords) {
      const radius = 20;
      const borderWidth = 1;

      ctx.beginPath();
      ctx.arc(mouseCords?.x, mouseCords.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = "white";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(
        mouseCords.x,
        mouseCords?.y,
        radius + borderWidth,
        0,
        2 * Math.PI
      );
      ctx.strokeStyle = "black";
      ctx.lineWidth = borderWidth;
      ctx.stroke();
    }

    ctx.stroke();

    ctx.restore();
  };

  const [_, setUpdate] = useState(false);

  useEffect(() => {
    const parentCanvasEl = parentCanvasRef.current!;

    const observer = new ResizeObserver(() => {
      setUpdate((prev) => !prev);
    });

    observer.observe(parentCanvasEl);

    return () => observer.unobserve(parentCanvasEl);
  }, [render]);

  useEffect(() => {
    render();
  }, [render]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setCamera((prev) => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    };
    canvasRef.current?.addEventListener("wheel", handleWheel);

    return () => canvasRef.current?.removeEventListener("wheel", handleWheel);
  }, []);

  return (
    <div ref={parentCanvasRef} className="w-full h-full relative">
      <Link
        from="/camp/$campId"
        preload={false}
        search={(prev) => ({ ...prev, whiteBoardId: undefined })}
        className={buttonVariants({
          className: "absolute top-1 right-1 ",
          variant: "ghost",
        })}
      >
        <XIcon />
      </Link>

      <div className="absolute bottom-2 border border-gray-200 bg-opacity-50 backdrop-blur-md right-[7px] rounded-lg p-3  flex justify-evenly items-center w-[95%]">
        {colors.map((color) => (
          <Button
            key={color}
            onClick={() => setSelectedTool({ kind: "marker", color: color })}
            style={{
              backgroundColor: color,
              // borderColor:
            }}
            className={cn([
              "rounded-full w-10 h-10 hover:bg-inherit transition",
              color === "white" && "border",
              selectedTool.kind === "marker" &&
                color === selectedTool.color &&
                "border-2 border-inherit/50  scale-110",
            ])}
          />
        ))}
        <Button
          onClick={() => setSelectedTool({ kind: "eraser" })}
          variant={"ghost"}
          className={cn([
            "rounded-full w-10 h-10 p-0 bg-white hover:bg-inherit transition",
            selectedTool.kind === "eraser" && "scale-110 border-2 ",
          ])}
        >
          <Eraser className="text-black" />
        </Button>
      </div>
      <canvas
        onMouseLeave={() => {
          setIsMouseDown(false);
          currentMousePositionRef.current = null;
          setDrawnPoints((prev) => [...prev, drawingPoints]);
          setDrawingPoints([]);
        }}
        onMouseUp={() => {
          setIsMouseDown(false);
          setDrawnPoints((prev) => [...prev, drawingPoints]);
          setDrawingPoints([]);
        }}
        onMouseMove={(e) => {
          currentMousePositionRef.current = cameraPOV({
            camera,
            x: e.nativeEvent.offsetX,
            y: e.nativeEvent.offsetY,
          });
          if (!mouseCords) {
            return;
          }

          if (!isMouseDown) {
            return;
          }
          switch (selectedTool.kind) {
            case "marker": {
              setDrawingPoints((prev) => [
                ...prev,
                {
                  ...mouseCords,
                  color: selectedTool.color,
                  pointId: genDrawingPointId(),
                },
              ]);

              return;
            }
            // disable till we think of a good way to erase
            // case "eraser": {
            //   if (!isMouseDown) {
            //     return;
            //   }
            //   setErased((prev) => [...prev, mouseCords]);
            //   // setDrawnPoints((drawnPoints) =>
            //   //   drawnPoints.map((points) =>
            //   //     points.filter(
            //   //       (point) =>
            //   //         point.x !== e.nativeEvent.offsetX &&
            //   //         point.y !== e.nativeEvent.offsetY
            //   //     )
            //   //   )
            //   // );
            // }
          }
        }}
        onMouseDown={(e) => {
          setIsMouseDown(true);
        }}
        className="bg-white w-full h-full overflow-hidden touch-none"
        ref={canvasRef}
      />
    </div>
  );
};
