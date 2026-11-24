/**
 * MediStock CSV Export Utility
 * Generates and downloads clean, RFC-4180 compliant CSV files with automated timestamps.
 * Flexible signature support:
 *   - exportToCsv(filename, rows, columns)
 *   - exportToCsv(rows, filename)
 *   - exportToCsv(filename, rows)
 */
export function exportToCsv(arg1, arg2, arg3) {
  let filename = 'export';
  let rows = [];
  let columns = null;

  if (Array.isArray(arg1)) {
    rows = arg1;
    filename = typeof arg2 === 'string' ? arg2 : 'export';
    columns = Array.isArray(arg3) ? arg3 : null;
  } else {
    filename = typeof arg1 === 'string' ? arg1 : 'export';
    rows = Array.isArray(arg2) ? arg2 : [];
    columns = Array.isArray(arg3) ? arg3 : null;
  }

  if (!rows || rows.length === 0) {
    alert('No data available to export.');
    return;
  }

  // Auto infer columns if not provided
  if (!columns || columns.length === 0) {
    const firstRow = rows[0];
    if (typeof firstRow === 'object' && firstRow !== null) {
      columns = Object.keys(firstRow).map(k => ({ key: k, label: k.charAt(0).toUpperCase() + k.slice(1) }));
    } else {
      columns = [{ key: 'value', label: 'Value' }];
    }
  }

  const colKeys = columns.map(c => (typeof c === 'string' ? c : c.key));
  const colLabels = columns.map(c => (typeof c === 'string' ? c : (c.label || c.key)));

  const headerLine = colLabels.map(l => `"${String(l ?? '').replace(/"/g, '""')}"`).join(',');
  const rowLines = rows.map(row => {
    return colKeys.map(k => {
      const val = row && row[k] !== undefined && row[k] !== null ? String(row[k]) : '';
      return `"${val.replace(/"/g, '""')}"`;
    }).join(',');
  });

  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n'); // UTF-8 BOM
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const cleanFilename = filename.endsWith('.csv') ? filename.replace(/\.csv$/, '') : filename;
  link.setAttribute('download', `${cleanFilename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
