import React from "react";
import frogSvgUrl from "../../assets/frog.svg?url";

export const FROG_LEVELS = [
  { score: 0, className: "text-black", emoji: "⚪️", title: "NOVICE" },
  { score: 5, className: "text-yellow-500", emoji: "🟡", title: "APPRENTICE" },
  { score: 10, className: "text-orange-500", emoji: "🟠", title: "JOURNEYMAN" },
  { score: 19, className: "text-red-500", emoji: "🔴", title: "EXPERT" },
  { score: 36, className: "text-purple-500", emoji: "🟣", title: "MASTER" },
  { score: 69, className: "text-blue-500", emoji: "🔵", title: "GRANDMASTER" },
  { score: 133, className: "text-green-500", emoji: "🟢", title: "LEGEND" },
  { score: 256, className: "text-gold-500", emoji: "👑", title: "SOVEREIGN" },
  { score: 420, className: "text-brown-500", emoji: "🦉", title: "SAGE" },
  {
    score: 701,
    className: "text-lime-500",
    emoji: "🐸",
    title: "AVATAR OF FROGELION",
  },
  {
    score: 1000,
    className: "text-cyan-500",
    emoji: "⌨️",
    title: "<scripter />",
  },
];
type FrogLevel = (typeof FROG_LEVELS)[number];

/**
 * Returns the level for a given score.
 */
export function frogScoreToLevel(score: number): {
  curr: FrogLevel;
  next: FrogLevel;
} {
  const index = FROG_LEVELS.findIndex((item) => item.score > score);
  if (index === -1) {
    const maxScore = FROG_LEVELS[FROG_LEVELS.length - 1];
    if (!maxScore) {
      throw new Error("No max score found");
    }
    return {
      curr: maxScore,
      next: maxScore,
    };
  }
  const curr = FROG_LEVELS[index - 1];
  const next = FROG_LEVELS[index];
  if (!curr || !next) {
    throw new Error("No current or next score found");
  }

  return {
    curr,
    next,
  };
}

function FrogEmoji() {
  return (
    <img
      src={frogSvgUrl}
      alt="Frog"
      className="h-full aspect-square"
      draggable={false}
    />
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

  const color =
    typeof score === "number"
      ? frogScoreToLevel(score).curr.className
      : "text-black";

  return (
    <div
      className={`inline-flex min-w-0 gap-1 items-center text-frog-score ${className ?? ""}`}
    >
      <span className={colorize ? color : ""}>{score}</span>
      <FrogEmoji />
    </div>
  );
}

export default Frog;
