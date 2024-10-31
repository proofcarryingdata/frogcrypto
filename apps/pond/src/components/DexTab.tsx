import React, {
  type Dispatch,
  type SetStateAction,
  useMemo,
  useState,
} from "react";
import { type FrogPOD, type DexFrog, type IFrogData } from "@frogcrypto/shared";
import { List, LayoutGrid } from "lucide-react";
import { usePossibleFrogs } from "../hooks/useUserState";
import useFrogs from "../hooks/useFrogs";
import { FrogsModal } from "./shared/FrogsModal";
import Loader from "./shared/Loader";
import { RARITY_COLORS } from "./shared/FrogCard";
import FrogImg from "./shared/FrogImg";

/**
 * The FrogeDex tab allows users to view their progress towards collecting all frogs.
 */
export function DexTab() {
  const [mode, setMode] = useState<"grid" | "list">("list");
  const frogs = useFrogs();
  const possibleFrogs = usePossibleFrogs();
  const groupedPODs = useGroupedPODs(frogs);

  const [focusedFrogs, setFocusedFrogs] = useState<FrogPOD[]>([]);

  if (!possibleFrogs) {
    return <Loader />;
  }

  return (
    <>
      <div className="flex">
        <button
          type="button"
          className="btn"
          onClick={() => {
            const blob = new Blob([JSON.stringify(frogs)], {
              type: "application/json",
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = url;
            a.download = `frogcrypto-${String(Date.now())}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
          }}
        >
          Export FrogPODs
        </button>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <span>
          Owned: {Object.keys(groupedPODs).length.toString().padStart(3, "0")} /{" "}
          {possibleFrogs.length.toString().padStart(3, "0")}
        </span>
        <button
          type="button"
          className="btn"
          onClick={(): void => {
            setMode("list");
          }}
          disabled={mode === "list"}
        >
          <List />
        </button>
        <button
          type="button"
          className="btn"
          onClick={(): void => {
            setMode("grid");
          }}
          disabled={mode === "grid"}
        >
          <LayoutGrid />
        </button>
      </div>
      {mode === "grid" && (
        <DexGrid
          possibleFrogs={possibleFrogs}
          pods={groupedPODs}
          onClick={setFocusedFrogs}
        />
      )}
      {mode === "list" && (
        <DexList
          possibleFrogs={possibleFrogs}
          pods={groupedPODs}
          onClick={setFocusedFrogs}
        />
      )}

      {focusedFrogs[0] ? (
        <FrogsModal
          pods={focusedFrogs}
          onClose={(): void => {
            setFocusedFrogs([]);
          }}
          color={RARITY_COLORS[focusedFrogs[0].rarity].color}
        />
      ) : null}
    </>
  );
}

function DexList({
  possibleFrogs,
  pods,
  onClick,
}: {
  possibleFrogs: DexFrog[];
  pods: FrogsById;
  onClick: Dispatch<SetStateAction<FrogPOD[]>>;
}): JSX.Element {
  return (
    <table className="rounded-lg bg-white text-sm">
      <tbody className="divide-y divide-gray-200">
        {possibleFrogs.map(({ id, rarity }) => {
          const frogPODs = pods[id];

          if (!frogPODs) {
            return (
              <tr key={id}>
                <td className="pl-4 py-2 w-min">{id}</td>
                <td className="py-2 w-16">
                  <div
                    className="mx-auto px-2 border rounded text-center"
                    style={{
                      borderColor: RARITY_COLORS[rarity].color,
                      background: "rgba(45, 144, 97, 0.1)",
                    }}
                  >
                    {RARITY_COLORS[rarity].label}
                  </div>
                </td>
                <td className="px-4 py-2 text-gray-500">???</td>
              </tr>
            );
          }

          return (
            <tr
              key={id}
              onClick={(): void => {
                onClick(frogPODs.pods);
              }}
              className="cursor-pointer hover:bg-gray-100"
            >
              <td className="pl-4 py-2 w-min">{id}</td>
              <td className="py-2">
                <div
                  className="px-2 rounded text-center"
                  style={{
                    border: `1px solid ${RARITY_COLORS[rarity].color}`,
                    background: RARITY_COLORS[rarity].color,
                    color: "#fff",
                  }}
                >
                  {RARITY_COLORS[rarity].label}
                </div>
              </td>
              <td className="px-4 py-2">{frogPODs.frog.name}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function DexGrid({
  possibleFrogs,
  pods,
  onClick,
}: {
  possibleFrogs: DexFrog[];
  pods: FrogsById;
  onClick: Dispatch<SetStateAction<FrogPOD[]>>;
}): JSX.Element {
  return (
    <div className="grid grid-cols-3 gap-4">
      {possibleFrogs.map(({ id, rarity }) => {
        const frogPODs = pods[id];

        return (
          <div key={id} className="flex flex-col items-center">
            <div
              tabIndex={0}
              role="button"
              className="w-full text-white rounded-lg cursor-pointer flex flex-col items-stretch justify-center border"
              onClick={
                frogPODs
                  ? (): void => {
                      onClick(frogPODs.pods);
                    }
                  : undefined
              }
            >
              {frogPODs ? (
                <FrogImg
                  frog={frogPODs.frog}
                  className="w-full h-auto object-cover rounded-lg aspect-square"
                  fallback={
                    <Loader className="w-full h-auto aspect-square m-auto" />
                  }
                />
              ) : (
                <img
                  src="/images/pixel_frog.png"
                  alt="???"
                  className="w-full h-auto object-cover rounded-lg aspect-square opacity-20"
                  draggable={false}
                />
              )}

              <span
                className={`px-2 text-center truncate text-sm font-semibold ${RARITY_COLORS[rarity].text}`}
                title={frogPODs ? frogPODs.frog.name : "???"}
              >
                {frogPODs ? frogPODs.frog.name : "???"}
              </span>
            </div>
            {frogPODs ? <span>x{frogPODs.pods.length}</span> : null}
          </div>
        );
      })}
    </div>
  );
}

type FrogsById = Partial<
  Record<
    number,
    {
      pods: FrogPOD[];
      /**
       * An arbitrary PCD for the frog.
       */
      frog: IFrogData;
    }
  >
>;

/**
 * Group PODs by frog ID.
 */
const useGroupedPODs = (pods: FrogPOD[]): FrogsById => {
  return useMemo(
    () =>
      pods.reduce<FrogsById>((acc, pod) => {
        const entry = acc[pod.frogId] ?? { pods: [], frog: pod };
        entry.pods.push(pod);
        entry.frog = pod;
        acc[pod.frogId] = entry;
        return acc;
      }, {}),
    [pods]
  );
};
