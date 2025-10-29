import { useMutation, useQuery } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Navbar } from "~/components/shared/nav-bar";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useTRPC } from "~/lib/trpc.config";
import { useUserStore } from "~/store/user-store";

const DiscordIntegrationPage = () => {
  const { user, logout, isAuthenticated, error, loadingUser } = useUserStore();
  const [channelURL, setChannelURL] = useState<string>("");
  const navigate = useNavigate();
  const trpc = useTRPC();
  const [isAlreadyLinked, setAlreadyLinked] = useState<boolean>(false);
  const { data: integration } = useQuery(
    trpc.discordIntegrationRoutes.getDiscordIntegration.queryOptions()
  );
  const addNewIntegration = useMutation(
    trpc.discordIntegrationRoutes.addNewIntegration.mutationOptions({
      onSuccess: (res) => {
        toast.success(res.message, {
          id: "integration-status",
          duration: 3000,
        });
        navigate("/console");
      },
    })
  );
  useEffect(() => {
    if (!loadingUser && !isAuthenticated && error) {
      navigate("/");
      return;
    }
  }, [isAuthenticated, error, loadingUser]);

  useEffect(() => {
    if (integration?.data) {
      console.log("integration", integration);
      setChannelURL(integration?.data?.channelId);
      setAlreadyLinked(true);
    }
  }, [integration]);

  return (
    <>
      <Navbar />
      <div className="flex items-center py-[30vh] w-screen justify-center">
        <div className="shadow-xl rounded-md p-4 flex items-start flex-col justify-center gap-4">
          <p className="text-lg font-bold">Integrating Discord</p>
          <span className="">
            <Label>Channel {isAlreadyLinked ? "ID " : "URL"}</Label>
            <Input
              className="min-w-72"
              value={channelURL}
              onChange={(e) => {
                setChannelURL(e.target.value);
              }}
              disabled={isAlreadyLinked}
            />
          </span>
          <Button
            className="w-full"
            disabled={addNewIntegration?.isPending || isAlreadyLinked}
            onClick={() => {
              toast.loading("Adding Integration", {
                id: "integration-status",
              });

              const channelId = channelURL.split("/").pop();

              if (!channelId)
                toast.warning("Invalid channel url", {
                  id: "integration-status",
                  duration: 3000,
                });
              addNewIntegration.mutateAsync({
                channelId: channelURL.split("/").pop() as string,
              });
            }}
          >
            Integrate
          </Button>
        </div>
      </div>
    </>
  );
};

export default DiscordIntegrationPage;
