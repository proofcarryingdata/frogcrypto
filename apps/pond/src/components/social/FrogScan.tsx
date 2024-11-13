import React from "react";
import toast from "react-hot-toast";
import { useZxing } from "react-zxing";
import { validate } from "uuid";
import { useLocation } from "wouter";
import { SEARCH_PARAM_NECKLACE_QR } from "./FrogNecklace";

function FrogScan() {
  const [, setLocation] = useLocation();
  const { ref } = useZxing({
    onDecodeResult(result) {
      try {
        const txt = result.getText();
        if (txt.startsWith("dc7.getfrogs.xyz/necklace/")) {
          const socialId = txt.split("/").pop();

          if (socialId && validate(socialId)) {
            setLocation(`/scan?${SEARCH_PARAM_NECKLACE_QR}=${socialId}`);
            return;
          }
        }

        toast.error(`No social ID found in ${result.getText()}`);
      } catch (e) {
        toast.error(`Invalid QR code: ${e} from ${result.getText()}`);
      }
    },
  });

  // eslint-disable-next-line jsx-a11y/media-has-caption -- this is QR code scanner
  return <video ref={ref} />;
}

export default FrogScan;
