import { createContext } from "@lit/context";
import z from "zod";
import { LoadingStatus } from "../shared/type.loading.js";
import { ContentCategory } from "../shared/type.content.js";

export const AppContext = z.object({
  categories: z.array(ContentCategory).optional(),
  status: LoadingStatus,
  error: z.string().optional(),
});
export type AppContext = z.infer<typeof AppContext>;
export const appContext = createContext<AppContext>("app");
