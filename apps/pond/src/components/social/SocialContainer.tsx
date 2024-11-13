import React from "react";
import Countdown from "../shared/Countdown";

function SocialContainer({
  children,
  title,
  countdownTargetTime,
}: {
  children: React.ReactNode;
  title: string;
  countdownTargetTime?: number;
}) {
  return (
    <div className="flex flex-col items-stretch gap-3 pb-3 border-green-600 border px-3">
      <div className="text-lg font-semibold bg-green-600 text-white px-3 py-1 -mx-3 flex items-center justify-between">
        <h2>{title}</h2>
        {countdownTargetTime ? (
          <div className="invert w-4 h-4">
            <Countdown targetTime={countdownTargetTime} />
          </div>
        ) : null}
      </div>

      {children}
    </div>
  );
}

export default SocialContainer;
