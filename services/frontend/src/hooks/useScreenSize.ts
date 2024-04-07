import { run } from "@fireside/utils";
import { useEffect } from "react";
type SizeEventHandler = (size: number) => void;
type SizeHandlers = {
  onExtraSmall: SizeEventHandler;
  onSmall: SizeEventHandler;
  onMedium: SizeEventHandler;
  onLarge: SizeEventHandler;
  onExtraLarge: SizeEventHandler;
};
type OptionalSizeHandlers = {
  [K in keyof SizeHandlers]?: SizeHandlers[K];
};
export const useScreenSize = ({
  height,
  width,
}: {
  width?: OptionalSizeHandlers;
  height?: OptionalSizeHandlers;
}) => {
  useEffect(() => {
    const body = document.getElementById("body");
    if (!body) {
      return;
    }
    const observer = new ResizeObserver(() => {
      const w = body.clientWidth;

      if (width) {
        // run(())
        if (w < 300) {
          width?.onExtraSmall?.(w);
        } else if (w < 600) {
          width?.onSmall?.(w);
        } else if (w < 1000) {
          width?.onMedium?.(w);
        } else if (w < 1400) {
          width?.onLarge?.(w);
        } else if (w < 1800) {
          width?.onExtraLarge?.(w);
        }
      }

      if (height) {
        const h = body.clientHeight;

        if (h < 300) {
          height?.onExtraSmall?.(h);
        } else if (h < 600) {
          height?.onSmall?.(h);
        } else if (h < 1000) {
          height?.onMedium?.(h);
        } else if (h < 1400) {
          height?.onLarge?.(h);
        } else if (h < 1800) {
          height?.onExtraLarge?.(h);
        }
      }
    });

    observer.observe(body);

    return () => {
      observer.disconnect();
    };
  }, [
    width?.onExtraSmall,
    width?.onSmall,
    width?.onMedium,
    width?.onLarge,
    width?.onExtraLarge,
    height?.onExtraSmall,
    height?.onSmall,
    height?.onMedium,
    height?.onLarge,
    height?.onExtraLarge,
  ]);
};
