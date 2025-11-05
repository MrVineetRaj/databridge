import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { useParams } from "react-router";
import { Input } from "../ui/input";
import { CheckIcon, TrashIcon } from "lucide-react";
import { toast } from "sonner";
import { useTRPC } from "~/lib/trpc.config";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Skeleton } from "../ui/skeleton";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";

export const WhitelistedIPs = () => {
  const { project_id } = useParams();
  const [addingNewIp, setAddingNewIp] = useState<boolean>(false);
  const [newIpValue, setNewIpValue] = useState<string>("");
  const trpc = useTRPC();
  const [whitelistedIPs, setWhitelistedIPs] = useState<
    {
      projectId: string;
      id: string;
      ip: string;
      updatedAt: string;
      createdAt: string;
      dbName: string;
      isActive: boolean;
    }[]
  >([]);
  const { data: whitelistedIpsFromDB, isPending: loadingWhitelistedIps } =
    useQuery(
      trpc.dbInstanceRoutes.getWhitelistedIps.queryOptions({
        projectId: project_id as string,
      })
    );
  const addNewIP = useMutation(
    trpc.dbInstanceRoutes.addNewWhiteListedIp.mutationOptions({
      onSuccess: (res) => {
        toast.success("Successfully added new IP address", {
          id: "ip-config",
          duration: 3000,
        });
        setAddingNewIp(false);
        setNewIpValue("");
        if (res?.data) {
          const newIpDetail = res?.data;
          setWhitelistedIPs((prev) => [...prev, newIpDetail]);
        }
      },
      onError: (err) => {
        toast.error(err.message || "Couldn't add IP,try again later", {
          id: "ip-config",
          duration: 3000,
        });
      },
    })
  );

  useEffect(() => {
    if (whitelistedIpsFromDB?.data) {
      setWhitelistedIPs(whitelistedIpsFromDB?.data);
    }
  }, [whitelistedIpsFromDB?.data]);

  const handleAddNewIp = () => {
    if (newIpValue === "") {
      toast.warning("Please enter valid IPv4", {
        id: "ip-config",
        duration: 3000,
      });
      return;
    }

    toast.loading("Adding Ip address", {
      id: "ip-config",
    });

    addNewIP.mutateAsync({
      projectId: project_id as string,
      ip: newIpValue,
    });
  };
  return (
    <div>
      <span className="flex items-center justify-between">
        <h2 className="font-bold">Whitelisted IP </h2>
        <Button
          variant={addingNewIp ? "destructive" : "default"}
          onClick={() => {
            setAddingNewIp((prev) => !prev);
          }}
        >
          {addingNewIp ? "Cancel" : "Add IP"}
        </Button>
      </span>
      {addingNewIp && (
        <span className="w-full">
          <label htmlFor="">New Ip</label>
          <span className="flex items-center gap-2">
            <Input
              value={newIpValue}
              onChange={(e) => {
                setNewIpValue(e.target.value);
              }}
            />
            <Button
              className=""
              onClick={() => {
                handleAddNewIp();
              }}
            >
              <CheckIcon />
            </Button>
          </span>
        </span>
      )}
      {loadingWhitelistedIps ? (
        <span className="flex flex-col gap-2 mt-2">
          {Array.from({ length: 3 }).map((_, idx) => {
            return <Skeleton className="h-10 w-full" />;
          })}
        </span>
      ) : whitelistedIPs.length > 0 ? (
        <span className="mt-4 flex flex-col">
          {whitelistedIPs?.map((ipDetails, idx) => {
            return (
              <span className="flex items-center justify-between">
                <span className="text-sm flex gap-2 items-center">
                  {ipDetails.ip}
                </span>
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-xs rounded-full px-2 ",
                      ipDetails.isActive
                        ? "bg-primary/10 text-primary"
                        : "bg-destructive/10 text-destructive"
                    )}
                  >
                    {ipDetails.isActive ? "active" : "inactive"}
                  </span>
                  <TrashIcon className="size-4 text-destructive cursor-pointer" />
                </span>
              </span>
            );
          })}
          <p className="text-center italic text-sm mt-2">
            new IP take 1.5hrs to reflect
          </p>
        </span>
      ) : (
        <p className="text-center w-full text-sm italic mt-4">
          Currently database has public access
        </p>
      )}
    </div>
  );
};
