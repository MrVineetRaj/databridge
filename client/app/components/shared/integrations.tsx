import { GitBranchIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Link } from "react-router";
import { envConf } from "~/lib/envConf";
import { useEffect, useState } from "react";
import { useTRPC } from "~/lib/trpc.config";
import { useQuery } from "@tanstack/react-query";

export function IntegrationForm() {
  const IntegrationsPlatform = [
    { platform: "Discord", icon: "/icons/discord.png" },
  ];
  const [channelId, setChanelId] = useState<string>("");
  const [channelURL, setChanelURL] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);

  const trpc = useTRPC();
  const { data: integration } = useQuery(
    trpc.discordIntegrationRoutes.getDiscordIntegration.queryOptions()
  );

  useEffect(() => {
    if (integration?.data) {
      setChanelId(integration?.data?.channelId);
    }
  }, [integration]);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <form>
        <DialogTrigger asChild>
          <Button variant="outline">
            <GitBranchIcon />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Discord Integration</DialogTitle>
            <DialogDescription>
              Here you can configure your discord integration
            </DialogDescription>
          </DialogHeader>

          <div className="w-full py-10 flex flex-col items-center justify-center">
            {channelId ? (
              <span className="space-y-2">
                <Label>Channel Id</Label>
                <Input disabled value={channelId} />
              </span>
            ) : (
              <Link to={envConf.VITE_DISCORD_BOT_INSTALLATION_URL}>
                <Button>Integrate</Button>
              </Link>
            )}
          </div>
        </DialogContent>
      </form>
    </Dialog>
  );
}
