import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { toast } from "sonner";
import { TableContent } from "~/components/projects/table-content";
import { Label } from "~/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useTRPC } from "~/lib/trpc.config";

const TablePage = () => {
  const { project_id } = useParams();
  const trpc = useTRPC();

  const queryClient = useQueryClient();
  const [selectedDatabase, setSelectedDatabase] = useState<number>(0);
  const [selectedTable, setSelectedTable] = useState<number>(0);

  const { data: databases, isPending: loadingDatabase } = useQuery(
    trpc.projectRoutes.getDatabasesInsideProject.queryOptions({
      projectId: project_id as string,
    })
  );

  const deleteItemFromTable = useMutation(
    trpc.projectRoutes.deleteItemFromDatabase.mutationOptions({
      onSuccess: (res) => {
        console.log(res);
        toast.success(JSON.stringify(res), {
          id: "delete-message",
          duration: 2000,
        });
      },
      onError: (err) => {
        console.log(err);
        toast.error(JSON.stringify(err.message), {
          id: "delete-message",
          duration: 2000,
        });
      },
    })
  );

  const { data: tables, isPending: loadingTables } = useQuery(
    trpc.projectRoutes.getTablesOfADatabase.queryOptions({
      projectId: project_id as string,
      dbName: databases?.data ? databases?.data[selectedDatabase] : "XXXXX",
    })
  );

  const { data: tableContent, isPending: loadingTableContent } = useQuery(
    trpc.projectRoutes.getTableContent.queryOptions({
      dbName: databases?.data ? databases?.data[selectedDatabase] : "XXXXX",
      tableName:
        "public." +
        (tables?.data ? tables?.data[selectedTable]?.tableName : "XXXXX"),
      page: 1,
      limit: 20,
      projectId: project_id as string,
    })
  );

  // Remove the useEffects since queries will automatically refetch when dependencies change
  useEffect(() => {
    setSelectedTable(0); // Reset table selection when database changes
  }, [selectedDatabase]);

  if (!databases?.data) {
    return "Loading databases";
  }

  return (
    <div className="p-4 space-y-2">
      <Label>Databases</Label>
      <Tabs value={databases?.data[selectedDatabase]}>
        <TabsList className="flex gap-2">
          {databases?.data?.map((db: string, idx) => {
            return (
              <TabsTrigger
                key={idx}
                value={db}
                onClick={() => {
                  setSelectedDatabase(idx);
                }}
              >
                {db}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <Label className="mt-4">Tables</Label>
        {databases?.data?.map((db: string) => {
          if (!tables?.data) return null;
          return (
            <TabsContent value={db} key={db}>
              {tables?.data && (
                <Tabs value={tables?.data[selectedTable]?.tableName}>
                  <TabsList className="flex gap-2">
                    {tables?.data?.map(
                      (
                        table: { tableName: string; primaryKey: string },
                        idx
                      ) => {
                        return (
                          <TabsTrigger
                            key={table?.tableName}
                            value={table?.tableName}
                            onClick={() => {
                              setSelectedTable(idx);
                            }}
                          >
                            {table?.tableName}
                          </TabsTrigger>
                        );
                      }
                    )}
                  </TabsList>
                  <p
                    onClick={() => {
                      toast.loading("Deleting item", {
                        id: "delete-message",
                      });
                      deleteItemFromTable.mutateAsync({
                        tableName: "User",
                        primaryKey: "id",
                        primaryKeyValue: "cmgut2kef0000i00wiix60hoh",
                        dbName: "verdict_aa5446ee_db",
                        projectId: "cmguszdo70001i07qxjf06btr",
                      });
                    }}
                  >
                    Delete
                  </p>

                  {loadingTableContent ? (
                    <p>Loading Content</p>
                  ) : tableContent?.data?.data && tableContent?.data?.data.length > 0 ? (
                    <TableContent data={tableContent?.data?.data} />
                  ) : (
                    "No content"
                  )}
                </Tabs>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default TablePage;
