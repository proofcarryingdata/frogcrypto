import { type ServerFeed } from "@frogcrypto/shared";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type RowSelectionState,
} from "@tanstack/react-table";
import prettyMilliseconds from "pretty-ms";
import React, {
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

// Define a column helper for ServerFeed
const columnHelper = createColumnHelper<ServerFeed>();

const columns = [
  // Selection Column
  columnHelper.display({
    id: "selection",
    header: ({ table }) => (
      <input
        type="checkbox"
        {...{
          checked: table.getIsAllRowsSelected(),
          indeterminate: table.getIsSomeRowsSelected(),
          onChange: table.getToggleAllRowsSelectedHandler(),
        }}
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        {...{
          checked: row.getIsSelected(),
          indeterminate: row.getIsSomeSelected(),
          onChange: row.getToggleSelectedHandler(),
        }}
      />
    ),
  }),
  // ID Column
  columnHelper.accessor("id", {
    header: "ID",
    cell: (info) => info.getValue(),
  }),
  // Name Column
  columnHelper.accessor("name", {
    header: "Name",
    cell: (info) => info.getValue(),
  }),
  // Description Column with Custom Cell
  columnHelper.accessor("description", {
    header: "Description",
    cell: (info) => (
      <span className="line-clamp-3" title={info.getValue<string>()}>
        {info.getValue<string>()}
      </span>
    ),
  }),
  // Private Column
  columnHelper.accessor("private", {
    header: "Private",
    cell: (info) => (info.getValue() ? "Yes" : "No"),
  }),
  // Active Until Column
  columnHelper.accessor("activeUntil", {
    header: "Active Until (unix)",
    cell: (info) => {
      const activeUntil = info.getValue();
      if (!activeUntil) {
        return "<undefined>";
      }
      const duration = activeUntil * 1000 - Date.now();

      return (
        <div>
          <p>
            <b>Raw: </b>
            {activeUntil}
          </p>
          <p>
            <b>Date: </b>
            {new Date(activeUntil * 1000).toISOString()}
          </p>
          {duration > 0 ? (
            <p>
              <b>Active for: </b>
              {prettyMilliseconds(duration, {
                compact: true,
              })}
            </p>
          ) : (
            <p>
              <b>Expired: </b>
              {prettyMilliseconds(-duration, {
                compact: true,
              })}{" "}
              ago
            </p>
          )}
        </div>
      );
    },
  }),
  // Cooldown Column
  columnHelper.accessor("cooldown", {
    header: "Cooldown (s)",
    cell: (info) => info.getValue(),
  }),
  // Biomes Column
  columnHelper.accessor("biomes", {
    header: "Biomes",
    cell: (info) => {
      const biomes = info.getValue();

      if (!biomes) {
        return "<undefined>";
      }
      return (
        <div>
          {Object.keys(biomes).map((biome) => (
            <p key={biome}>
              {biome}: {JSON.stringify(biomes[biome])}
            </p>
          ))}
        </div>
      );
    },
  }),
];

function FeedTable({
  data,
  checkedIds,
  setCheckedIds,
}: {
  data: ServerFeed[];
  checkedIds?: string[];
  setCheckedIds?: Dispatch<SetStateAction<string[]>>;
}): JSX.Element {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  useEffect(() => {
    if (setCheckedIds) {
      const selectedIds = Object.keys(rowSelection).filter(
        (id) => rowSelection[id]
      );
      setCheckedIds(selectedIds);
    }
  }, [rowSelection, setCheckedIds]);

  const table = useReactTable({
    data,
    columns,
    state: {
      rowSelection: checkedIds
        ? data.reduce<Record<string, boolean>>((acc, row) => {
            if (checkedIds.includes(row.id)) acc[row.id] = true;
            return acc;
          }, {})
        : {},
    },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => String(row.id),
  });

  return (
    <table className="min-w-full divide-y divide-gray-200 mt-4 overflow-x-auto block">
      <thead className="bg-gray-50">
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th
                key={header.id}
                colSpan={header.colSpan}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {!header.isPlaceholder &&
                  flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                {header.column.getCanSort() && (
                  <span>
                    {header.column.getIsSorted()
                      ? header.column.getIsSorted() === "desc"
                        ? " 🔽"
                        : " 🔼"
                      : ""}
                  </span>
                )}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td
                key={cell.id}
                className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default FeedTable;
