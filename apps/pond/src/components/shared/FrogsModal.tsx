import _ from "lodash";
import React, { useCallback, useState } from "react";
import { useSwipeable } from "react-swipeable";
import ReactModal from "react-modal";
import { type FrogPOD } from "@frogcrypto/shared";
import FrogCard from "./FrogCard";

export function FrogsModal({
  pods,
  color,
  onClose,
}: {
  pods: FrogPOD[];
  color: string;
  onClose: () => void;
}) {
  const [focused, setFocused] = useState<number | null>(0);
  const focusedPOD = pods[focused ?? 0];

  const onSwipeLeft = useCallback(() => {
    setFocused((prev) => Math.min(pods.length - 1, (prev ?? 0) + 1));
  }, [pods]);

  const onSwipeRight = useCallback(() => {
    setFocused((prev) => Math.max(0, (prev ?? 0) - 1));
  }, []);

  const handlers = useSwipeable({
    onSwiped: (eventData) => {
      if (eventData.dir === "Left") {
        onSwipeLeft();
      } else if (eventData.dir === "Right") {
        onSwipeRight();
      }
    },
  });

  const boxShadow = _.range(-1, -(focused ?? 0) - 1, -1)
    .concat(_.range(1, pods.length - (focused ?? 0)))
    .map((i) => {
      const offset = i * 2;
      return `${offset}px ${offset}px 2px -1px white, ${offset}px ${offset}px 2px 0 ${color}`;
    })
    .join(", ");

  if (!focusedPOD) {
    return null;
  }

  return (
    <ReactModal
      isOpen={Boolean(pods)}
      onRequestClose={onClose}
      className="absolute inset-0 flex items-center justify-center"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50"
      style={{
        content: {
          maxWidth: "400px",
          margin: "auto",
          padding: "0",
          overflow: "hidden",
        },
      }}
    >
      <div className="flex items-stretch justify-around" {...handlers}>
        <button
          type="button"
          onClick={onSwipeRight}
          disabled={focused === 0}
          className={`flex justify-center items-center flex-1 p-2 text-2xl ${
            focused === 0
              ? "cursor-default text-white opacity-20"
              : "cursor-pointer text-white opacity-80 hover:opacity-100"
          }`}
        >
          &lsaquo;
        </button>
        <div
          style={{
            boxShadow,
            border: `1px solid ${color}`,
            borderRadius: "8px",
          }}
        >
          <FrogCard frog={focusedPOD} expanded />
        </div>
        <button
          type="button"
          onClick={onSwipeLeft}
          disabled={focused === pods.length - 1}
          className={`flex justify-center items-center flex-1 p-2 text-2xl ${
            focused === pods.length - 1
              ? "cursor-default text-white opacity-20"
              : "cursor-pointer text-white opacity-80 hover:opacity-100"
          }`}
        >
          &rsaquo;
        </button>
      </div>
    </ReactModal>
  );
}
