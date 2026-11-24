import { useState, useMemo } from 'react';
import { IconSearch, IconFilter, IconChevronLeft, IconChevronRight } from '../icons/Icons';
import './DataTable.css';

/**
 * Reusable data table with built-in search, filter dropdown and pagination.
 *
 * @param {Array}  columns     – [{ key, label, render? }]
 * @param {Array}  data        – array of row objects
 * @param {number} pageSize    – rows per page (default 8)
 * @param {string} filterKey   – column key to use for the dropdown filter
 * @param {string} filterLabel – label for the filter dropdown
 * @param {string} searchPlaceholder
 * @param {boolean} loading
 * @param {React.ReactNode} emptyState – element to show when data is empty
 */
export default function DataTable({
  columns,
  data = [],
  pageSize = 8,
  filterKey,
  filterLabel = 'Filter',
  searchPlaceholder = 'Search…',
  loading = false,
  emptyState,
}) {
  const [search, setSearch] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [page, setPage] = useState(1);

  // Unique filter options
  const filterOptions = useMemo(() => {
    if (!filterKey) return [];
    const set = new Set(data.map((r) => r[filterKey]).filter(Boolean));
    return Array.from(set).sort();
  }, [data, filterKey]);

  // Filtered + searched data
  const filtered = useMemo(() => {
    let result = data;
    if (filterKey && filterValue) {
      result = result.filter((r) => r[filterKey] === filterValue);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((row) =>
        columns.some(({ key }) => {
          const val = row[key];
          return val != null && String(val).toLowerCase().includes(q);
        })
      );
    }
    return result;
  }, [data, columns, search, filterValue, filterKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageData = filtered.slice(start, start + pageSize);

  // Reset page when filters change
  const handleSearch = (v) => { setSearch(v); setPage(1); };
  const handleFilter = (v) => { setFilterValue(v); setPage(1); };

  /* Skeleton rows */
  if (loading) {
    return (
      <div className="data-table-wrapper">
        <div className="data-table__toolbar">
          <div className="skeleton" style={{ width: 220, height: 36 }} />
        </div>
        <div className="data-table__scroll">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.key}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((c) => (
                    <td key={c.key}>
                      <div className="skeleton" style={{ width: '80%', height: 16 }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  /* Empty state */
  if (!data.length && emptyState) {
    return <div className="data-table-wrapper">{emptyState}</div>;
  }

  return (
    <div className="data-table-wrapper fade-in">
      {/* Toolbar */}
      <div className="data-table__toolbar">
        <div className="data-table__search">
          <IconSearch size={15} className="data-table__search-icon" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label="Search table"
          />
        </div>

        {filterKey && filterOptions.length > 0 && (
          <div className="data-table__filter">
            <IconFilter size={14} />
            <select
              value={filterValue}
              onChange={(e) => handleFilter(e.target.value)}
              aria-label={filterLabel}
            >
              <option value="">All {filterLabel}</option>
              {filterOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        )}

        <span className="data-table__count">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="data-table__scroll">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="data-table__empty-row">
                  No results match your search.
                </td>
              </tr>
            ) : (
              pageData.map((row, i) => (
                <tr key={row.id ?? row.medicineId ?? i}>
                  {columns.map((c) => (
                    <td key={c.key}>
                      {c.render ? c.render(row[c.key], row) : row[c.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="data-table__pagination">
          <span className="data-table__page-info">
            Page {safePage} of {totalPages}
          </span>
          <div className="data-table__page-btns">
            <button
              disabled={safePage <= 1}
              onClick={() => setPage(safePage - 1)}
              aria-label="Previous page"
            >
              <IconChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === '...' ? (
                  <span key={`e${idx}`} className="data-table__ellipsis">…</span>
                ) : (
                  <button
                    key={p}
                    className={safePage === p ? 'data-table__page-btn--active' : ''}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              disabled={safePage >= totalPages}
              onClick={() => setPage(safePage + 1)}
              aria-label="Next page"
            >
              <IconChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
