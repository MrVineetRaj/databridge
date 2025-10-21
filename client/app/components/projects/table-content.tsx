import React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

export const TableContent = ({
  data,
}: {
  data: {
    [key: string]: string;
  }[];
}) => {
  return (
    <Table
      className=""
      style={{
        scrollbarWidth: "none",
      }}
    >
      <TableHeader>
        <TableRow>
          {Object.keys(data[0])?.map((head) => (
            <TableHead className="min-w-[250px]">{head}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody className="">
        {data?.map((it) => (
          <TableRow>
            {Object.values(it)?.map((val) => (
              <TableCell className="border">{val}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
