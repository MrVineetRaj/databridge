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
  route("/console", "pages/console.tsx"),
  layout("layouts/console-layout.tsx", [
    route("/console/:project_id", "pages/project-page.tsx"),
    route("/console/:project_id/table", "pages/table-page.tsx"),
    route("/console/:project_id/rollback", "pages/rollback-page.tsx"),
  ]),
  route("*", "pages/not-found.tsx"),
] satisfies RouteConfig;
