import React from "react";

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  loading?: boolean;
  emptyText?: string;
  className?: string;
}

export default function DataTable<T extends { [key: string]: any }>({
  columns,
  data,
  page = 1,
  pageSize = 20,
  total = 0,
  onPageChange,
  loading = false,
  emptyText = "Aucune donnée à afficher",
  className = "",
}: DataTableProps<T>) {
  const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 1;

  return (
    <div
      className={`bg-background-card rounded-xl shadow overflow-hidden border border-border ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key as string}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider ${
                    col.className || ""
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-background-card divide-y divide-border">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-8 text-gray-400"
                >
                  Chargement...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-8 text-gray-400"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={i} className="hover:bg-muted">
                  {columns.map((col) => (
                    <td
                      key={col.key as string}
                      className={`px-6 py-4 whitespace-nowrap text-sm ${
                        col.className || "text-white"
                      }`}
                    >
                      {col.render ? col.render(row) : row[col.key as keyof T]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div className="px-6 py-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Page {page} sur {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted text-gray-400 hover:text-white"
              >
                Prev
              </button>
              <button
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted text-gray-400 hover:text-white"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
