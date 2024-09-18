import { z } from "zod";

export const FeedSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),

  private: z.boolean(),
  activeUntil: z.number(),
  cooldown: z.number(),
});

export type Feed = z.infer<typeof FeedSchema>;
