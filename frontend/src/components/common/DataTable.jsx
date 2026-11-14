import React from 'react';
import { Search, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';

export const DataTable = ({
  columns = [],
  data = [],
  isLoading = false,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  filterSlot,
  actionSlot,
  pagination,
  onPageChange,
  emptyMessage = 'No matching records found',
  emptyTitle = 'No data available',
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Controls Bar */}
      {(onSearchChange || filterSlot || actionSlot) && (
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/40">
          <div className="flex flex-1 items-center gap-3">
            {onSearchChange && (
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-700 placeholder:text-slate-400"
                />
              </div>
            )}
            {filterSlot}
          </div>
          {actionSlot && <div className="flex items-center gap-2 shrink-0">{actionSlot}</div>}
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50/75 border-b border-slate-100 text-xs uppercase font-semibold text-slate-400 tracking-wider">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={`px-5 py-3.5 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-normal">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center">
                  <LoadingSpinner label="Fetching data from database..." />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
                      <Inbox className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-slate-700">{emptyTitle}</p>
                    <p className="text-xs text-slate-400 max-w-xs mt-0.5">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr key={row.id || rowIdx} className="hover:bg-slate-50/80 transition-colors">
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`px-5 py-4 ${col.className || ''}`}>
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && (
        <div className="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50/30">
          <div>
            Showing{' '}
            <span className="font-semibold text-slate-700">
              {pagination.totalElements === 0 ? 0 : pagination.page * pagination.size + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-700">
              {Math.min((pagination.page + 1) * pagination.size, pagination.totalElements)}
            </span>{' '}
            of <span className="font-semibold text-slate-700">{pagination.totalElements}</span> entries
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 0}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <span className="px-3 py-1.5 text-slate-600 font-medium">
              Page {pagination.page + 1} of {Math.max(1, pagination.totalPages)}
            </span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page + 1 >= pagination.totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium transition-colors cursor-pointer"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
