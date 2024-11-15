import { atomWithStorage } from "jotai/utils";
import React, { useEffect, useState } from "react";
import { useAtom } from "jotai";
import useSearchParams from "../hooks/useSearchParams";
import TypistText from "./shared/TypistText";

const SEARCH_PARAM_VOID_KEY = "plonk";
const SEARCH_PARAM_VOID_VALUE = "into_darkness";
export const voidEnabledAtom = atomWithStorage("voidEnabled", false);

function VoidPortal() {
  const [voidEnabled, setVoidEnabled] = useAtom(voidEnabledAtom);
  const [searchParams, setSearchParams] = useSearchParams();
  const shouldEnableVoid =
    searchParams.get(SEARCH_PARAM_VOID_KEY) === SEARCH_PARAM_VOID_VALUE;

  const [activated, setActivated] = useState(false);
  useEffect(() => {
    if (shouldEnableVoid && !voidEnabled) {
      const timeout = setTimeout(() => {
        setActivated(true);
      }, 1000);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [shouldEnableVoid, voidEnabled]);

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center transition-colors duration-[4000ms] z-[2000] ${
        activated
          ? "bg-black pointer-events-auto"
          : "bg-transparent pointer-events-none delay-1000"
      }`}
    >
      {activated ? (
        <div className="text-white text-center">
          <TypistText
            onInit={(typewriter) =>
              typewriter
                .pauseFor(4000)
                .changeDelay("natural")
                .typeString(
                  "recursive darkness stirs<br/>we observe your commitment<br/><br/>"
                )
                .pauseFor(1000)
                .typeString(
                  "prove yourself to depths<br/>(through blinded gates eternal)<br/><br/>"
                )
                .pauseFor(1000)
                .typeString("the void transforms all")
                .pauseFor(2000)
                .callFunction(() => {
                  setVoidEnabled(true);
                  setSearchParams(
                    (prev) => {
                      const newParams = new URLSearchParams(prev);
                      newParams.delete(SEARCH_PARAM_VOID_KEY);
                      return newParams;
                    },
                    { replace: true }
                  );
                  setActivated(false);
                })
            }
          />
        </div>
      ) : null}
    </div>
  );
}

export default VoidPortal;
