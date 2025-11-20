import React from "react";
import { useIsMobile } from "~/hooks/use-mobile";
import { cn } from "~/lib/utils";
import { useUserStore } from "~/store/user-store";
import { Button } from "../ui/button";
import { useNavigate } from "react-router";
import { LogOutIcon } from "lucide-react";
import { ModeToggle } from "./mode-toggle";

export const Navbar = () => {
  const { isAuthenticated, login, user, logout } = useUserStore();
  const navigate = useNavigate();
  return (
    <nav
      className={cn(
        "bg-sidebar border-b h-14 flex items-center justify-between p-4 md:p-8"
      )}
    >
      <h2 className="text-lg font-bold">DataBridge</h2>
      <span className="flex items-center gap-2">
        {isAuthenticated ? (
          <>
            <Button
              onClick={() => {
                navigate("/console");
              }}
            >
              Go to Console
            </Button>
            <Button size={"sm"} className="p-0" variant={"ghost"}>
              <img
                src={user?.avatar}
                alt={user?.name?.split(" ").join("_")}
                className="size-8 rounded-full"
              />
            </Button>
            <Button
              size={"sm"}
              className="p-0"
              variant={"destructive"}
              onClick={() => {
                logout();
              }}
            >
              <LogOutIcon />
            </Button>
            <ModeToggle />
          </>
        ) : (
          <Button
            onClick={() => {
              login({ authProvider: "github" });
            }}
          >
            Get Started
          </Button>
        )}

        <ModeToggle />
      </span>
    </nav>
  );
};
