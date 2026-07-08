"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";

export type MockDashboardRow = {
  id: string;
  name: string;
  email: string;
  category: string;
  value: string | number;
  status: string;
};

const MOCK_TABLE_DATA: MockDashboardRow[] = [
  { id: "1", name: "Team Alpha", email: "alpha@example.com", category: "Application", value: "98%", status: "Ready" },
  { id: "2", name: "Team Beta", email: "beta@example.com", category: "Application", value: "85%", status: "In progress" },
  { id: "3", name: "Team Gamma", email: "gamma@example.com", category: "Submission", value: "72%", status: "Pending" },
  { id: "4", name: "Team Delta", email: "delta@example.com", category: "Application", value: "100%", status: "Ready" },
  { id: "5", name: "Team Epsilon", email: "epsilon@example.com", category: "Submission", value: "45%", status: "In progress" },
];

export function DashboardDataTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [data] = useState(() => MOCK_TABLE_DATA);

  const columns = useMemo<ColumnDef<MockDashboardRow>[]>(
    () => [
      { accessorKey: "name", header: "Name", cell: (c) => c.getValue() },
      { accessorKey: "email", header: "Email", cell: (c) => c.getValue() },
      { accessorKey: "category", header: "Category", cell: (c) => c.getValue() },
      { accessorKey: "value", header: "Value", cell: (c) => c.getValue() },
      { accessorKey: "status", header: "Status", cell: (c) => c.getValue() },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <table className="w-full min-w-[600px] border-collapse text-left text-sm">
      <thead>
        {table.getHeaderGroups().map((hg) => (
          <tr key={hg.id}>
            {hg.headers.map((h) => (
              <th
                key={h.id}
                className="border-b border-[var(--border-color)] px-4 py-3 font-medium uppercase tracking-wider text-[var(--text-muted)]"
              >
                {flexRender(h.column.columnDef.header, h.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr
            key={row.id}
            className="border-b border-[var(--border-color)]/60 transition-colors hover:bg-[var(--bg-secondary)]/50"
          >
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} className="px-4 py-3 text-white">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
