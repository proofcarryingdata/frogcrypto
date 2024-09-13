import { TypewriterClass } from "typewriter-effect";
import TypistText from "./TypistText";
import { useParams } from "wouter";
import { Feed } from "@pcd/passport-interface";
import React from "react";
import { FROM_SUBSCRIPTION_PARAM_KEY } from "../constants";
import { ActionButton } from "./Button";
import { useInitializeFrogSubscriptions } from "../hooks/useFrogFeeds";
import { useSubscriptions } from "../hooks/useSubscriptions";
import GetFrogTab from "./GetFrogTab";

const Intro = ({ hasFrog }: { hasFrog: boolean }) => {
  const searchParams = useParams();
  const isFromSubscriptionRef = React.useRef<boolean>(
    !!searchParams[FROM_SUBSCRIPTION_PARAM_KEY]
  );
  const retreatRef = React.useRef<boolean>(false);

  const initFrog = useInitializeFrogSubscriptions();
  const { subscriptions } = useSubscriptions();

  if (subscriptions.length > 0) {
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
              retreatRef.current
                ? "retreat was ineffective. you enter the SWAMP."
                : "you enter the SWAMP."
            );
        }}
      >
        <GetFrogTab />
      </TypistText>
    );
  }

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
        <ActionButton onClick={initFrog}>enter SWAMP</ActionButton>
        {
          // frog holders cannot retreat
          !hasFrog && (
            <ActionButton
              className="ml-2"
              onClick={(): Promise<Feed | null> => {
                retreatRef.current = true;
                return initFrog();
              }}
            >
              retreat
            </ActionButton>
          )
        }
      </TypistText>
    </div>
  );
};

export default Intro;
