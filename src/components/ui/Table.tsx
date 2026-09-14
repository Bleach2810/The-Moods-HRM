import React from "react";

interface Column<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  emptyMessage = "Không có dữ liệu",
  className = "",
}: TableProps<T>) {
  return (
    <div className={`overflow-x-auto w-full rounded-2xl border border-gray-150 bg-white ${className}`}>
      <table className="min-w-full divide-y divide-gray-100 text-left border-collapse">
        <thead className="bg-[#FAF9F6] border-b border-gray-150">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`px-4 py-3.5 text-[10px] font-black uppercase tracking-wider text-[#7c4831] ${col.className || ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-xs font-semibold text-[#4B3621]">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-gray-400 italic"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, rowIdx) => (
              <tr
                key={rowIdx}
                className="hover:bg-[#FAF9F6]/50 transition-colors duration-100"
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={colIdx}
                    className={`px-4 py-3.5 whitespace-nowrap align-middle ${col.className || ""}`}
                  >
                    {col.accessor(item)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
