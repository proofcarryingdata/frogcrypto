import { type FrogCryptoFrogData } from "@pcd/passport-interface";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  RowSelectionState,
  useReactTable,
} from "@tanstack/react-table";
import React, {
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

// Define a column helper for FrogCryptoFrogData
const columnHelper = createColumnHelper<FrogCryptoFrogData>();

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
  // UUID Column
  columnHelper.accessor("uuid", {
    header: "UUID",
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
  // Biome Column
  columnHelper.accessor("biome", {
    header: "Biome",
    cell: (info) => info.getValue(),
  }),
  // Rarity Column
  columnHelper.accessor("rarity", {
    header: "Rarity",
    cell: (info) => info.getValue(),
  }),
  // Temperament Column
  columnHelper.accessor("temperament", {
    header: "Temperament",
    cell: (info) => info.getValue(),
  }),
  // Drop Weight Column
  columnHelper.accessor("drop_weight", {
    header: "Drop Weight",
    cell: (info) => info.getValue(),
  }),
  // Jump Min Column
  columnHelper.accessor("jump_min", {
    header: "Jump Min",
    cell: (info) => info.getValue(),
  }),
  // Jump Max Column
  columnHelper.accessor("jump_max", {
    header: "Jump Max",
    cell: (info) => info.getValue(),
  }),
  // Speed Min Column
  columnHelper.accessor("speed_min", {
    header: "Speed Min",
    cell: (info) => info.getValue(),
  }),
  // Speed Max Column
  columnHelper.accessor("speed_max", {
    header: "Speed Max",
    cell: (info) => info.getValue(),
  }),
  // Intelligence Min Column
  columnHelper.accessor("intelligence_min", {
    header: "Intelligence Min",
    cell: (info) => info.getValue(),
  }),
  // Intelligence Max Column
  columnHelper.accessor("intelligence_max", {
    header: "Intelligence Max",
    cell: (info) => info.getValue(),
  }),
  // Beauty Min Column
  columnHelper.accessor("beauty_min", {
    header: "Beauty Min",
    cell: (info) => info.getValue(),
  }),
  // Beauty Max Column
  columnHelper.accessor("beauty_max", {
    header: "Beauty Max",
    cell: (info) => info.getValue(),
  }),
];

function FrogTable({
  data,
  checkedIds,
  setCheckedIds,
}: {
  data: FrogCryptoFrogData[];
  checkedIds?: number[];
  setCheckedIds?: Dispatch<SetStateAction<number[]>>;
}): JSX.Element {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  useEffect(() => {
    if (setCheckedIds) {
      const selectedIds = Object.keys(rowSelection)
        .filter((id) => rowSelection[id])
        .map(Number);
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

export default FrogTable;
