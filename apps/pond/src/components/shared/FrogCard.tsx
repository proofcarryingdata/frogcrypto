import React, { useState } from "react";
import _ from "lodash";
import {
  type FrogPOD,
  shortCommitment,
  type ProfileFrogPOD,
  type IFrogData,
  Rarity,
  Temperament,
  Biome,
} from "@frogcrypto/shared";
import { isProfileFrogPOD } from "../../hooks/useFrogs";
import ImageZoom from "./ImageZoom";

const RARE_COLORS: Record<
  Rarity,
  {
    shadow: string;
    text: string;
  }
> = {
  [Rarity.Common]: {
    shadow: "shadow-rarity-common",
    text: "text-rarity-common",
  },
  [Rarity.Rare]: {
    shadow: "shadow-rarity-rare",
    text: "text-rarity-rare",
  },
  [Rarity.Epic]: {
    shadow: "shadow-rarity-epic",
    text: "text-rarity-epic",
  },
  [Rarity.Legendary]: {
    shadow: "shadow-rarity-legendary",
    text: "text-rarity-legendary",
  },
  [Rarity.Mythic]: {
    shadow: "shadow-rarity-mythic",
    text: "text-rarity-mythic",
  },
  [Rarity.Unknown]: {
    shadow: "shadow-rarity-common",
    text: "text-rarity-common",
  },
  [Rarity.Object]: {
    shadow: "shadow-rarity-common",
    text: "text-rarity-common",
  },
};

const temperamentValue = (temperament: Temperament): string => {
  switch (temperament) {
    case Temperament.UNKNOWN:
      return "???";
    case Temperament.N_A:
      return "N/A";
    default:
      return Temperament[temperament];
  }
};

const biomeValue = (biome: Biome): string => {
  return _.startCase(Biome[biome]);
};

function FrogCard({ frog, expanded }: { frog: FrogPOD; expanded?: boolean }) {
  const profileFrog = isProfileFrogPOD(frog) ? frog : undefined;
  const [showMore, setShowMore] = useState(expanded ?? Boolean(profileFrog));
  const textColor = RARE_COLORS[frog.rarity].text || "";

  return (
    <div className="w-full flex flex-col bg-white rounded-lg">
      <div className="w-full flex flex-col gap-4 items-center p-4">
        <ImageZoom
          className={`rounded-lg shadow-frog ${RARE_COLORS[frog.rarity].shadow || ""}`}
          src={frog.imageUrl}
          draggable={false}
          loading="lazy"
          style={{ width: "100%", height: "auto", zIndex: "1000" }}
          options={{
            background: "rgba(0, 0, 0, 0.5)",
          }}
        />

        <div className="flex flex-col items-center gap-1">
          <span
            className={`${RARE_COLORS[frog.rarity].text || ""} text-center uppercase font-bold text-xl`}
          >
            {profileFrog ? profileFrog.profileName : frog.name}
          </span>

          {profileFrog ? (
            <span className="text-gray-400 text-center text-sm">
              {`0x${shortCommitment(profileFrog.profileId)}'s ${frog.name}`}
            </span>
          ) : null}
        </div>

        <FrogAttributes frog={frog} color={textColor} />

        <button
          type="button"
          onClick={() => {
            setShowMore(!showMore);
          }}
          className="text-green-500 hover:text-green-700 transition-colors duration-200"
        >
          {showMore ? "Collapse" : "See more"}
        </button>

        {showMore ? (
          <>
            <p className="text-sm text-gray-700">{frog.description}</p>

            {profileFrog ? <FrogSocialAttributes frog={profileFrog} /> : null}

            <div className="flex justify-between w-full mt-2">
              <FrogAttribute
                label="Signed at"
                title={`Signed at: ${String(frog.timestampSigned)}`}
                value={new Date(frog.timestampSigned).toLocaleDateString()}
                color={textColor}
              />
              <FrogAttribute
                label="Source"
                title="Biome"
                value={biomeValue(frog.biome)}
                color={textColor}
              />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

export function FrogAttributes({
  frog,
  color,
}: {
  frog: IFrogData;
  color: string;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,_1fr)_1px_repeat(5,_minmax(0,_1fr))] gap-4 w-full">
      <FrogAttribute
        label="ID"
        title="ID"
        value={`#${String(frog.frogId)}`}
        color={color}
      />
      <div className="min-w-px max-w-px h-full bg-gray-300" />
      <FrogAttribute label="JMP" title="Jump" value={frog.jump} color={color} />
      <FrogAttribute
        label="VIB"
        title="Vibe"
        value={temperamentValue(frog.temperament)}
        color={color}
      />
      <FrogAttribute
        label="SPD"
        title="Speed"
        value={frog.speed}
        color={color}
      />
      <FrogAttribute
        label="INT"
        title="Intelligence"
        value={frog.intelligence}
        color={color}
      />
      <FrogAttribute
        label="BTY"
        title="Beauty"
        value={frog.beauty}
        color={color}
      />
    </div>
  );
}

export function FrogSocialAttributes({ frog }: { frog: ProfileFrogPOD }) {
  return (
    <div className="grid grid-cols-2 gap-4 w-full">
      <FrogAttribute
        label="TG"
        title="Telegram"
        value={
          frog.telegramUsername ? (
            <a
              className="hover:underline"
              href={`https://t.me/${frog.telegramUsername}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              @{frog.telegramUsername}
            </a>
          ) : (
            <span className="italic">&lt;unk&gt;</span>
          )
        }
      />
      <FrogAttribute
        label="FC"
        title="Farcaster"
        value={
          frog.farcasterUsername ? (
            <a href={`https://farcaster.xyz/${frog.farcasterUsername}`}>
              {frog.farcasterUsername}
            </a>
          ) : (
            <span className="italic">&lt;unk&gt;</span>
          )
        }
      />
    </div>
  );
}

export function FrogAttribute({
  label,
  title,
  value,
  color,
}: {
  label: string;
  title: string;
  value: string | number | React.ReactNode | undefined;
  color?: string;
}) {
  // const attrColor = (
  //   val: string | number | React.ReactNode | undefined
  // ): string => {
  //   if (typeof val === "number") {
  //     if (val <= 3) return "text-red-600";
  //     if (val >= 7) return "text-green-600";
  //   }
  //   return "text-gray-700";
  // };

  return (
    <div className="flex flex-col items-center gap-1 font-mono">
      <span
        className={`${color ?? ""} font-semibold text-xs uppercase`}
        title={title}
      >
        {label}
      </span>
      <span className="text-sm">{formatAttrValue(value)}</span>
    </div>
  );
}

const formatAttrValue = (
  value: string | number | React.ReactNode | undefined
): React.ReactNode => {
  if (typeof value === "number") {
    return String(value).padStart(2, "0");
  }
  return value;
};

export default FrogCard;
