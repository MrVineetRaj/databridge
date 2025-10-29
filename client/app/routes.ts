import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  index("pages/home.tsx"),
  route(
    "//integrations/discord/callback",
    "pages/discord-integration-page.tsx"
  ),
  layout("layouts/console-layout.tsx", [
    route("/console", "pages/console.tsx"),
    route("/console/:project_id", "pages/project-page.tsx"),
    route("/console/:project_id/table", "pages/table-page.tsx"),
  ]),
  route("*", "pages/not-found.tsx"),
] satisfies RouteConfig;
