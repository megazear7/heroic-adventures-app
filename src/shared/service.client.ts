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
];

export class ClientService extends AbstractService<NoBodyParams, NoPathParams, string> {
  readonly type = ServiceType.enum.html;
  readonly method = HttpMethod.enum.get;
  readonly path = routes.map((route) => route.path);
}

export const clientService = new ClientService(NoBodyParams, NoPathParams, z.string());
