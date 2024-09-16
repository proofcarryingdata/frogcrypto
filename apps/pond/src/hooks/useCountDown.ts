import { useCallback, useEffect, useMemo, useState } from "react";
import prettyMilliseconds from "pretty-ms";

/**
 * Takes a future timestamp and returns a " (wait X)" string where X is a human
 * readable duration until the timestamp. Returns an empty string if the
 * timestamp is in the past.
 */
function useCountDown(timestamp: number): string {
  const end = useMemo(() => new Date(timestamp), [timestamp]);
  const getDiffText = useCallback((end: Date) => {
    const now = new Date();
    const diffMs = Math.ceil((end.getTime() - now.getTime()) / 1000) * 1000;
    if (diffMs <= 0) {
      return "";
    } else {
      const diffString = prettyMilliseconds(diffMs, {
        millisecondsDecimalDigits: 0,
        secondsDecimalDigits: 0,
        unitCount: 4,
      });
      return diffString;
    }
  }, []);
  const [diffText, setDiffText] = useState(() => getDiffText(end));

  useEffect(() => {
    const interval = setInterval(() => setDiffText(getDiffText(end)), 500);

    return () => {
      clearInterval(interval);
    };
  }, [end, getDiffText]);

  return diffText ? ` (wait ${diffText})` : "";
}

export default useCountDown;
