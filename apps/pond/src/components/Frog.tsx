import React from "react";
import frogSvgUrl from "../assets/frog.svg?url";

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

function FrogEmoji() {
  return (
    <img src={frogSvgUrl} alt="Frog" className="w-5 h-5" draggable={false} />
  );
}

function Frog({
  score,
  colorize,
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
    <div className={`flex gap-1 ${className ?? ""}`}>
      <span className={`text-frog-score ${colorize ? colorClass : ""}`}>
        {score}
      </span>
      <FrogEmoji />
    </div>
  );
}

export default Frog;
