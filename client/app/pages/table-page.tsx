import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
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

  // Fix: Use selectedDatabase instead of hardcoded 0
  const { data: tables, isPending: loadingTables } = useQuery(
    trpc.projectRoutes.getTablesOfADatabase.queryOptions({
      projectId: project_id as string,
      dbName: databases?.data ? databases?.data[selectedDatabase] : "XXXXX",
    })
  );

  // Fix: Use selectedDatabase and selectedTable
  const { data: tableContent, isPending: loadingTableContent } = useQuery(
    trpc.projectRoutes.getTableContent.queryOptions({
      dbName: databases?.data ? databases?.data[selectedDatabase] : "XXXXX",
      tableName: "public." + (tables?.data ? tables?.data[selectedTable] : "XXXXX"),
      page: 1,
      limit: 20,
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
          return (
            <TabsContent value={db} key={db}>
              {tables?.data && (
                <Tabs value={tables?.data[selectedTable]}>
                  <TabsList className="flex gap-2">
                    {tables?.data?.map((table: string, idx) => {
                      return (
                        <TabsTrigger
                          key={table}
                          value={table}
                          onClick={() => {
                            setSelectedTable(idx);
                          }}
                        >
                          {table}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>

                  {loadingTableContent ? (
                    <p>Loading Content</p>
                  ) : tableContent?.data?.data ? (
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