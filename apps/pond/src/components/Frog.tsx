import React from "react";
import frogSvgUrl from "../assets/frog.svg?url";
import frog2SvgUrl from "../assets/frog2.svg?url";

export const FROG_LEVELS = [
  { score: 0, colorClass: "text-gray-500", emoji: "⚪️", title: "NOVICE" },
  { score: 5, colorClass: "text-yellow-500", emoji: "🟡", title: "APPRENTICE" },
  {
    score: 10,
    colorClass: "text-orange-500",
    emoji: "🟠",
    title: "JOURNEYMAN",
  },
  { score: 19, colorClass: "text-red-500", emoji: "🔴", title: "EXPERT" },
  { score: 36, colorClass: "text-purple-500", emoji: "🟣", title: "MASTER" },
  { score: 69, colorClass: "text-blue-500", emoji: "🔵", title: "GRANDMASTER" },
  { score: 133, colorClass: "text-green-500", emoji: "🟢", title: "LEGEND" },
  {
    score: 256,
    colorClass: "text-yellow-400",
    emoji: "👑",
    title: "SOVEREIGN",
  },
  { score: 420, colorClass: "text-amber-700", emoji: "🦉", title: "SAGE" },
  {
    score: 701,
    colorClass: "text-lime-500",
    emoji: "🐸",
    title: "AVATAR OF FROGELION",
  },
  {
    score: 1000,
    colorClass: "text-cyan-500",
    emoji: "⌨️",
    title: "<scripter />",
  },
];

export function FrogEmoji({ className }: { className?: string }) {
  return (
    <img
      src={frogSvgUrl}
      alt="Frog"
      className={className ?? "h-full aspect-square inline-block"}
      draggable={false}
    />
  );
}

export function Frog2Emoji() {
  return (
    <img
      src={frog2SvgUrl}
      alt="Frog"
      className="h-full aspect-square inline-block"
      draggable={false}
    />
  );
}

function Frog({
  score,
  colorize = true,
  className,
}: {
  score?: number | string;
  colorize?: boolean;
  className?: string;
}) {
  if (typeof score === "undefined") {
    return <FrogEmoji />;
  }

  const colorClass =
    typeof score === "number"
      ? (FROG_LEVELS.find((level) => score >= level.score)?.colorClass ??
        "text-gray-500")
      : "text-gray-500";

  return (
    <div
      className={`flex gap-1 text-frog-score items-center ${className ?? ""}  `}
    >
      <span className={colorize ? colorClass : ""}>{score}</span>
      <FrogEmoji />
    </div>
  );
}

export default Frog;
