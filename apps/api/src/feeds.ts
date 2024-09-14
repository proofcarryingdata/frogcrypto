import { FrogCryptoClientFeed, FrogCryptoFeed } from "@pcd/passport-interface";

export const FEEDS = [
  {
    id: "7d27baf6-c568-4069-92c7-fc5daae854f6",
    name: "Swamp",
    description:
      "Veiled in mist and teeming with life, the labyrinthine Swamp is home to a plethora of frogs.",
    permissions: [{ folder: "FrogCrypto", type: "AppendToFolder_permission" }],
    credentialRequest: { signatureType: "sempahore-signature-pcd" },
    autoPoll: false,
    private: false,
    activeUntil: 1893484800,
    cooldown: 900,
    biomes: {
      1: { dropWeightScaler: 1 },
    },
  },
] satisfies FrogCryptoFeed[];
