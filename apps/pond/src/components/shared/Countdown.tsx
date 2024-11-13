import React, { useEffect, useState } from "react";
import Loader from "./Loader";

interface CountdownProps {
  targetTime: number; // t1: timestamp to countdown towards
  className?: string;
}

function Countdown({ targetTime, className = "w-4 h-4" }: CountdownProps) {
  // Store the start time (t0) when targetTime changes
  const [startTime, setStartTime] = useState(() => Date.now());
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState(0);

  // Calculate total duration
  const duration = targetTime - startTime;

  useEffect(() => {
    setStartTime(Date.now());
    setProgress(0);
  }, [targetTime]);

  useEffect(() => {
    // Reset state when target time changes
    setIsComplete(false);

    let animationFrame: number;

    const updateProgress = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const newProgress = Math.min(elapsed / duration, 1);

      setProgress(newProgress);

      if (newProgress < 1) {
        animationFrame = requestAnimationFrame(updateProgress);
      } else {
        setIsComplete(true);
      }
    };

    animationFrame = requestAnimationFrame(updateProgress);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [targetTime, startTime, duration]);

  if (isComplete) {
    return <Loader className={className} />;
  }

  // Convert progress (0-1) to SVG arc parameters
  const size = 100;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className={className}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-green-800 opacity-20"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="text-green-800"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export default Countdown;
