import { type DexFrog, type FrogCryptoFrogData } from "@pcd/passport-interface";
import { Rarity } from "@pcd/eddsa-frog-pcd";
import { parseFrogEnum } from "../utils";

export const testFrogs: FrogCryptoFrogData[] = [
  {
    id: 1,
    name: "Purple Fluorescent Frog",
    biome: "Jungle",
    rarity: "common",
    drop_weight: 50,
    description:
      "The purple fluorescent frog is a rare species found in the jungles of India.",
    jump_min: 0,
    jump_max: 7,
    speed_min: 0,
    speed_max: 7,
    intelligence_min: 0,
    intelligence_max: 7,
    beauty_min: 0,
    beauty_max: 7,
    uuid: "b5af0796-c038-4f47-9aa2-1cff2b005ad7",
  },
  {
    id: 2,
    name: "Mossy Frog",
    biome: "Jungle",
    rarity: "common",
    drop_weight: 50,
    description:
      "The mossy frog is a rare species found in the jungles of Vietnam.",
    jump_min: 0,
    jump_max: 7,
    speed_min: 0,
    speed_max: 7,
    intelligence_min: 0,
    intelligence_max: 7,
    beauty_min: 0,
    beauty_max: 7,
    uuid: "78c8c92e-466b-49f8-b82f-b0b29dccb567",
  },
  {
    id: 3,
    name: "Black Rain Frog",
    biome: "Desert",
    rarity: "common",
    drop_weight: 50,
    description:
      "The black rain frog is a rare species found in the deserts of South Africa.",
    jump_min: 0,
    jump_max: 7,
    speed_min: 0,
    speed_max: 7,
    intelligence_min: 0,
    intelligence_max: 7,
    beauty_min: 0,
    beauty_max: 7,
    uuid: "b5ce3905-4ac7-4b46-9d9d-f9b816de9fae",
  },
  {
    id: 4,
    name: "Goliath Frog",
    biome: "Desert",
    rarity: "common",
    drop_weight: 50,
    description:
      "The Goliath frog is a rare species found in the deserts of West Africa.",
    jump_min: 0,
    jump_max: 7,
    speed_min: 0,
    speed_max: 7,
    intelligence_min: 0,
    intelligence_max: 7,
    beauty_min: 0,
    beauty_max: 7,
    uuid: "aef1c9f6-0c14-4ebb-99c7-951b23580970",
  },
];

export const testPossibleFrogs: DexFrog[] = testFrogs.map((frog) => ({
  id: frog.id,
  rarity: parseFrogEnum(Rarity, frog.rarity),
}));
