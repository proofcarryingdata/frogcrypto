import { type FrogCryptoScore, getUsernameFromHash } from "@frogcrypto/shared";
import React, { useMemo } from "react";
import { useUserState } from "../../hooks/useUserState";
import { trpc } from "../../trpc";
import Loader from "../shared/Loader";
import Frog, { FROG_LEVELS } from "../shared/Frog";
import FrogImg from "../shared/FrogImg";
import SocialContainer from "./SocialContainer";

/**
 * The Score tab shows the user their score and the leaderboard.
 */
function FrogScore(): JSX.Element {
  const { data: { myScore: score, spiritFrog } = {} } = useUserState();
  const { data: { scores, totalUsers } = {}, dataUpdatedAt } =
    trpc.social.scoreboard2.useQuery(undefined, {
      refetchInterval: 30_000,
    });

  if (!score) {
    return <Loader />;
  }

  return (
    <SocialContainer
      title="Leaderboard"
      countdownTargetTime={dataUpdatedAt + 30_000}
    >
      <ScoreTable
        scores={[score]}
        getUsername={(id) =>
          `${getUsernameFromHash(id)} the ${spiritFrog?.name ?? "Unknown Toad"}`
        }
      />

      <div className="min-h-px max-h-px w-full bg-green-600 bg-opacity-30" />

      {scores ? (
        <ScoreTable
          scores={scores}
          myScore={score}
          getUsername={getUsernameFromHash}
          totalUsers={totalUsers}
        />
      ) : (
        <Loader />
      )}
    </SocialContainer>
  );
}

function ScoreTable({
  scores,
  myScore,
  getUsername,
  totalUsers,
}: {
  getUsername: (semaphoreId: string) => string;
  scores: FrogCryptoScore[];
  myScore?: FrogCryptoScore;
  totalUsers?: number;
}): JSX.Element {
  const scoresByLevel = useMemo(() => groupScores(scores), [scores]);

  return (
    <table className="w-full">
      <tbody>
        {scoresByLevel.map((group) => (
          <React.Fragment key={group.title}>
            {group.scores.map((score) => (
              <tr
                key={score.semaphoreIdHash}
                className={
                  score.semaphoreIdHash === myScore?.semaphoreIdHash
                    ? "font-bold text-accent-darker"
                    : ""
                }
              >
                <td className="w-10 h-8">
                  <FrogImg
                    frog={{
                      imageUrl: score.imgUrl ?? "",
                      name: getUsername(score.semaphoreIdHash),
                    }}
                    className="w-8 h-8 object-cover"
                    fallback={<Loader className="w-8 h-8" />}
                  />
                </td>
                <td className="w-8">{score.rank}.</td>
                <td>{score.username ?? getUsername(score.semaphoreIdHash)}</td>
                <td className="text-right h-8">
                  <Frog
                    score={score.score}
                    colorize
                    className="justify-end text-sm"
                  />
                </td>
              </tr>
            ))}
          </React.Fragment>
        ))}
        {totalUsers ? (
          <>
            <tr>
              <td colSpan={4} className="h-4 text-center">
                ...
              </td>
            </tr>
            <tr>
              <td className="w-10 h-8" />
              <td className="w-8">{totalUsers}.</td>
              <td>An Unknown Toad</td>
              <td className="text-right h-8">
                <Frog score={1} colorize className="justify-end text-sm" />
              </td>
            </tr>
          </>
        ) : null}
      </tbody>
    </table>
  );
}

/**
 * Returns the emoji and title for a given score.
 */
export function scoreToEmoji(score: number): string {
  const index = FROG_LEVELS.findIndex((item) => item.score > score);
  if (index === -1) {
    const maxScore = FROG_LEVELS[FROG_LEVELS.length - 1];
    if (!maxScore) {
      throw new Error("No max score found");
    }
    return `${maxScore.emoji} ${maxScore.title}`;
  }
  const curr = FROG_LEVELS[index - 1];
  const next = FROG_LEVELS[index];
  if (!curr || !next) {
    throw new Error("No current or next score found");
  }
  const percent = Math.floor(
    ((score - curr.score) / (next.score - curr.score)) * 100
  );
  return `${String(percent)}% - ${curr.title} ${curr.emoji}`;
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
  const groups = FROG_LEVELS.map((item) => ({
    ...item,
    scores: [] as FrogCryptoScore[],
  })).reverse();

  scores
    .sort((a, b) => b.score - a.score)
    .forEach((score) => {
      const index = FROG_LEVELS.findIndex((item) => item.score > score.score);
      const curr =
        FROG_LEVELS[index === -1 ? FROG_LEVELS.length - 1 : index - 1];
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
