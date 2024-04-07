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
    const handleResize = () => {
      if (!visualViewport) {
        return;
      }
      if (width) {
        if (visualViewport.width < 300) {
          width?.onExtraSmall?.(visualViewport.width);
        } else if (visualViewport.width < 600) {
          width?.onSmall?.(visualViewport.width);
        } else if (visualViewport.width < 1000) {
          width?.onMedium?.(visualViewport.width);
        } else if (visualViewport.width < 1400) {
          width?.onLarge?.(visualViewport.width);
        } else if (visualViewport.width < 1800) {
          width?.onExtraLarge?.(visualViewport.width);
        }
      }

      if (height) {
        if (visualViewport.height < 300) {
          height?.onExtraSmall?.(visualViewport.height);
        } else if (visualViewport.height < 600) {
          height?.onSmall?.(visualViewport.height);
        } else if (visualViewport.height < 1000) {
          height?.onMedium?.(visualViewport.height);
        } else if (visualViewport.height < 1400) {
          height?.onLarge?.(visualViewport.height);
        } else if (visualViewport.height < 1800) {
          height?.onExtraLarge?.(visualViewport.height);
        }
      }
    };

    visualViewport?.addEventListener("resize", handleResize);

    return () => {
      visualViewport?.removeEventListener("resize", handleResize);
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
