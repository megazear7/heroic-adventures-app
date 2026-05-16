import z from "zod";

export const RoutePath = z.string();
export type RoutePath = z.infer<typeof RoutePath>;

export const RouteName = z.enum([
  "home",
  "category",
  "entry",
  "search",
  "favorites",
  "recent",
  "settings",
  "characters",
  "character_create",
  "character",
  "adventure_log",
  "encounter_tracker",
  "encounters",
  "encounter_create",
  "encounter",
  "not_found",
]);
export type RouteName = z.infer<typeof RouteName>;

export const RouteConfig = z.object({
  name: RouteName,
  path: RoutePath,
});
export type RouteConfig = z.infer<typeof RouteConfig>;
