import React from 'react';
import {
  IconChevronLeft,
  IconChevronRight
} from '../icons/Icons';
import './PaginationBar.css';

/**
 * Reusable, high-performance PaginationBar with numbered buttons (1, 2, 3...)
 *
 * @param {number}   currentPage    - Current 1-based page index
 * @param {number}   totalPages     - Total number of pages
 * @param {number}   totalItems     - Total number of records matching filter
 * @param {number}   pageSize       - Records per page
 * @param {function} onPageChange   - Callback with new page number
 * @param {function} onPageSizeChange - Optional callback for changing page size
 * @param {Array}    pageSizeOptions - Array of options e.g. [5, 10, 20, 50]
 */
export default function PaginationBar({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
}) {
  if (totalItems <= 0 && totalPages <= 1) {
    return null;
  }

  const safePage = Math.max(1, Math.min(currentPage, Math.max(1, totalPages)));
  const startItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalItems);

  // Generate numbered pages with smart ellipsis (...)
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    // Always include first page
    pages.push(1);

    if (safePage > 3) {
      pages.push('ellipsis-start');
    }

    const start = Math.max(2, safePage - 1);
    const end = Math.min(totalPages - 1, safePage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (safePage < totalPages - 2) {
      pages.push('ellipsis-end');
    }

    // Always include last page
    pages.push(totalPages);
    return pages;
  };

  const pageItems = getPageNumbers();

  return (
    <div className="medistock-pagination-container">
      <div className="medistock-pagination-info">
        <span>
          Showing <strong>{startItem}</strong>–<strong>{endItem}</strong> of <strong>{totalItems}</strong> items
        </span>
        {onPageSizeChange && (
          <div className="medistock-pagination-size">
            <label htmlFor="pagination-page-size">Per page:</label>
            <select
              id="pagination-page-size"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="medistock-pagination-controls">
        {/* Previous Button */}
        <button
          type="button"
          className="medistock-page-nav-btn"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          aria-label="Previous Page"
        >
          <IconChevronLeft size={16} />
          <span className="btn-label-text">Prev</span>
        </button>

        {/* Numbered Page Buttons */}
        <div className="medistock-page-numbers-group">
          {pageItems.map((item, idx) => {
            if (typeof item === 'string') {
              return (
                <span key={`el-${idx}`} className="medistock-pagination-ellipsis">
                  •••
                </span>
              );
            }
            const isActive = item === safePage;
            return (
              <button
                key={item}
                type="button"
                className={`medistock-page-btn ${isActive ? 'active' : ''}`}
                onClick={() => onPageChange(item)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`Go to page ${item}`}
              >
                {item}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          className="medistock-page-nav-btn"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          aria-label="Next Page"
        >
          <span className="btn-label-text">Next</span>
          <IconChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

