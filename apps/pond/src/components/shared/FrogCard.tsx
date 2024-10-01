import React, { useState } from "react";
import _ from "lodash";
import {
  type IFrogData,
  Rarity,
  Temperament,
  Biome,
} from "@pcd/eddsa-frog-pcd";
import { shortCommitment, type ProfileFrogPOD } from "@frogcrypto/shared";
import ImageZoom from "./ImageZoom";

const RARE_COLORS: Record<Rarity, string> = {
  [Rarity.Common]: "bg-green-600",
  [Rarity.Rare]: "bg-blue-500",
  [Rarity.Epic]: "bg-purple-600",
  [Rarity.Legendary]: "bg-yellow-500",
  [Rarity.Mythic]: "bg-red-600",
  [Rarity.Unknown]: "bg-gray-500",
  [Rarity.Object]: "bg-gray-500",
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

function FrogCard({ frog, expanded }: { frog: IFrogData; expanded?: boolean }) {
  const profileFrog =
    // TODO: better type checking
    "profileId" in frog ? (frog as ProfileFrogPOD) : undefined;
  const [showMore, setShowMore] = useState(expanded ?? Boolean(profileFrog));

  return (
    <div className="w-full flex flex-col bg-white rounded-lg shadow-md">
      <div
        className={`${RARE_COLORS[frog.rarity] || "bg-gray-700"} text-white text-center py-2 px-4 w-full rounded-t-lg`}
      >
        {profileFrog
          ? `0x${shortCommitment(profileFrog.profileId)}'s ${frog.name}`
          : `#${String(frog.frogId)} ${frog.name}`}
      </div>

      <div className="w-full flex flex-col gap-4 items-center p-4">
        <ImageZoom
          src={frog.imageUrl}
          draggable={false}
          loading="lazy"
          style={{ width: "100%", height: "auto", zIndex: "1000" }}
          options={{
            background: "rgba(0, 0, 0, 0.5)",
          }}
        />

        <FrogAttributes frog={frog} />

        {profileFrog ? <FrogSocialAttributes frog={profileFrog} /> : null}

        <button
          type="button"
          onClick={() => {
            setShowMore(!showMore);
          }}
          className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
        >
          {showMore ? "Collapse" : "See more"}
        </button>

        {showMore ? (
          <>
            <p className="text-sm text-gray-700">{frog.description}</p>
            <div className="flex justify-between w-full mt-2">
              <FrogAttribute
                label="Signed at"
                title={`Signed at: ${String(frog.timestampSigned)}`}
                value={new Date(frog.timestampSigned).toLocaleDateString()}
              />
              <FrogAttribute
                label="Source"
                title="Biome"
                value={biomeValue(frog.biome)}
              />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

export function FrogAttributes({ frog }: { frog: IFrogData }) {
  return (
    <div className="grid grid-cols-5 gap-4 w-full">
      <FrogAttribute label="JMP" title="Jump" value={frog.jump} />
      <FrogAttribute
        label="VIB"
        title="Vibe"
        value={temperamentValue(frog.temperament)}
      />
      <FrogAttribute label="SPD" title="Speed" value={frog.speed} />
      <FrogAttribute
        label="INT"
        title="Intelligence"
        value={frog.intelligence}
      />
      <FrogAttribute label="BTY" title="Beauty" value={frog.beauty} />
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
            <a href={`https://t.me/${frog.telegramUsername}`}>
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
}: {
  label: string;
  title: string;
  value: string | number | React.ReactNode | undefined;
}) {
  const attrColor = (
    val: string | number | React.ReactNode | undefined
  ): string => {
    if (typeof val === "number") {
      if (val <= 3) return "text-red-600";
      if (val >= 7) return "text-green-600";
    }
    return "text-gray-700";
  };

  return (
    <div className="flex flex-col items-center gap-1 font-mono">
      <div className="font-bold text-xs uppercase text-gray-600" title={title}>
        {label}
      </div>
      <div className={`text-sm ${attrColor(value)}`}>
        {formatAttrValue(value)}
      </div>
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
