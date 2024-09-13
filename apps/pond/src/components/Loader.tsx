import React from "react";
import _ from "lodash";

const Loader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div {...props} className={`relative min-w-4 min-h-4 ${className}`}>
      {_.range(3).map((i) => (
        <div
          key={i}
          style={{ animationDelay: `${i}s` }}
          className="animate-growAndFade bg-green-800 opacity-0 w-full h-full absolute rounded-full"
        />
      ))}
    </div>
  );
};

export default Loader;
