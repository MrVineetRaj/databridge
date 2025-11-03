import { useMutation, useQuery } from "@tanstack/react-query";
import { DownloadIcon } from "lucide-react";
import { useParams } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { useTRPC } from "~/lib/trpc.config";
import { cn } from "~/lib/utils";

const RollbackPage = () => {
  const { project_id } = useParams();
  const trpc = useTRPC();
  const { data: backups } = useQuery(
    trpc.projectRoutes.getBackups.queryOptions({
      projectId: project_id as string,
    })
  );
  const downloadBackup = useMutation(
    trpc.projectRoutes.downloadBackup.mutationOptions({
      onSuccess: (result) => {
        const binaryString = atob(result.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const blob = new Blob([bytes], { type: result.contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.fileName;
        a.click();
        URL.revokeObjectURL(url);
      },
    })
  );
  return (
    <>
      <header className="flex items-center h-14 bg-sidebar border-b w-full p-4">
        <p className="font-semibold">{"Rollback Page"}</p>
      </header>
      {backups && backups.data && backups.data.length > 0 && (
        <div className=" p-4">
          <Table
            className="mt-4"
            style={{
              scrollbarWidth: "none",
            }}
          >
            <TableHeader className="bg-white">
              <TableRow>
                <TableHead className="border">Database</TableHead>
                <TableHead className="border">Created At</TableHead>
                <TableHead className="border">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="">
              {backups?.data?.map((it, itemIdx) => (
                <TableRow key={it.id}>
                  <TableCell className=" border bg-white">
                    {it.dbName}
                  </TableCell>
                  <TableCell className=" border bg-white">
                    {it.createdAt}
                  </TableCell>
                  <TableCell className=" border bg-white">
                    <DownloadIcon
                      className="cursor-pointer"
                      onClick={() => {
                        downloadBackup.mutateAsync({
                          projectId: project_id as string,
                          backupId: it.id,
                        });
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
};

export default RollbackPage;
