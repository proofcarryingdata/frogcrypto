import { type FrogCryptoScore, getUsernameFromHash } from "@frogcrypto/shared";
import React, { useMemo } from "react";
import { useUserState } from "../../hooks/useUserState";
import { trpc } from "../../trpc";
import Loader from "../shared/Loader";

/**
 * The Score tab shows the user their score and the leaderboard.
 */
function FrogScore(): JSX.Element {
  const { data: { myScore: score } = {} } = useUserState();
  const { data: scores } = trpc.social.scoreboard.useQuery();

  if (!score) {
    return <Loader />;
  }

  return (
    <div className="flex flex-col items-stretch gap-4">
      <ScoreTable
        title="You"
        scores={[score]}
        getUsername={getUsernameFromHash}
      />
      {scores ? (
        <ScoreTable
          title="Leaderboard"
          scores={scores}
          myScore={score}
          getUsername={getUsernameFromHash}
        />
      ) : (
        <Loader />
      )}
    </div>
  );
}

function ScoreTable({
  title,
  scores,
  myScore,
  getUsername,
}: {
  getUsername: (semaphoreId: string) => string;
  title: string;
  scores: FrogCryptoScore[];
  myScore?: FrogCryptoScore;
}): JSX.Element {
  const scoresByLevel = useMemo(() => groupScores(scores), [scores]);

  return (
    <table className="w-full">
      <thead>
        <tr>
          <th className="w-[35px]" />
          <th className="text-center" />
          <th className="w-[100px]" />
        </tr>
        <tr>
          <th colSpan={3} className="text-center">
            {title}
          </th>
        </tr>
      </thead>
      <tbody>
        {scoresByLevel.map((group) => (
          <React.Fragment key={group.title}>
            {myScore ? (
              <tr>
                <td colSpan={3} className="text-center py-1">
                  {group.emoji} {group.title}
                </td>
              </tr>
            ) : null}
            {group.scores.map((score) => (
              <tr
                key={score.semaphoreIdHash}
                className={
                  score.semaphoreIdHash === myScore?.semaphoreIdHash
                    ? "font-bold text-accent-darker"
                    : ""
                }
              >
                <td>{score.rank}</td>
                <td>{getUsername(score.semaphoreIdHash)}</td>
                <td className="text-right">{score.score}</td>
              </tr>
            ))}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );
}

/**
 * The score thresholds for each level.
 */
const SCORES = [
  { score: 0, emoji: "⚪️", title: "NOVICE" },
  { score: 5, emoji: "🟡", title: "APPRENTICE" },
  { score: 10, emoji: "🟠", title: "JOURNEYMAN" },
  { score: 19, emoji: "🔴", title: "EXPERT" },
  { score: 36, emoji: "🟣", title: "MASTER" },
  { score: 69, emoji: "🔵", title: "GRANDMASTER" },
  { score: 133, emoji: "🟢", title: "LEGEND" },
  { score: 256, emoji: "👑", title: "SOVEREIGN" },
  { score: 420, emoji: "🦉", title: "SAGE" },
  { score: 701, emoji: "🐸", title: "AVATAR OF FROGELION" },
  { score: 1000, emoji: "⌨️", title: "<scripter />" },
];

/**
 * Returns the emoji and title for a given score.
 */
export function scoreToEmoji(score: number): string {
  const index = SCORES.findIndex((item) => item.score > score);
  if (index === -1) {
    const maxScore = SCORES[SCORES.length - 1];
    if (!maxScore) {
      throw new Error("No max score found");
    }
    return `${maxScore.emoji} ${maxScore.title}`;
  }
  const curr = SCORES[index - 1];
  const next = SCORES[index];
  if (!curr || !next) {
    throw new Error("No current or next score found");
  }
  const percent = Math.floor(
    ((score - curr.score) / (next.score - curr.score)) * 100
  );
  return `${curr.emoji} ${curr.title} - ${String(percent)}%`;
}

/**
 * Group the scores by level.
 */
function groupScores(scores: FrogCryptoScore[]): {
  scores: FrogCryptoScore[];
  score: number;
  emoji: string;
  title: string;
}[] {
  const groups = SCORES.map((item) => ({
    ...item,
    scores: [] as FrogCryptoScore[],
  })).reverse();

  scores
    .sort((a, b) => b.score - a.score)
    .forEach((score) => {
      const index = SCORES.findIndex((item) => item.score > score.score);
      const curr = SCORES[index === -1 ? SCORES.length - 1 : index - 1];
      if (!curr) {
        return;
      }

      const group = groups.find((item) => item.title === curr.title);
      if (group) {
        group.scores.push(score);
      }
    });

  return groups.filter((group) => group.scores.length > 0);
}

export default FrogScore;
