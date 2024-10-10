import { FROM_SUBSCRIPTION_PARAM_KEY } from "@frogcrypto/shared";
import React from "react";
import { type TypewriterClass } from "typewriter-effect";
import { useParams } from "wouter";
import { useInitializeFrogSubscriptions } from "../hooks/useFrogFeeds";
import GetFrogTab from "./GetFrogTab";
import { Button } from "./shared/Button";
import TypistText from "./shared/TypistText";

function Intro({ hasFrog }: { hasFrog: boolean }) {
  const searchParams = useParams();
  const isFromSubscriptionRef = React.useRef<boolean>(
    Boolean(searchParams[FROM_SUBSCRIPTION_PARAM_KEY])
  );
  const [stage, setStage] = React.useState<"intro" | "enter" | "retreat">(
    "intro"
  );

  const initFrog = useInitializeFrogSubscriptions();

  if (stage === "intro") {
    return (
      <div className="flex flex-col gap-4 w-full">
        <TypistText
          onInit={(typewriter): TypewriterClass =>
            typewriter
              .typeString(
                isFromSubscriptionRef.current
                  ? "a cryptic digital pattern whisks you away to a vibrant metropolis, where neon lights reflect off murky canals.<br/><br/>"
                  : "you're lost in a labyrinth of neon-lit streets, the air thick with incense and mystery. Suddenly, a hidden passage appears, veiled in swirling mist.<br/><br/>"
              )
              .pauseFor(500)
              .typeString(
                "a sultry CROAK beckons you closer. it is like music to your ears.<br/><br/>"
              )
              .pauseFor(500)
              .typeString("will you enter the world of FROGCRYPTO?")
          }
        >
          <Button
            onClick={() => {
              setStage("enter");
            }}
          >
            enter SWAMP
          </Button>
          {
            // frog holders cannot retreat
            !hasFrog && (
              <Button
                className="ml-2"
                onClick={() => {
                  setStage("retreat");
                }}
              >
                retreat
              </Button>
            )
          }
        </TypistText>
      </div>
    );
  }

  return (
    <TypistText
      onInit={(typewriter): TypewriterClass => {
        const text = isFromSubscriptionRef.current
          ? `you hear a whisper. "come back again when you're stronger."`
          : "you're certain you saw a frog wearing a monocle.";

        return typewriter
          .typeString(text)
          .pauseFor(500)
          .changeDeleteSpeed(20)
          .deleteChars(text.length)
          .typeString(
            stage === "retreat"
              ? "retreat was ineffective. you enter the SWAMP..."
              : "you enter the SWAMP..."
          )
          .pauseFor(500)
          .callFunction(() => {
            void initFrog();
          });
      }}
    >
      <GetFrogTab />
    </TypistText>
  );
}

export default Intro;
