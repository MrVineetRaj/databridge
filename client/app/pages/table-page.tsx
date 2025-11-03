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
  const [tableContentToBeDisplayed, setTableContentToBeDisplayed] = useState<
    { [key: string]: string }[]
  >([]);

  const deleteItemFromTable = useMutation(
    trpc.dbInstanceRoutes.deleteItemFromDatabase.mutationOptions({
      onSuccess: (res) => {
        console.log(res);
        toast.success(res.message, {
          id: "table-query",
          duration: 3000,
        });
        // queryClient.invalidateQueries(
        //   trpc.projectRoutes.getTableContent.queryOptions({
        //     dbName: databases?.data
        //       ? databases?.data[selectedDatabase]
        //       : "XXXXX",
        //     tableName:
        //       "public." +
        //       (tables?.data ? tables?.data[selectedTable]?.tableName : "XXXXX"),
        //     page: 1,
        //     limit: 20,
        //     projectId: project_id as string,
        //   })
        // );
      },
      onError: (err) => {
        console.log(err);
        toast.error(JSON.stringify(err.message), {
          id: "table-query",
          duration: 3000,
        });
      },
    })
  );
  const runSqlQuery = useMutation(
    trpc.dbInstanceRoutes.searchItemsUsingSqlQuery.mutationOptions({
      onSuccess: (res) => {
        toast.success(res?.message, {
          duration: 3000,
          id: "table-query",
        });
        setTableContentToBeDisplayed(res?.data ?? []);
      },
      onError: (err) => {
        toast.error(err.message || "Failed to fetch sql query result", {
          duration: 3000,
          id: "table-query",
        });
      },
    })
  );

  const saveChanges = useMutation(
    trpc.dbInstanceRoutes.updateMultipleRows.mutationOptions({
      onSuccess: (res) => {
        toast.success(res?.message, {
          duration: 3000,
          id: "table-query",
        });

        queryClient.invalidateQueries(
          trpc.dbInstanceRoutes.getTableContent.queryOptions({
            dbName: databases?.data
              ? databases?.data[selectedDatabase]
              : "XXXXX",
            tableName:
              "public." +
              (tables?.data ? tables?.data[selectedTable]?.tableName : "XXXXX"),
            page: 1,
            limit: 20,
            projectId: project_id as string,
          })
        );
      },
      onError: (err) => {
        toast.error(err.message || "Failed to fetch sql query result", {
          duration: 3000,
          id: "table-query",
        });
      },
    })
  );
  const { data: databases, isPending: loadingDatabase } = useQuery(
    trpc.dbInstanceRoutes.getDatabasesInsideProject.queryOptions({
      projectId: project_id as string,
    })
  );

  const { data: tables, isPending: loadingTables } = useQuery(
    trpc.dbInstanceRoutes.getTablesOfADatabase.queryOptions({
      projectId: project_id as string,
      dbName: databases?.data ? databases?.data[selectedDatabase] : "XXXXX",
    })
  );

  const { data: tableContent, isPending: loadingTableContent } = useQuery(
    trpc.dbInstanceRoutes.getTableContent.queryOptions({
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

  useEffect(() => {
    if (tableContent?.data?.data)
      setTableContentToBeDisplayed(tableContent?.data?.data ?? []);
  }, [tableContent]);

  if (!databases?.data) {
    return "Loading databases";
  }

  return (
    <>
      <header className="flex items-center h-14 bg-sidebar border-b w-full p-4">
        <p className="font-semibold">{"Table Page"}</p>
      </header>
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
          {databases?.data?.map((db: string, indexNum) => {
            if (!tables?.data || tables?.data?.length <= 0)
              return (
                <p className="italic text-foreground-muted" key={indexNum}>
                  No tables found in this database
                </p>
              );
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
                    {/* <p
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
                  </p> */}

                    {loadingTableContent ? (
                      <p>Loading Content</p>
                    ) : tableContent?.data?.data &&
                      tableContent?.data?.data.length > 0 ? (
                      <TableContent
                        handleDeleteQuery={({ primaryKeyValues }) => {
                          if (
                            !databases.data ||
                            !tables.data ||
                            tables.data.length <= 0 ||
                            databases.data.length <= 0
                          ) {
                            toast.warning("Refresh the page please", {
                              id: "table-query",
                              duration: 3000,
                            });
                            return;
                          }

                          toast.loading("Deleting selected rows", {
                            id: "table-query",
                          });
                          deleteItemFromTable.mutateAsync({
                            tableName: tables.data[selectedTable].tableName,
                            primaryKey: tables.data[selectedTable].primaryKey,
                            primaryKeyValues,
                            dbName: databases.data[selectedDatabase],
                            projectId: project_id as string,
                          });
                        }}
                        handleSaveChanges={(val) => {
                          saveChanges.mutateAsync({
                            dbName: databases.data![selectedDatabase],
                            primaryKey: tables?.data![selectedTable].primaryKey,
                            tableName: tables?.data![selectedTable].tableName,
                            projectId: project_id as string,
                            sqlQueryObj: val,
                          });
                        }}
                        data={tableContentToBeDisplayed}
                        primaryKey={tables.data[selectedTable].primaryKey}
                        handleRunQuery={(val) => {
                          console.log("val", val);
                          toast.loading("Running SQL Query", {
                            id: "table-query",
                          });
                          runSqlQuery.mutateAsync({
                            dbName: databases.data![selectedDatabase],

                            tableName: tables?.data![selectedTable].tableName,
                            projectId: project_id as string,
                            sqlQueryObj: val,
                          });
                        }}
                      />
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
    </>
  );
};

export default TablePage;
