import mediumZoom, { type Zoom, type ZoomOptions } from "medium-zoom";
import React, { type ComponentProps, useCallback, useRef } from "react";

type ImageZoomProps = ComponentProps<"img"> & {
  options?: ZoomOptions;
};

function ImageZoom({ options, ...props }: ImageZoomProps): JSX.Element {
  const zoomRef = useRef<Zoom | null>(null);

  const getZoom = useCallback(() => {
    if (zoomRef.current === null) {
      zoomRef.current = mediumZoom(options);
    }

    return zoomRef.current;
  }, [options]);

  const attachZoom = useCallback(
    (image: HTMLImageElement | null) => {
      const zoom = getZoom();

      if (image) {
        zoom.attach(image);
      } else {
        zoom.detach();
      }
    },
    [getZoom]
  );

  return <img {...props} ref={attachZoom} />;
}

export default ImageZoom;
