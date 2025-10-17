import { useTRPC } from "~/lib/trpc.config";
import type { Route } from "./+types/home";
import { useQuery } from "@tanstack/react-query";
export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  const trpc = useTRPC();
  const { data: healthResult } = useQuery(
    trpc.healthRoutes.trpcHealth.queryOptions()
  );
  return <p className="p-8">{healthResult?.message}</p>;
}
