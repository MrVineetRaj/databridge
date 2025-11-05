import { CogIcon, GitBranchIcon } from "lucide-react";
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
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { envConf } from "~/lib/envConf";
import { useEffect, useState } from "react";
import { useTRPC } from "~/lib/trpc.config";
import { useQuery } from "@tanstack/react-query";
import { cn } from "~/lib/utils";
import { WhitelistedIPs } from "./ip-rules";

export function SettingDialog() {
  const location = useLocation();
  const navigate = useNavigate();
  const IntegrationsPlatform = [
    { platform: "Discord", icon: "/icons/discord.png" },
  ];
  const [channelId, setChanelId] = useState<string>("");
  const [channelURL, setChanelURL] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("");

  const trpc = useTRPC();
  const { data: integration } = useQuery(
    trpc.discordIntegrationRoutes.getDiscordIntegration.queryOptions()
  );

  useEffect(() => {
    if (integration?.data) {
      setChanelId(integration?.data?.channelId);
    }
  }, [integration]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabValue = params.get("configuration-tab");
    if (tabValue) {
      setActiveTab(tabValue);
      setOpen(true);
    }
  }, [location.search]);

  useEffect(() => {
    if (!open) {
      navigate(location.pathname);
    }
  }, [open]);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Here you can configure your project
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab}>
          <TabsList>
            <TabsTrigger
              value="integrations"
              onClick={() => {
                navigate(location.pathname + "?configuration-tab=integrations");
              }}
            >
              Integrations
            </TabsTrigger>
            <TabsTrigger
              value="ip-rules"
              onClick={() => {
                navigate(location.pathname + "?configuration-tab=ip-rules");
              }}
            >
              IP Rules
            </TabsTrigger>
          </TabsList>
          <TabsContent value="integrations">
            <h2 className="mt-4 text-lg font-bold">Discord Integration</h2>
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
          </TabsContent>
          <TabsContent value="ip-rules">
            <WhitelistedIPs />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
