import React, { useEffect, useState } from "react";
import _ from "lodash";

function Loader({
  className = "w-16 h-16 m-8",
  message,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { message?: string }) {
  const [showMessage, setShowMessage] = useState(false);
  useEffect(() => {
    if (!message) {
      return;
    }

    const timeout = setTimeout(() => {
      setShowMessage(true);
    }, 5 * 1000);

    return () => {
      setShowMessage(false);
      clearTimeout(timeout);
    };
  }, [message]);

  return (
    <div {...props} className={`relative mx-auto min-w-4 min-h-4 ${className}`}>
      {_.range(3).map((i) => (
        <div
          key={i}
          style={{ animationDelay: `${i}s` }}
          className="animate-growAndFade bg-green-800 opacity-0 w-full h-full absolute rounded-full"
        />
      ))}

      {showMessage && message ? (
        <span className="absolute -left-1/2 -bottom-6 truncate text-xs text-moss-600">
          {message}
        </span>
      ) : null}
    </div>
  );
}

export default Loader;
