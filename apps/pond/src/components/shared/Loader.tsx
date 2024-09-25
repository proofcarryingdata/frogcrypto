import React from "react";
import _ from "lodash";

function Loader({
  className = "w-16 h-16 m-8",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={`relative mx-auto min-w-4 min-h-4 ${className}`}>
      {_.range(3).map((i) => (
        <div
          key={i}
          style={{ animationDelay: `${i}s` }}
          className="animate-growAndFade bg-green-800 opacity-0 w-full h-full absolute rounded-full"
        />
      ))}
    </div>
  );
}

export default Loader;
