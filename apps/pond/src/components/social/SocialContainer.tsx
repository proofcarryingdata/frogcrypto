import React from "react";

function SocialContainer({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex flex-col items-stretch gap-3 pb-3 border-teal border px-3">
      <h2 className="text-lg font-semibold bg-teal text-white px-3 py-1 -mx-3">
        {title}
      </h2>

      {children}
    </div>
  );
}

export default SocialContainer;
