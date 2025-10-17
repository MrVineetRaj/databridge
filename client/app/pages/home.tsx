import { useTRPC } from "~/lib/trpc.config";
import type { Route } from "./+types/home";
import { useQuery } from "@tanstack/react-query";
import { useUserStore } from "~/store/user-store";
import { useEffect } from "react";
import { Navbar } from "~/components/shared/nav-bar";
export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return (
    <main className="w-screen h-screen">
      <Navbar />
    </main>
  );
}
