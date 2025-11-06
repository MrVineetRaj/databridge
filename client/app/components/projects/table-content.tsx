import {
  DeleteIcon,
  PlayIcon,
  SquareIcon,
  TrashIcon,
  Triangle,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { cn, isISODateString } from "~/lib/utils";
import { Input } from "../ui/input";
import { toast } from "sonner";
import { useTRPC } from "~/lib/trpc.config";
import { useMutation } from "@tanstack/react-query";

export const TableContent = ({
  data,
  primaryKey,
  handleDeleteQuery,
  handleSaveChanges,
  handleRunQuery,
}: {
  data: {
    [key: string]: string;
  }[];
  primaryKey: string;
  handleDeleteQuery: ({
    primaryKeyValues,
  }: {
    primaryKeyValues: string[];
  }) => void;
  handleSaveChanges: (objectToBeUpdated: {
    [primaryKey: string]: {
      [fieldName: string]: string;
    };
  }) => void;
  handleRunQuery: (
    finalQuery: {
      field: string;
      operator: string;
      value: string;
      queryConnector: string;
    }[]
  ) => void;
}) => {
  const [isDisabled, setIsDisabled] = useState<boolean>(true);
  useEffect(() => {
    console.log(data);
  }, [data]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [sqlSearchQuery, setSqlSearchQuery] = useState<
    {
      field: string;
      operator: string;
      value: string;
      queryConnector: string;
    }[]
  >([]);
  const [tableItems, setTableItems] = useState<
    {
      [key: string]: string;
    }[]
  >([]);
  const trpc = useTRPC();
  const [cols, setCols] = useState<string[]>(Object.keys(data[0] ?? {}) ?? []);

  useEffect(() => {
    console.log("data", data);
    if (!data || data.length == 0) return;
    setCols(Object.keys(data[0]));
    setTableItems(data);
  }, [data]);

  const onClickHandler = () => {
    if (selectedItems.length <= 0) return;
    handleDeleteQuery({ primaryKeyValues: selectedItems });
  };

  const onSaveChangesHAndler = () => {
    if (JSON.stringify(data) == JSON.stringify(tableItems)) return;
    const n = data.length;
    let objectToBeUpdated: {
      [primaryKey: string]: {
        [fieldName: string]: string;
      };
    } = {};
    for (let i = 0; i < n; i++) {
      if (JSON.stringify(data[i]) != JSON.stringify(tableItems[i])) {
        const fieldToBeUpdated: {
          [fieldName: string]: string;
        } = {};

        const colSize = cols.length;

        for (let j = 0; j < colSize; j++) {
          if (Object.values(data[i])[j] != Object.values(tableItems[i])[j]) {
            const fieldName = Object.keys(tableItems[i])[j];
            fieldToBeUpdated[fieldName] = isISODateString(
              tableItems[i][fieldName]
            )
              ? `${new Date(tableItems[i][fieldName]).getTime()}`
              : tableItems[i][fieldName];
          }
        }
        objectToBeUpdated[tableItems[i][primaryKey]] = fieldToBeUpdated;
      }
    }

    handleSaveChanges(objectToBeUpdated);
  };

  const onRunQuery = () => {
    const finalQuery = sqlSearchQuery.map((query) => {
      return {
        field: query.field.trim(),
        operator: query.operator.trim(),
        queryConnector: query.queryConnector.trim(),
        value: query.value.trim(),
      };
    });

    finalQuery[finalQuery.length - 1].queryConnector = "";

    if (finalQuery.some((query) => query.operator == "" || query.value == "")) {
      toast.error("Invalid query", {
        duration: 3000,
        id: "query-status-toast",
      });
      return;
    }

    handleRunQuery(finalQuery);
    // console.log(finalQuery);
  };

  // Add early return if no data
  if (!data || data.length === 0) {
    return <div>No data available</div>;
  }

  return (
    <>
      <span className="space-y-2">
        <span>
          <Label>Filter</Label>
          <span className="flex flex-col gap-2 items-start">
            {sqlSearchQuery.map((query, idx) => {
              return (
                <span className="flex gap-2 overflow-x-auto w-full" key={idx}>
                  <Select
                    value={query?.field}
                    onValueChange={(value) => {
                      setSqlSearchQuery((prevQueries) =>
                        prevQueries?.map((query, queryIdx) => {
                          if (queryIdx === idx) {
                            return {
                              ...query,
                              field: value,
                            };
                          }
                          return query;
                        })
                      );
                    }}
                  >
                    <SelectTrigger className="w-[180px]" value={query?.field}>
                      <SelectValue placeholder={query?.field} />
                    </SelectTrigger>
                    <SelectContent>
                      {cols?.map((col, index) => (
                        <SelectItem value={col} key={index}>
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={query?.operator}
                    onValueChange={(value) => {
                      setSqlSearchQuery((prevQueries) =>
                        prevQueries?.map((query, queryIdx) => {
                          if (queryIdx === idx) {
                            return {
                              ...query,
                              operator: value,
                            };
                          }
                          return query;
                        })
                      );
                    }}
                  >
                    <SelectTrigger className="" defaultValue={"="}>
                      <SelectValue placeholder="=" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={"="}>{"="}</SelectItem>
                      <SelectItem value={"!="}>{"!="}</SelectItem>
                      <SelectItem value={"<"}>{"<"}</SelectItem>
                      <SelectItem value={"<="}>{"<="}</SelectItem>
                      <SelectItem value={">"}>{">"}</SelectItem>
                      <SelectItem value={">="}>{">="}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="some value"
                    className="min-w-72"
                    value={query?.value}
                    onChange={(e) => {
                      setSqlSearchQuery((prevQueries) =>
                        prevQueries?.map((query, queryIdx) => {
                          if (queryIdx === idx) {
                            return {
                              ...query,
                              value: e.target.value,
                            };
                          }
                          return query;
                        })
                      );
                    }}
                  />
                  <Select
                    value={query?.queryConnector}
                    onValueChange={(value) => {
                      setSqlSearchQuery((prevQueries) =>
                        prevQueries?.map((query, queryIdx) => {
                          if (queryIdx === idx) {
                            return {
                              ...query,
                              queryConnector: value,
                            };
                          }
                          return query;
                        })
                      );
                    }}
                  >
                    <SelectTrigger className="">
                      <SelectValue placeholder="NA" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={"OR"}>{"OR"}</SelectItem>
                      <SelectItem value={"AND"}>{"AND"}</SelectItem>
                      <SelectItem value={"NA"}>{"NA"}</SelectItem>
                    </SelectContent>
                  </Select>
                </span>
              );
            })}
            {(sqlSearchQuery.length == 0 ||
              (sqlSearchQuery[sqlSearchQuery.length - 1]?.queryConnector !=
                "" &&
                sqlSearchQuery[sqlSearchQuery.length - 1]?.queryConnector !=
                  "NA")) && (
              <Select
                onValueChange={(value) => {
                  setSqlSearchQuery((prev) => [
                    ...prev,
                    {
                      field: value,
                      operator: "=",
                      value: "",
                      queryConnector: "",
                    },
                  ]);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Field" />
                </SelectTrigger>
                <SelectContent>
                  {cols?.map((col) => (
                    <SelectItem value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {sqlSearchQuery.length > 0 && (
              <Button
                onClick={() => {
                  onRunQuery();
                }}
              >
                <PlayIcon /> Run Query
              </Button>
            )}
          </span>
        </span>
        <span className="flex mt-4 gap-2">
          {selectedItems.length > 0 && (
            <Button
              variant={"destructive"}
              disabled={selectedItems.length <= 0}
              className={cn(
                selectedItems.length <= 0 && "cursor-not-allowed opacity-50"
              )}
              onClick={() => {
                onClickHandler();
              }}
            >
              <TrashIcon />
            </Button>
          )}
          {JSON.stringify(data) != JSON.stringify(tableItems) && (
            <>
              <Button
                variant={"default"}
                disabled={JSON.stringify(data) == JSON.stringify(tableItems)}
                className={cn(
                  JSON.stringify(data) == JSON.stringify(tableItems) &&
                    "cursor-not-allowed opacity-50"
                )}
                onClick={() => {
                  onSaveChangesHAndler();
                }}
              >
                Save Changes
              </Button>
              <Button
                // variant={""}
                disabled={JSON.stringify(data) == JSON.stringify(tableItems)}
                className={cn(
                  "!bg-yellow-500",
                  JSON.stringify(data) == JSON.stringify(tableItems) &&
                    "cursor-not-allowed opacity-50"
                )}
                onClick={() => {
                  setTableItems(data);
                }}
              >
                Reset Changes
              </Button>
            </>
          )}
        </span>
      </span>
      <Table
        className="mt-4"
        style={{
          scrollbarWidth: "none",
        }}
      >
        <TableHeader className="bg-sidebar">
          <TableRow>
            <TableHead className="border">
              {/* <SquareIcon className="size-4" /> */}
            </TableHead>
            {Object.keys(data[0])?.map((head) => (
              <TableHead className="min-w-[250px] border">{head}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="">
          {tableItems?.map((it, itemIdx) => (
            <TableRow key={it[primaryKey]}>
              <TableCell
                className=" border bg-sidebar"
                onClick={() => {
                  if (selectedItems.includes(it[primaryKey])) {
                    setSelectedItems((prev) =>
                      prev.filter((row) => row != it[primaryKey])
                    );
                  } else {
                    setSelectedItems((prev) => [...prev, it[primaryKey]]);
                  }
                }}
              >
                <SquareIcon
                  className={cn(
                    "size-4 ",
                    selectedItems.includes(it[primaryKey]) && "bg-primary"
                  )}
                />
              </TableCell>
              {Object.values(it)?.map((val, idx) => (
                <TableCell
                  className={cn(
                    "border",
                    cols[idx] == primaryKey && "bg-sidebar"
                  )}
                  key={idx}
                >
                  {cols[idx] == primaryKey ? (
                    val
                  ) : (
                    <Input
                      value={val ?? ""}
                      onChange={(e) => {
                        setTableItems((prevItems) =>
                          prevItems.map((item, index) =>
                            index === itemIdx
                              ? { ...item, [cols[idx]]: e.target.value }
                              : item
                          )
                        );
                      }}
                    />
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
};
