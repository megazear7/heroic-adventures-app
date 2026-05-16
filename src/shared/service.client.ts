import z from "zod";
import { AbstractService, NoBodyParams, NoPathParams, ServiceType } from "./main.service.js";
import { HttpMethod } from "./type.http.js";
import { RouteName } from "./type.routes.js";

export const routes = [
  {
    name: RouteName.enum.home,
    path: "/",
  },
  {
    name: RouteName.enum.category,
    path: "/:categoryId",
  },
  {
    name: RouteName.enum.entry,
    path: "/:categoryId/:entrySlug",
  },
  {
    name: RouteName.enum.search,
    path: "/search",
  },
  {
    name: RouteName.enum.favorites,
    path: "/favorites",
  },
  {
    name: RouteName.enum.recent,
    path: "/recent",
  },
  {
    name: RouteName.enum.settings,
    path: "/settings",
  },
  {
    name: RouteName.enum.characters,
    path: "/characters",
  },
  {
    name: RouteName.enum.character_create,
    path: "/character/create",
  },
  {
    name: RouteName.enum.character,
    path: "/character/:characterId",
  },
  {
    name: RouteName.enum.adventure_log,
    path: "/adventure-log",
  },
  {
    name: RouteName.enum.encounter_tracker,
    path: "/encounter-tracker",
  },
];

export class ClientService extends AbstractService<NoBodyParams, NoPathParams, string> {
  readonly type = ServiceType.enum.html;
  readonly method = HttpMethod.enum.get;
  readonly path = routes.map((route) => route.path);
}

export const clientService = new ClientService(NoBodyParams, NoPathParams, z.string());
