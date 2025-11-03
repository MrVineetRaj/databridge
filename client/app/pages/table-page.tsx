import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Database,
  TableIcon,
  Download,
  Upload,
  RefreshCw,
  Loader2,
} from "lucide-react";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "react-router";
import { toast } from "sonner";
import { TableContent } from "~/components/projects/table-content";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { useTRPC } from "~/lib/trpc.config";
import type { Route } from "./+types/table-page";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Database Tables | DataBridge" },
    { name: "description", content: "Manage your database project" },
  ];
}

const TablePage = () => {
  const { project_id } = useParams();
  const trpc = useTRPC();

  const queryClient = useQueryClient();
  const [selectedDatabase, setSelectedDatabase] = useState<number>(0);
  const [selectedTable, setSelectedTable] = useState<number>(0);
  const [tableContentToBeDisplayed, setTableContentToBeDisplayed] = useState<
    { [key: string]: string }[]
  >([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Optimized queries with better caching
  const { data: databases, isPending: loadingDatabase } = useQuery(
    trpc.dbInstanceRoutes.getDatabasesInsideProject.queryOptions({
      projectId: project_id as string,
    })
  );

  // Memoized current database and table names for better performance
  const currentDbName = useMemo(
    () => databases?.data?.[selectedDatabase] || "",
    [databases?.data, selectedDatabase]
  );

  const { data: tables, isPending: loadingTables } = useQuery({
    ...trpc.dbInstanceRoutes.getTablesOfADatabase.queryOptions({
      projectId: project_id as string,
      dbName: currentDbName,
    }),
    enabled: !!currentDbName && currentDbName !== "",
  });

  const currentTableInfo = useMemo(
    () => tables?.data?.[selectedTable] || null,
    [tables?.data, selectedTable]
  );

  const currentTableName = useMemo(
    () => (currentTableInfo ? `public.${currentTableInfo.tableName}` : ""),
    [currentTableInfo]
  );

  const { data: tableContent, isPending: loadingTableContent } = useQuery({
    ...trpc.dbInstanceRoutes.getTableContent.queryOptions({
      dbName: currentDbName,
      tableName: currentTableName,
      page: 1,
      limit: 20,
      projectId: project_id as string,
    }),
    enabled: !!currentTableName && currentTableName !== "",
  });

  // Optimized mutations with better error handling
  const deleteItemFromTable = useMutation(
    trpc.dbInstanceRoutes.deleteItemFromDatabase.mutationOptions({
      onSuccess: (res) => {
        toast.success(res.message, {
          id: "table-query",
          duration: 3000,
        });
        queryClient.invalidateQueries({
          queryKey: ["getTableContent"],
        });
      },
      onError: (err) => {
        toast.error(err.message, {
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
        toast.error(err.message || "Failed to execute SQL query", {
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
        queryClient.invalidateQueries({
          queryKey: ["getTableContent"],
        });
      },
      onError: (err) => {
        toast.error(err.message || "Failed to save changes", {
          duration: 3000,
          id: "table-query",
        });
      },
    })
  );

  // Optimized callbacks
  const handleDatabaseChange = useCallback((idx: number) => {
    setSelectedDatabase(idx);
    setSelectedTable(0);
    setTableContentToBeDisplayed([]);
  }, []);

  const handleTableChange = useCallback((idx: number) => {
    setSelectedTable(idx);
    setTableContentToBeDisplayed([]);
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    queryClient.invalidateQueries();
    setTimeout(() => setIsRefreshing(false), 1000);
  }, [queryClient]);

  // Effects
  useEffect(() => {
    if (tableContent?.data?.data) {
      setTableContentToBeDisplayed(tableContent.data.data);
    }
  }, [tableContent]);

  // Loading state
  if (loadingDatabase) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent to-secondary">
        <header className="sticky top-0 z-10 flex items-center justify-between h-16 bg-card/80 backdrop-blur-sm border-b border-border/50 px-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="w-32 h-6" />
          </div>
        </header>
        <div className="p-6 space-y-6">
          <Skeleton className="w-full h-20" />
          <Skeleton className="w-full h-96" />
        </div>
      </div>
    );
  }

  if (!databases?.data || databases.data.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent to-secondary">
        <header className="sticky top-0 z-10 flex items-center justify-between h-16 bg-card/80 backdrop-blur-sm border-b border-border/50 px-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Database className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-semibold text-foreground">
              Database Tables
            </h1>
          </div>
        </header>
        <div className="p-6">
          <Card>
            <CardContent className="pt-16 pb-16 text-center">
              <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No Databases Found
              </h3>
              <p className="text-muted-foreground">
                No databases are available in this project yet.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent to-secondary">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between h-16 bg-card/80 backdrop-blur-sm border-b border-border/50 px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <TableIcon className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              Database Tables
            </h1>
            <p className="text-xs text-muted-foreground">
              {currentDbName} •{" "}
              {currentTableInfo?.tableName || "Select a table"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Database Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Database Selection
            </CardTitle>
            <CardDescription>
              Select a database and table to manage your data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Available Databases
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {databases.data.map((db: string, idx) => (
                  <Card
                    key={idx}
                    className={`cursor-pointer transition-all h-18 flex items-center p-0 justify-center ${
                      selectedDatabase === idx
                        ? "border-primary bg-primary/5"
                        : "hover:bg-accent/50"
                    }`}
                    onClick={() => handleDatabaseChange(idx)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-primary" />
                        <span className="font-medium">{db}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Tables Selection */}
            {currentDbName && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Available Tables</Label>

                {loadingTables ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading tables...
                  </div>
                ) : !tables?.data || tables.data.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="pt-8 pb-8 text-center">
                      <TableIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">
                        No tables found in this database
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tables.data.map(
                      (
                        table: { tableName: string; primaryKey: string },
                        idx
                      ) => (
                        <Card
                          key={table.tableName}
                          className={`cursor-pointer transition-all  ${
                            selectedTable === idx
                              ? "border-primary bg-primary/5"
                              : "hover:bg-accent/50"
                          }`}
                          onClick={() => handleTableChange(idx)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <TableIcon className="w-4 h-4 text-primary" />
                                <span className="font-medium">
                                  {table.tableName}
                                </span>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                PK: {table.primaryKey}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Table Content */}
        {currentTableInfo && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TableIcon className="w-5 h-5" />
                    {currentTableInfo.tableName}
                  </CardTitle>
                  <CardDescription>
                    Primary Key: {currentTableInfo.primaryKey} •{" "}
                    {tableContentToBeDisplayed.length} rows
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingTableContent ? (
                <div className="flex items-center justify-center gap-2 text-muted-foreground py-8">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading table content...
                </div>
              ) : tableContentToBeDisplayed.length > 0 ? (
                <TableContent
                  handleDeleteQuery={({ primaryKeyValues }) => {
                    if (
                      !databases.data ||
                      !tables?.data ||
                      tables.data.length <= 0 ||
                      databases.data.length <= 0
                    ) {
                      toast.warning("Please refresh the page", {
                        id: "table-query",
                        duration: 3000,
                      });
                      return;
                    }

                    toast.loading("Deleting selected rows", {
                      id: "table-query",
                    });
                    deleteItemFromTable.mutateAsync({
                      tableName: tables?.data[selectedTable].tableName!,
                      primaryKey: tables?.data[selectedTable].primaryKey!,
                      primaryKeyValues,
                      dbName: databases.data[selectedDatabase],
                      projectId: project_id as string,
                    });
                  }}
                  handleSaveChanges={(val) => {
                    toast.loading("Saving changes", {
                      id: "table-query",
                    });
                    saveChanges.mutateAsync({
                      dbName: databases.data![selectedDatabase],
                      primaryKey: tables?.data![selectedTable].primaryKey!,
                      tableName: tables?.data![selectedTable].tableName!,
                      projectId: project_id as string,
                      sqlQueryObj: val,
                    });
                  }}
                  data={tableContentToBeDisplayed}
                  primaryKey={
                    tables?.data
                      ? tables?.data[selectedTable]?.primaryKey
                      : "id"
                  }
                  handleRunQuery={(val) => {
                    toast.loading("Running SQL Query", {
                      id: "table-query",
                    });
                    runSqlQuery.mutateAsync({
                      dbName: databases.data![selectedDatabase],
                      tableName: tables?.data![selectedTable].tableName!,
                      projectId: project_id as string,
                      sqlQueryObj: val,
                    });
                  }}
                />
              ) : (
                <div className="text-center py-16">
                  <TableIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No Data Found
                  </h3>
                  <p className="text-muted-foreground">
                    This table doesn't contain any data yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TablePage;
