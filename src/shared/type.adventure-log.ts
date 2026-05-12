// Adventure Log types and Zod schemas for validation
import { z } from "zod";

export const AdventureLogSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  session: z.number().int().min(1),
  date: z.string(),
  summary: z.string(),
  characterIds: z.array(z.string()),
  tags: z.array(z.string()),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type AdventureLog = z.infer<typeof AdventureLogSchema>;
