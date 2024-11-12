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
  shortCommitmentHex,
  shortSemaphoreId,
} from "@frogcrypto/shared";
import { isProfileFrogPOD } from "../../hooks/useFrogs";
import FrogImg from "./FrogImg";

export const RARITY_COLORS: Record<
  Rarity,
  {
    label: string;
    shadow: string;
    text: string;
    color: string;
  }
> = {
  [Rarity.Common]: {
    label: "NORM",
    shadow: "shadow-rarity-common",
    text: "text-rarity-common",
    color: "#2D9061",
  },
  [Rarity.Rare]: {
    label: "RARE",
    shadow: "shadow-rarity-rare",
    text: "text-rarity-rare",
    color: "#4595B2",
  },
  [Rarity.Epic]: {
    label: "EPIC",
    shadow: "shadow-rarity-epic",
    text: "text-rarity-epic",
    color: "#683EAA",
  },
  [Rarity.Legendary]: {
    label: "LGND",
    shadow: "shadow-rarity-legendary",
    text: "text-rarity-legendary",
    color: "#F19E38",
  },
  [Rarity.Mythic]: {
    label: "MYTH",
    shadow: "shadow-rarity-mythic",
    text: "text-rarity-mythic",
    color:
      "linear-gradient(261deg, #D1FFD3 2.82%, #EAF 39.21%, #5BFFFF 99.02%)",
  },
  [Rarity.Unknown]: {
    label: "UNKN",
    shadow: "shadow-rarity-common",
    text: "text-rarity-common",
    color: "#2D9061",
  },
  [Rarity.Object]: {
    label: "OBJT",
    shadow: "shadow-rarity-common",
    text: "text-rarity-common",
    color: "#2D9061",
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

export function FrogCardHeader({
  rarity,
  title,
  subtitle,
}: {
  rarity: Rarity;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center">
      <span
        className={`${RARITY_COLORS[rarity].text || ""} text-center uppercase font-bold text-xl`}
      >
        {title}
      </span>

      {subtitle ? (
        <span
          className={`${RARITY_COLORS[rarity].text || ""} text-center text-sm`}
        >
          {subtitle}
        </span>
      ) : null}
    </div>
  );
}

function FrogCard({
  frog,
  expanded,
  style,
}: {
  frog: FrogPOD;
  expanded?: boolean;
  style?: React.CSSProperties;
}) {
  const profileFrog = isProfileFrogPOD(frog) ? frog : undefined;
  const [showMore, setShowMore] = useState(expanded);
  const [showAsPOD, setShowAsPOD] = useState(false);
  const textColor = RARITY_COLORS[frog.rarity].text || "";

  return (
    <div
      className="w-full flex flex-col bg-white rounded-lg font-mono"
      style={style}
    >
      <div className="w-full flex flex-col gap-4 items-center p-4">
        <FrogImg
          frog={frog}
          className={`rounded-lg shadow-frog ${RARITY_COLORS[frog.rarity].shadow || ""}`}
        />

        <FrogCardHeader
          rarity={frog.rarity}
          title={profileFrog ? profileFrog.profileName : frog.name}
          subtitle={
            profileFrog
              ? `${shortSemaphoreId(profileFrog.profileId)}'s ${frog.name}`
              : undefined
          }
        />

        <FrogAttributes frog={frog} color={textColor} />

        <button
          type="button"
          onClick={() => {
            setShowMore(!showMore);
            setShowAsPOD(false);
          }}
          className="text-green-500 hover:text-green-700 transition-colors duration-200"
        >
          {showMore ? "Collapse" : "See more"}
        </button>

        {showMore ? (
          <>
            {showAsPOD ? (
              <pre className="text-xs text-gray-700 truncate whitespace-pre overflow-clip w-full">
                {JSON.stringify(frog, null, 2)}
              </pre>
            ) : (
              <>
                <p className="text-xs text-gray-700">{frog.description}</p>

                <div className="w-full rounded-md border border-gray-300 grid grid-cols-2 py-3 gap-3 text-sm">
                  <div className="text-moss-700 px-3">Signed at</div>
                  <div
                    className="text-right px-3 font-medium"
                    title={`Signed at: ${String(frog.timestampSigned)}`}
                  >
                    {new Date(frog.timestampSigned).toLocaleDateString()}
                  </div>
                </div>

                {profileFrog ? (
                  <FrogSocialAttributes frog={profileFrog} />
                ) : null}
              </>
            )}

            <button
              type="button"
              onClick={() => {
                setShowAsPOD(!showAsPOD);
              }}
              className="text-green-500 hover:text-green-700 transition-colors duration-200"
            >
              {showAsPOD ? "View as Frog" : "View as POD"}
            </button>
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
    <div className="grid grid-cols-5 gap-4 w-full">
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
    <div className="w-full rounded-md border border-gray-300 grid grid-cols-2 py-3 gap-3 text-sm">
      <div className="text-moss-700 px-3">Public Key</div>
      <div className="text-right px-3 font-medium">
        {shortCommitmentHex(frog.signerPublicKey)}
      </div>

      <div className="col-span-2 h-px bg-gray-300" />

      <div className="text-moss-700 px-3">Telegram</div>
      <div className="text-right px-3 font-medium">
        {frog.telegramUsername ? (
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
        )}
      </div>

      <div className="col-span-2 h-px bg-gray-300" />

      <div className="text-moss-700 px-3">Farcaster</div>
      <div className="text-right px-3 font-medium">
        {frog.farcasterUsername ? (
          <a href={`https://farcaster.xyz/${frog.farcasterUsername}`}>
            {frog.farcasterUsername}
          </a>
        ) : (
          <span className="italic">&lt;unk&gt;</span>
        )}
      </div>
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
  return (
    <div className="flex flex-col items-center gap-1 font-mono">
      <span className={`${color ?? ""} text-sm uppercase`} title={title}>
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
