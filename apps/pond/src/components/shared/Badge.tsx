import React from "react";

function Badge({ count }: { count: number }) {
  if (count === 0) {
    return null;
  }

  return (
    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
      {count}
    </span>
  );
}

export default Badge;
