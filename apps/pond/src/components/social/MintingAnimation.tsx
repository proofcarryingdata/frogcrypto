import React, { useEffect, useState } from "react";

const ANIMATION_LINES = [
  "The waters of the Enchanted Pond are stirring...",
  "Ancient amphibian algorithms are at work...",
  "Your Spirit Frog is leaping into existence...",
];

const REVEAL_INTERVAL = 2000; // 2 seconds
const FADE_DURATION = 1000; // 1 second
const BLACKOUT_FADE_DURATION = 3000; // 3 seconds

function MintingAnimation() {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const blackoutElement = document.createElement("div");
    blackoutElement.id = "minting-blackout";
    blackoutElement.style.position = "fixed";
    blackoutElement.style.inset = "0";
    blackoutElement.style.backgroundColor = "black";
    blackoutElement.style.opacity = "1";
    blackoutElement.style.transition = `opacity ${BLACKOUT_FADE_DURATION}ms`;
    blackoutElement.style.zIndex = "9999";
    document.body.appendChild(blackoutElement);

    let timeout: NodeJS.Timeout;

    const revealLines = () => {
      ANIMATION_LINES.forEach((_, index) => {
        timeout = setTimeout(() => {
          setVisibleLines((prev) => [...prev, index]);
        }, index * REVEAL_INTERVAL);
      });

      timeout = setTimeout(
        () => {
          setFadeOut(true);
        },
        ANIMATION_LINES.length * REVEAL_INTERVAL + FADE_DURATION
      );

      timeout = setTimeout(
        () => {
          blackoutElement.style.opacity = "0";
        },
        ANIMATION_LINES.length * REVEAL_INTERVAL + FADE_DURATION * 2
      );

      timeout = setTimeout(
        () => {
          document.body.removeChild(blackoutElement);
        },
        ANIMATION_LINES.length * REVEAL_INTERVAL +
          FADE_DURATION * 2 +
          BLACKOUT_FADE_DURATION
      );
    };

    revealLines();

    return () => {
      clearTimeout(timeout);
      if (document.body.contains(blackoutElement)) {
        document.body.removeChild(blackoutElement);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="text-white text-center">
        {ANIMATION_LINES.map((line, index) => (
          <p
            key={index}
            className={`mb-4 transition-opacity duration-1000 ${
              visibleLines.includes(index) ? "opacity-100" : "opacity-0"
            } ${fadeOut ? "opacity-0" : ""}`}
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

export default MintingAnimation;
