import React from "react";
import Countdown from "../shared/Countdown";

function SocialContainer({
  children,
  title,
  link,
  countdownTargetTime,
}: {
  children: React.ReactNode;
  title: string;
  link?: React.ReactNode;
  countdownTargetTime?: number;
}) {
  return (
    <div className="flex flex-col items-stretch gap-3 pb-3 border-green-600 border px-3">
      <div className="text-lg font-semibold bg-green-600 text-white px-3 py-1 -mx-3 flex items-center justify-between">
        <h2>{title}</h2>
        <div className="flex items-center gap-2">
          {countdownTargetTime ? (
            <div className="invert w-4 h-4">
              <Countdown targetTime={countdownTargetTime} />
            </div>
          ) : null}
          {link}
        </div>
      </div>

      {children}
    </div>
  );
}

export default SocialContainer;
