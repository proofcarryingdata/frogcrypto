import React, { useState } from "react";
import Typewriter, { type TypewriterClass } from "typewriter-effect";

/**
 * TypistText is a component that renders text with a typewriter effect. Any
 * children will be faded in after the typewriter effect is complete.
 */
function TypistText({
  onInit,
  children,
}: {
  /**
   * onInit will be called when the typewriter is ready.
   */
  onInit: (typewriter: TypewriterClass) => TypewriterClass;
  /**
   * Action button with the label will be rendered at the end of the adventure text.
   */
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);

  return (
    <>
      <div className="select-none text-lg">
        <Typewriter
          onInit={(typewriter): void => {
            onInit(typewriter)
              .callFunction(() => {
                setReady(true);
              })
              .start();
          }}
          options={{
            delay: 20,
          }}
        />
      </div>
      {ready ? <div className="animate-fadeIn w-full">{children}</div> : null}
    </>
  );
}

export default TypistText;
