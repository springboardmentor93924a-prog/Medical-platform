import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Pill, 
  AlertTriangle, 
  ShoppingCart, 
  ArrowLeftRight, 
  FileSpreadsheet,
  CheckCircle,
  ShieldCheck
} from 'lucide-react';
import Button from '../../components/common/Button';
import { reportService } from '../../services/reportService';
import { useNotification } from '../../context/NotificationContext';

const ReportsPage = () => {
  const { showToast } = useNotification();
  const [downloading, setDownloading] = useState({});

  const handleDownload = async (type, format) => {
    const key = `${type}_${format}`;
    try {
      setDownloading((prev) => ({ ...prev, [key]: true }));
      showToast('info', `Generating ${format.toUpperCase()} report for ${type}...`);

      if (type === 'inventory') {
        if (format === 'pdf') await reportService.exportInventoryPdf();
        else if (format === 'csv') await reportService.exportInventoryCsv();
        else await reportService.exportInventoryExcel();
      } else if (type === 'expiry') {
        if (format === 'pdf') await reportService.exportExpiryPdf();
        else await reportService.exportExpiryExcel();
      } else if (type === 'orders') {
        await reportService.exportPurchaseOrdersExcel();
      } else if (type === 'movements') {
        await reportService.exportMovementsCsv();
      }

      showToast('success', `${format.toUpperCase()} report successfully downloaded`);
    } catch (err) {
      console.error('Report export failure', err);
      showToast('error', 'Failed to generate report');
    } finally {
      setDownloading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const reportModules = [
    {
      id: 'inventory',
      title: 'Complete Inventory Valuation',
      icon: Pill,
      color: 'emerald',
      description: 'Comprehensive audit of all pharmaceutical products, SKU codes, unit costs, physical counts, reorder thresholds, and active valuation.'
    },
    {
      id: 'expiry',
      title: 'Expiry & Shelf-Life Risk Assessment',
      icon: AlertTriangle,
      color: 'amber',
      description: 'Detailed breakdown of expiring medications within 60 days, critical out-of-date stocks, batch numbers, and safe disposal logs.'
    },
    {
      id: 'orders',
      title: 'Procurement & Purchase Orders',
      icon: ShoppingCart,
      color: 'blue',
      description: 'Full procurement trail including supplier accounts, line-item totals, order progression status, and fulfillment lead times.'
    },
    {
      id: 'movements',
      title: 'Stock Movements & Dispensing Audit',
      icon: ArrowLeftRight,
      color: 'indigo',
      description: 'Regulatory audit log detailing stock-in receipts, patient dispensing, internal adjustments, ward returns, and recorded user IDs.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics Export</h1>
          <p className="text-sm text-gray-500 mt-1">
            Export regulatory-grade compliance documentation, inventory valuations, and audit trails in PDF and Microsoft Excel format.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
          <ShieldCheck className="w-4 h-4" />
          <span>Audit-Ready Reports</span>
        </div>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportModules.map((mod) => {
          const Icon = mod.icon;
          const isPdfLoading = downloading[`${mod.id}_pdf`];
          const isExcelLoading = downloading[`${mod.id}_excel`];

          return (
            <div 
              key={mod.id} 
              className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:border-gray-200 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl ${
                    mod.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                    mod.color === 'amber' ? 'bg-amber-50 text-amber-600' :
                    mod.color === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mt-4">{mod.title}</h3>
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                  {mod.description}
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-gray-100 flex items-center gap-3">
                <Button
                  variant="outline"
                  icon={FileText}
                  loading={isPdfLoading}
                  disabled={isPdfLoading || isExcelLoading}
                  onClick={() => handleDownload(mod.id, 'pdf')}
                  className="flex-1 text-xs"
                >
                  Download PDF
                </Button>

                <Button
                  variant="primary"
                  icon={FileSpreadsheet}
                  loading={isExcelLoading}
                  disabled={isPdfLoading || isExcelLoading}
                  onClick={() => handleDownload(mod.id, 'excel')}
                  className="flex-1 text-xs"
                >
                  Download Excel
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Compliance Guidelines */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Audit & Regulatory Compliance</h4>
        <p className="text-xs text-gray-500 mt-1">
          Exported PDF reports are rendered with timestamp watermarks, hospital header blocks, and cryptographic row integrity. Excel files include formatted mathematical sum rows for automated accounting reconciliation.
        </p>
      </div>
    </div>
  );
};

export default ReportsPage;
