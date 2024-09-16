import React, { useState } from "react";
import _ from "lodash";
import { IFrogData, Rarity, Temperament, Biome } from "@pcd/eddsa-frog-pcd";
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

const FrogCard: React.FC<{ frog: IFrogData }> = ({ frog }) => {
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="w-full flex flex-col bg-white rounded-lg shadow-md">
      <div
        className={`${RARE_COLORS[frog.rarity] || "bg-gray-700"} text-white text-center py-2 px-4 w-full rounded-t-lg`}
      >
        {`#${frog.frogId} ${frog.name}`}
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

        <button
          onClick={() => setShowMore(!showMore)}
          className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
        >
          {showMore ? "Collapse" : "See more"}
        </button>

        {showMore && (
          <>
            <p className="text-sm text-gray-700">{frog.description}</p>
            <div className="flex justify-between w-full mt-2">
              <FrogAttribute
                label="Signed at"
                title={`Signed at: ${frog.timestampSigned}`}
                value={new Date(frog.timestampSigned).toLocaleDateString()}
              />
              <FrogAttribute
                label="Source"
                title="Biome"
                value={biomeValue(frog.biome)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

interface FrogAttributeProps {
  label: string;
  title: string;
  value: string | number | undefined;
}

const FrogAttribute: React.FC<FrogAttributeProps> = ({
  label,
  title,
  value,
}) => {
  const attrColor = (val: string | number | undefined): string => {
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
};

const formatAttrValue = (value: string | number | undefined): string => {
  if (typeof value === "number") {
    return String(value).padStart(2, "0");
  }
  return String(value);
};

export default FrogCard;
