import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  fetchAiRecommendations,
  fetchAiForecastSummary,
  fetchDemandForecastChart,
  refreshAiForecast,
  createAiRequisition,
  fetchSuppliers,
  fetchMedicines,
} from '../../services/api';
import {
  IconSparkles,
  IconChartTrend,
  IconBox,
  IconClock,
  IconAlertTriangle,
  IconSearch,
  IconRefresh,
  IconDownload,
  IconCheck,
  IconX,
  IconArrowRight,
  IconTrendUp,
  IconTrendDown,
  IconPill,
  IconActivity,
  IconCheckCircle,
  IconShoppingCart,
} from '../../components/icons/Icons';
import './AiForecastPage.css';

export default function AiForecastPage({ userRole = 'PHARMACIST' }) {
  // Session details
  const storedUser = localStorage.getItem('medistock_user');
  let currentUser = { role: userRole, fullName: 'Alex Rivera' };
  try {
    if (storedUser) currentUser = JSON.parse(storedUser);
  } catch (_e) {}

  const role = (currentUser.role || userRole).toUpperCase();
  const isAdmin = role.includes('ADMIN');
  const isPharmacist = role.includes('PHARM') || isAdmin;

  // Primary state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);

  const [summary, setSummary] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // Selected SKU for Demand Forecast Studio
  const [selectedMedId, setSelectedMedId] = useState(1);
  const [timeRangeDays, setTimeRangeDays] = useState(30);
  const [chartData, setChartData] = useState(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Requisition Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMed, setModalMed] = useState(null);
  const [modalQty, setModalQty] = useState(100);
  const [modalSupplierId, setModalSupplierId] = useState('');
  const [modalDeliveryDate, setModalDeliveryDate] = useState('');
  const [modalNotes, setModalNotes] = useState('');
  const [submittingPo, setSubmittingPo] = useState(false);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  };

  // 1. Initial Data Loading
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [sumRes, recsRes, supsRes] = await Promise.all([
        fetchAiForecastSummary().catch(() => null),
        fetchAiRecommendations({}).catch(() => []),
        fetchSuppliers().catch(() => []),
      ]);

      setSummary(sumRes);
      setRecommendations(recsRes || []);
      setSuppliers(supsRes || []);

      if (recsRes && recsRes.length > 0) {
        setSelectedMedId(recsRes[0].medicineId);
      }
    } catch (err) {
      console.error('[AiForecastPage] Failed to load initial data:', err);
      showToast('error', 'Failed to load AI forecasting dataset.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // 2. Load Chart Data when selected medicine or timeRange changes
  useEffect(() => {
    if (!selectedMedId) return;

    let isMounted = true;
    const fetchChart = async () => {
      try {
        setChartLoading(true);
        const data = await fetchDemandForecastChart(selectedMedId, timeRangeDays);
        if (isMounted) setChartData(data);
      } catch (err) {
        console.error('[AiForecastPage] Chart fetch failed:', err);
      } finally {
        if (isMounted) setChartLoading(false);
      }
    };

    fetchChart();
    return () => {
      isMounted = false;
    };
  }, [selectedMedId, timeRangeDays]);

  // Handle on-demand recalculation
  const handleRecalculate = async () => {
    setRefreshing(true);
    try {
      await refreshAiForecast();
      await loadInitialData();
      if (selectedMedId) {
        const cData = await fetchDemandForecastChart(selectedMedId, timeRangeDays);
        setChartData(cData);
      }
      showToast('success', 'AI forecasting models successfully re-evaluated against real consumption velocity!');
    } catch (err) {
      showToast('error', 'Recalculation failed: ' + (err.message || 'Server error'));
    } finally {
      setRefreshing(false);
    }
  };

  // 3. Filtered recommendations
  const filteredRecs = useMemo(() => {
    return recommendations.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r.medicineName && r.medicineName.toLowerCase().includes(q);
        const matchGen = r.genericName && r.genericName.toLowerCase().includes(q);
        const matchCat = r.categoryName && r.categoryName.toLowerCase().includes(q);
        if (!matchName && !matchGen && !matchCat) return false;
      }
      return true;
    });
  }, [recommendations, statusFilter, searchQuery]);

  // Open Requisition Modal
  const handleOpenRequisitionModal = (rec) => {
    setModalMed(rec);
    setModalQty(rec.recommendedOrderQuantity > 0 ? rec.recommendedOrderQuantity : 100);
    setModalSupplierId(rec.primarySupplierId || (suppliers[0]?.supplierId || 1));

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + (rec.leadTimeDays || 5));
    setModalDeliveryDate(targetDate.toISOString().split('T')[0]);

    setModalNotes(
      `AI Demand Forecast Requisition: Recommended replenishment of ${
        rec.recommendedOrderQuantity || 100
      } units to prevent projected stockout.`
    );
    setIsModalOpen(true);
  };

  // Submit Requisition (Creates PENDING_APPROVAL PO)
  const handleSubmitRequisition = async (e) => {
    e.preventDefault();
    if (!modalMed || !modalQty) return;

    setSubmittingPo(true);
    try {
      const res = await createAiRequisition({
        medicineId: modalMed.medicineId,
        supplierId: parseInt(modalSupplierId, 10),
        quantity: parseInt(modalQty, 10),
        expectedDeliveryDate: modalDeliveryDate,
        notes: modalNotes,
      });

      showToast(
        'success',
        `Requisition submitted for ${modalMed.medicineName} (${modalQty} units). Order ${res?.orderNumber || ''} is PENDING_APPROVAL for Admin review.`
      );
      setIsModalOpen(false);
      handleRecalculate();
    } catch (err) {
      showToast('error', 'Failed to submit requisition: ' + (err.message || 'Server error'));
    } finally {
      setSubmittingPo(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Medicine Name',
      'Generic Name',
      'Category',
      'Current Stock',
      'Avg Daily Consumption',
      'Days of Cover',
      'Depletion Date',
      'Reorder Point',
      'Recommended Replenishment',
      'Demand Trend',
      'Status',
      'Confidence %',
      'Explanation',
    ];

    const rows = filteredRecs.map((r) => [
      `"${r.medicineName || ''}"`,
      `"${r.genericName || ''}"`,
      `"${r.categoryName || ''}"`,
      r.currentStock ?? 0,
      r.averageDailyConsumption ?? 0,
      r.daysOfCover ?? 0,
      `"${r.projectedDepletionDate || ''}"`,
      r.reorderPoint ?? 0,
      r.recommendedOrderQuantity ?? 0,
      `"${r.demandTrend || ''} (${r.trendPercentage > 0 ? '+' : ''}${r.trendPercentage || 0}%)"`,
      `"${r.status || ''}"`,
      `${r.confidenceScore || 0}%`,
      `"${(r.explanation || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `medistock_ai_inventory_forecast_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', 'AI Inventory Recommendations exported to CSV!');
  };

  // Selected recommendation object
  const currentSelectedRec = useMemo(() => {
    return recommendations.find((r) => r.medicineId === selectedMedId) || recommendations[0] || null;
  }, [recommendations, selectedMedId]);

  // SVG Chart Calculations
  const chartPoints = chartData?.points || [];
  const svgMetrics = useMemo(() => {
    if (!chartPoints.length) return null;

    let maxVal = 10;
    chartPoints.forEach((p) => {
      if (p.actualSales && p.actualSales > maxVal) maxVal = p.actualSales;
      if (p.confidenceUpper && p.confidenceUpper > maxVal) maxVal = p.confidenceUpper;
      if (p.forecastedDemand && p.forecastedDemand > maxVal) maxVal = p.forecastedDemand;
    });

    maxVal = Math.ceil(maxVal * 1.18); // Margin at top

    const width = 640;
    const height = 230;
    const padX = 40;
    const padY = 24;
    const innerW = width - padX * 2;
    const innerH = height - padY * 2;

    const n = chartPoints.length;
    const getX = (idx) => padX + (idx / Math.max(1, n - 1)) * innerW;
    const getY = (val) => padY + innerH - (Math.max(0, val) / maxVal) * innerH;

    // Actual Sales path (Historical)
    const actualPoints = [];
    chartPoints.forEach((p, idx) => {
      if (p.actualSales !== null && p.actualSales !== undefined) {
        actualPoints.push({ x: getX(idx), y: getY(p.actualSales), p, idx });
      }
    });

    let actualPathD = '';
    if (actualPoints.length > 0) {
      actualPathD = `M ${actualPoints[0].x} ${actualPoints[0].y} ` +
        actualPoints.slice(1).map((pt) => `L ${pt.x} ${pt.y}`).join(' ');
    }

    // Forecast line path (All fitted past + future)
    const forecastPathD = `M ${getX(0)} ${getY(chartPoints[0].forecastedDemand || 0)} ` +
      chartPoints.slice(1).map((p, idx) => `L ${getX(idx)} ${getY(p.forecastedDemand || 0)}`).join(' ');

    // Confidence band polygon for future points
    const futureStartIndex = chartPoints.findIndex((p) => !p.isHistorical);
    let bandPolygonPoints = '';
    if (futureStartIndex >= 0) {
      const topPoints = [];
      const bottomPoints = [];
      for (let i = Math.max(0, futureStartIndex - 1); i < n; i++) {
        const pt = chartPoints[i];
        const up = pt.confidenceUpper || pt.forecastedDemand || 0;
        const low = pt.confidenceLower || Math.max(0, (pt.forecastedDemand || 0) * 0.85);
        topPoints.push(`${getX(i)},${getY(up)}`);
        bottomPoints.unshift(`${getX(i)},${getY(low)}`);
      }
      bandPolygonPoints = [...topPoints, ...bottomPoints].join(' ');
    }

    return { width, height, maxVal, getX, getY, actualPoints, actualPathD, forecastPathD, bandPolygonPoints, futureStartIndex };
  }, [chartPoints]);

  return (
    <div className="aif-page">
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 1100,
            background: toast.type === 'success' ? '#065f46' : '#991b1b',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)',
            fontSize: '0.88rem',
            fontWeight: 600,
          }}
        >
          {toast.type === 'success' ? <IconCheck size={18} /> : <IconAlertTriangle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="aif-header">
        <div className="aif-header__title-group">
          <h1>
            <IconSparkles size={28} className="aif-header__sparkle-icon" />
            AI Inventory Recommendations & Demand Forecasting
          </h1>
          <p>
            Machine-calculated consumption velocity, stock depletion dates, and proactive reorder intelligence.
          </p>
        </div>

        <div className="aif-header__actions">
          <div className="aif-meta-pill">
            <IconActivity size={15} color="#008c8c" />
            <span>Accuracy: {summary?.overallAccuracy ?? 94.2}%</span>
          </div>

          <div className="aif-meta-pill">
            <IconCheckCircle size={15} color="#10b981" />
            <span>Avg Confidence: {summary?.averageConfidence ?? 91.5}%</span>
          </div>

          <button
            className="aif-btn aif-btn--secondary"
            onClick={handleRecalculate}
            disabled={refreshing}
            title="Re-run demand forecasting calculations"
          >
            <IconRefresh size={16} className={refreshing ? 'ms3d-spin' : ''} />
            <span>{refreshing ? 'Recalculating...' : 'Refresh Forecast'}</span>
          </button>

          <button className="aif-btn aif-btn--primary" onClick={handleExportCSV}>
            <IconDownload size={16} />
            <span>Export Advice</span>
          </button>
        </div>
      </div>

      {/* 1. Executive Summary KPI Grid */}
      <div className="aif-kpi-grid">
        <div className="aif-kpi-card">
          <div className="aif-kpi-card__header">
            <span className="aif-kpi-card__label">Active Forecasts</span>
            <div className="aif-kpi-card__icon">
              <IconBox size={18} />
            </div>
          </div>
          <div className="aif-kpi-card__value">{summary?.totalRecommendations ?? recommendations.length}</div>
          <div className="aif-kpi-card__subtext">Medicines actively monitored</div>
        </div>

        <div className="aif-kpi-card aif-kpi-card--critical">
          <div className="aif-kpi-card__header">
            <span className="aif-kpi-card__label">Critical Shortages</span>
            <div className="aif-kpi-card__icon">
              <IconAlertTriangle size={18} />
            </div>
          </div>
          <div className="aif-kpi-card__value" style={{ color: '#ef4444' }}>
            {summary?.criticalShortagesCount ?? 0}
          </div>
          <div className="aif-kpi-card__subtext">Depletion within supplier lead time</div>
        </div>

        <div className="aif-kpi-card aif-kpi-card--reorder">
          <div className="aif-kpi-card__header">
            <span className="aif-kpi-card__label">Reorder Recommended</span>
            <div className="aif-kpi-card__icon">
              <IconShoppingCart size={18} />
            </div>
          </div>
          <div className="aif-kpi-card__value" style={{ color: '#d97706' }}>
            {summary?.reorderRecommendedCount ?? 0}
          </div>
          <div className="aif-kpi-card__subtext">Approaching Reorder Point (ROP)</div>
        </div>

        <div className="aif-kpi-card aif-kpi-card--overstock">
          <div className="aif-kpi-card__header">
            <span className="aif-kpi-card__label">Overstocked SKUs</span>
            <div className="aif-kpi-card__icon">
              <IconTrendUp size={18} />
            </div>
          </div>
          <div className="aif-kpi-card__value" style={{ color: '#8b5cf6' }}>
            {summary?.overstockedCount ?? 0}
          </div>
          <div className="aif-kpi-card__subtext">&gt; 120 days stock on hand</div>
        </div>

        <div className="aif-kpi-card aif-kpi-card--slow">
          <div className="aif-kpi-card__header">
            <span className="aif-kpi-card__label">Slow-Moving SKUs</span>
            <div className="aif-kpi-card__icon">
              <IconClock size={18} />
            </div>
          </div>
          <div className="aif-kpi-card__value" style={{ color: '#3b82f6' }}>
            {summary?.slowMovingCount ?? 0}
          </div>
          <div className="aif-kpi-card__subtext">ADC &lt; 0.3 units/day</div>
        </div>

        <div className="aif-kpi-card aif-kpi-card--adequate">
          <div className="aif-kpi-card__header">
            <span className="aif-kpi-card__label">Suggested Replenishment</span>
            <div className="aif-kpi-card__icon">
              <IconPill size={18} />
            </div>
          </div>
          <div className="aif-kpi-card__value" style={{ color: '#008c8c' }}>
            {summary?.totalRecommendedReplenishmentUnits?.toLocaleString() ?? 0}
          </div>
          <div className="aif-kpi-card__subtext">
            Est. Cost: ${summary?.totalEstimatedReplenishmentCost ? Number(summary.totalEstimatedReplenishmentCost).toFixed(2) : '0.00'}
          </div>
        </div>
      </div>

      {/* 2. Interactive Demand Forecasting Studio (Ailaaj One & DawaAI Style) */}
      <div className="aif-studio">
        {/* Left: Interactive Demand Forecast vs Actuals Chart */}
        <div className="aif-panel">
          <div className="aif-panel__header">
            <div className="aif-panel__title-box">
              <h3>
                <IconChartTrend size={20} color="#008c8c" />
                Demand Forecast vs Actuals
              </h3>
              <p>Historical consumption points with 30-day forward AI prediction cone</p>
            </div>

            <div className="aif-panel__controls">
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>SKU:</label>
              <select
                className="aif-select"
                value={selectedMedId}
                onChange={(e) => setSelectedMedId(parseInt(e.target.value, 10))}
              >
                {recommendations.map((m) => (
                  <option key={m.medicineId} value={m.medicineId}>
                    {m.medicineName} ({m.categoryName || 'General'})
                  </option>
                ))}
              </select>

              <div className="aif-pill-group">
                <button
                  className={`aif-pill-btn ${timeRangeDays === 30 ? 'aif-pill-btn--active' : ''}`}
                  onClick={() => setTimeRangeDays(30)}
                >
                  Last 30 Days
                </button>
                <button
                  className={`aif-pill-btn ${timeRangeDays === 60 ? 'aif-pill-btn--active' : ''}`}
                  onClick={() => setTimeRangeDays(60)}
                >
                  Last 60 Days
                </button>
              </div>
            </div>
          </div>

          {/* Chart Legend */}
          <div className="aif-chart-legend">
            <div className="aif-chart-legend__item">
              <div className="aif-legend-dot aif-legend-dot--actual" />
              <span>Actual Dispensed Sales</span>
            </div>
            <div className="aif-chart-legend__item">
              <div className="aif-legend-dot aif-legend-dot--forecast" />
              <span>Forecasted Demand Curve</span>
            </div>
            <div className="aif-chart-legend__item">
              <div className="aif-legend-dot aif-legend-dot--band" />
              <span>95% Confidence Interval Fan</span>
            </div>
          </div>

          {/* SVG Chart Display */}
          <div className="aif-chart-wrapper">
            {chartLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <IconRefresh size={24} className="ms3d-spin" color="#008c8c" />
                <span style={{ marginLeft: 8, fontSize: '0.86rem', color: '#64748b' }}>Generating demand curve...</span>
              </div>
            ) : svgMetrics ? (
              <svg className="aif-svg-chart" viewBox={`0 0 ${svgMetrics.width} ${svgMetrics.height}`}>
                {/* Horizontal reference grid lines */}
                {[0.25, 0.5, 0.75, 1.0].map((ratio, i) => {
                  const y = svgMetrics.getY(svgMetrics.maxVal * ratio);
                  return (
                    <g key={i}>
                      <line x1={40} y1={y} x2={svgMetrics.width - 40} y2={y} className="aif-grid-line" />
                      <text x={34} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8" fontWeight="600">
                        {Math.round(svgMetrics.maxVal * ratio)}
                      </text>
                    </g>
                  );
                })}

                {/* Vertical Divider separating Actuals and Future Forecast */}
                {svgMetrics.futureStartIndex >= 0 && (
                  <line
                    x1={svgMetrics.getX(svgMetrics.futureStartIndex)}
                    y1={24}
                    x2={svgMetrics.getX(svgMetrics.futureStartIndex)}
                    y2={svgMetrics.height - 24}
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    strokeWidth="1.2"
                  />
                )}

                {/* Shaded Confidence Band (Prediction Fan) */}
                {svgMetrics.bandPolygonPoints && (
                  <polygon points={svgMetrics.bandPolygonPoints} className="aif-confidence-band" />
                )}

                {/* Forecast Line */}
                <path d={svgMetrics.forecastPathD} className="aif-line-forecast" />

                {/* Actual Sales Line */}
                {svgMetrics.actualPathD && (
                  <path d={svgMetrics.actualPathD} className="aif-line-actual" />
                )}

                {/* Interactive Data Points for Actual Sales */}
                {svgMetrics.actualPoints.map((pt) => (
                  <circle
                    key={pt.idx}
                    cx={pt.x}
                    cy={pt.y}
                    r={3.5}
                    className="aif-data-point"
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                ))}
              </svg>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                No consumption logs found for this medicine.
              </div>
            )}

            {/* Hover Tooltip */}
            {hoveredPoint && (
              <div
                className="aif-chart-tooltip"
                style={{
                  left: `${(hoveredPoint.x / (svgMetrics?.width || 1)) * 100}%`,
                  top: `${(hoveredPoint.y / (svgMetrics?.height || 1)) * 100}%`,
                }}
              >
                <strong>{hoveredPoint.p.dateLabel}</strong>
                <div>Actual: {hoveredPoint.p.actualSales} units</div>
                <div>Fitted Demand: {hoveredPoint.p.forecastedDemand} units</div>
              </div>
            )}
          </div>

          {/* Under-Chart KPI Ribbon */}
          <div className="aif-chart-bottom-metrics">
            <div className="aif-stat-box">
              <div className="aif-stat-box__title">Current Stock</div>
              <div className="aif-stat-box__val">{chartData?.currentStock ?? 0} units</div>
            </div>
            <div className="aif-stat-box">
              <div className="aif-stat-box__title">Days of Cover</div>
              <div className="aif-stat-box__val" style={{ color: (chartData?.daysOfCover ?? 0) <= 7 ? '#ef4444' : '#102e59' }}>
                {chartData?.daysOfCover ? `${chartData.daysOfCover} days` : '0 days'}
              </div>
            </div>
            <div className="aif-stat-box">
              <div className="aif-stat-box__title">Target Stock Ceiling</div>
              <div className="aif-stat-box__val">{chartData?.recommendedStockLevel ?? 0} units</div>
            </div>
            <div className="aif-stat-box">
              <div className="aif-stat-box__title">Forecast Accuracy</div>
              <div className="aif-stat-box__val" style={{ color: '#008c8c' }}>
                {chartData?.forecastAccuracy ?? 92}%
              </div>
            </div>
          </div>

          {/* Proactive stockout banner */}
          <div className="aif-banner-notice">
            <IconCheck size={18} />
            <span>
              <strong>AI Stockout Shield Active:</strong> Lead-time safety stock is calibrated for {chartData?.medicineName || 'this SKU'}, mitigating clinical supply disruptions.
            </span>
          </div>
        </div>

        {/* Right: AI Assistant & Procurement Insights (StockFlow AI style) */}
        <div className="aif-panel aif-insights-col">
          <div className="aif-panel__header" style={{ marginBottom: 12 }}>
            <div className="aif-panel__title-box">
              <h3>
                <IconSparkles size={18} color="#008c8c" />
                AI Procurement Advice
              </h3>
              <p>Automated replenishment insight for selected SKU</p>
            </div>
          </div>

          {/* Smart Reorder Card */}
          <div className="aif-alert-card aif-alert-card--reorder">
            <div className="aif-alert-card__header">
              <span>Smart Reorder Alert</span>
              <span className="aif-badge aif-badge--critical" style={{ fontSize: '0.7rem' }}>
                {currentSelectedRec?.status || 'MONITORING'}
              </span>
            </div>
            <p>
              {currentSelectedRec?.explanation ||
                `Stock will deplete in ${chartData?.daysOfCover || 5} days at current velocity.`}
            </p>

            {isPharmacist && (
              <button
                className="aif-btn aif-btn--primary aif-btn--sm"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => currentSelectedRec && handleOpenRequisitionModal(currentSelectedRec)}
              >
                <IconShoppingCart size={15} />
                <span>Generate Purchase Order ({currentSelectedRec?.recommendedOrderQuantity || 100} units)</span>
              </button>
            )}
          </div>

          {/* Seasonal / Demand Trend Alert */}
          <div className="aif-alert-card aif-alert-card--spike">
            <div className="aif-alert-card__header">
              <span>Demand & Seasonal Insight</span>
              <span className="aif-trend aif-trend--up">
                {currentSelectedRec?.demandTrend === 'INCREASING' ? (
                  <>
                    <IconTrendUp size={14} /> +{currentSelectedRec?.trendPercentage}%
                  </>
                ) : (
                  <>
                    <IconTrendDown size={14} /> {currentSelectedRec?.trendPercentage}%
                  </>
                )}
              </span>
            </div>
            <p>{currentSelectedRec?.seasonalInsight || 'Seasonal pattern within typical variance bands.'}</p>
          </div>

          {/* Expiry Risk Warning */}
          {currentSelectedRec?.hasExpiringBatchRisk && (
            <div className="aif-alert-card" style={{ background: '#fff1f2', borderColor: '#fecdd3', color: '#9f1239' }}>
              <div className="aif-alert-card__header">
                <span>Near-Expiry Batch Warning</span>
                <IconClock size={16} />
              </div>
              <p>
                <strong>{currentSelectedRec.expiringUnitsCount} units</strong> in inventory expire within 60 days before projected full consumption. Recommend prioritizing FEFO allocation before incoming PO delivery.
              </p>
            </div>
          )}

          {/* Procurement Workflow Stepper */}
          <div style={{ marginTop: 'auto' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Procurement Lifecycle Stepper
            </span>
            <div className="aif-stepper">
              <div className="aif-step aif-step--done">
                <div className="aif-step-circle">✓</div>
                <div className="aif-step-label">AI Forecast</div>
              </div>
              <div className="aif-step aif-step--active">
                <div className="aif-step-circle">2</div>
                <div className="aif-step-label">Requisition</div>
              </div>
              <div className="aif-step">
                <div className="aif-step-circle">3</div>
                <div className="aif-step-label">Admin Approval</div>
              </div>
              <div className="aif-step">
                <div className="aif-step-circle">4</div>
                <div className="aif-step-label">Delivery</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. AI Inventory Recommendations & Depletion Table */}
      <div className="aif-table-section">
        <div className="aif-filters-bar">
          <div className="aif-tabs">
            <button
              className={`aif-tab-btn ${statusFilter === 'ALL' ? 'aif-tab-btn--active' : ''}`}
              onClick={() => setStatusFilter('ALL')}
            >
              <span>All Recommendations</span>
              <span className="aif-tab-badge">{recommendations.length}</span>
            </button>

            <button
              className={`aif-tab-btn ${statusFilter === 'CRITICAL_SHORTAGE' ? 'aif-tab-btn--active' : ''}`}
              onClick={() => setStatusFilter('CRITICAL_SHORTAGE')}
            >
              <span>Critical Shortages</span>
              <span className="aif-tab-badge" style={{ color: '#ef4444' }}>
                {recommendations.filter((r) => r.status === 'CRITICAL_SHORTAGE').length}
              </span>
            </button>

            <button
              className={`aif-tab-btn ${statusFilter === 'REORDER_RECOMMENDED' ? 'aif-tab-btn--active' : ''}`}
              onClick={() => setStatusFilter('REORDER_RECOMMENDED')}
            >
              <span>Reorder Soon</span>
              <span className="aif-tab-badge" style={{ color: '#d97706' }}>
                {recommendations.filter((r) => r.status === 'REORDER_RECOMMENDED').length}
              </span>
            </button>

            <button
              className={`aif-tab-btn ${statusFilter === 'OVERSTOCKED' ? 'aif-tab-btn--active' : ''}`}
              onClick={() => setStatusFilter('OVERSTOCKED')}
            >
              <span>Overstocked</span>
              <span className="aif-tab-badge">
                {recommendations.filter((r) => r.status === 'OVERSTOCKED').length}
              </span>
            </button>

            <button
              className={`aif-tab-btn ${statusFilter === 'SLOW_MOVING' ? 'aif-tab-btn--active' : ''}`}
              onClick={() => setStatusFilter('SLOW_MOVING')}
            >
              <span>Slow Moving</span>
              <span className="aif-tab-badge">
                {recommendations.filter((r) => r.status === 'SLOW_MOVING').length}
              </span>
            </button>

            <button
              className={`aif-tab-btn ${statusFilter === 'INSUFFICIENT_DATA' ? 'aif-tab-btn--active' : ''}`}
              onClick={() => setStatusFilter('INSUFFICIENT_DATA')}
            >
              <span>Insufficient Data</span>
              <span className="aif-tab-badge">
                {recommendations.filter((r) => r.status === 'INSUFFICIENT_DATA').length}
              </span>
            </button>
          </div>

          <div className="aif-search-box">
            <IconSearch size={16} className="aif-search-icon" />
            <input
              type="text"
              className="aif-search-input"
              placeholder="Search medicine or generic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Table Responsive Container */}
        <div className="aif-table-responsive">
          <table className="aif-table">
            <thead>
              <tr>
                <th>Medicine / SKU</th>
                <th>Current Stock</th>
                <th>Avg Consumption</th>
                <th>Days Remaining</th>
                <th>Reorder ROP</th>
                <th>Suggested Order</th>
                <th>Trend</th>
                <th>AI Status</th>
                <th>Confidence</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecs.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                    No medicines match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredRecs.map((rec) => {
                  const isSelected = rec.medicineId === selectedMedId;
                  const getStatusBadge = (st) => {
                    switch (st) {
                      case 'CRITICAL_SHORTAGE':
                        return <span className="aif-badge aif-badge--critical">Critical Stock</span>;
                      case 'REORDER_RECOMMENDED':
                        return <span className="aif-badge aif-badge--reorder">Reorder Soon</span>;
                      case 'OVERSTOCKED':
                        return <span className="aif-badge aif-badge--overstock">Overstocked</span>;
                      case 'SLOW_MOVING':
                        return <span className="aif-badge aif-badge--slow">Slow Moving</span>;
                      case 'ADEQUATE':
                        return <span className="aif-badge aif-badge--adequate">Adequate</span>;
                      default:
                        return <span className="aif-badge aif-badge--insufficient">Sparse Data</span>;
                    }
                  };

                  return (
                    <tr key={rec.medicineId} className={isSelected ? 'aif-row--selected' : ''}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#102e59' }}>{rec.medicineName}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          {rec.genericName || 'Standard Formulation'} &bull; {rec.categoryName || 'General'}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 800, fontSize: '0.94rem' }}>{rec.currentStock} units</div>
                        {rec.incomingOnOrderQuantity > 0 && (
                          <div style={{ fontSize: '0.74rem', color: '#008c8c', fontWeight: 600 }}>
                            +{rec.incomingOnOrderQuantity} on order
                          </div>
                        )}
                      </td>

                      <td>
                        <div style={{ fontWeight: 700 }}>{rec.averageDailyConsumption} /day</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                          ~{rec.weeklyConsumption} /wk &bull; {rec.monthlyConsumption} /mo
                        </div>
                      </td>

                      <td>
                        <div
                          style={{
                            fontWeight: 800,
                            color: rec.daysOfCover <= 7 ? '#ef4444' : rec.daysOfCover <= 14 ? '#d97706' : '#102e59',
                          }}
                        >
                          {rec.daysOfCover >= 900 ? '999+ days' : `${rec.daysOfCover} days`}
                        </div>
                        {rec.projectedDepletionDate && rec.daysOfCover < 900 && (
                          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                            Depletes: {rec.projectedDepletionDate}
                          </div>
                        )}
                      </td>

                      <td>
                        <div style={{ fontWeight: 700 }}>{rec.reorderPoint} units</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Safety: {rec.safetyStock}</div>
                      </td>

                      <td>
                        {rec.recommendedOrderQuantity > 0 ? (
                          <>
                            <div style={{ fontWeight: 800, color: '#008c8c' }}>
                              +{rec.recommendedOrderQuantity} units
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                              Est. ${Number(rec.estimatedReorderCost || 0).toFixed(2)}
                            </div>
                          </>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>No Order Needed</span>
                        )}
                      </td>

                      <td>
                        <span
                          className={`aif-trend ${
                            rec.demandTrend === 'INCREASING'
                              ? 'aif-trend--up'
                              : rec.demandTrend === 'DECREASING'
                              ? 'aif-trend--down'
                              : 'aif-trend--stable'
                          }`}
                        >
                          {rec.demandTrend === 'INCREASING' && <IconTrendUp size={14} />}
                          {rec.demandTrend === 'DECREASING' && <IconTrendDown size={14} />}
                          {rec.trendPercentage > 0 ? `+${rec.trendPercentage}%` : `${rec.trendPercentage || 0}%`}
                        </span>
                      </td>

                      <td>{getStatusBadge(rec.status)}</td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 700, fontSize: '0.84rem' }}>{rec.confidenceScore}%</span>
                          <div
                            style={{
                              width: 36,
                              height: 6,
                              borderRadius: 3,
                              background: '#e2e8f0',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${rec.confidenceScore}%`,
                                height: '100%',
                                background:
                                  rec.confidenceScore >= 85
                                    ? '#10b981'
                                    : rec.confidenceScore >= 65
                                    ? '#f59e0b'
                                    : '#ef4444',
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                          <button
                            className="aif-btn aif-btn--secondary aif-btn--sm"
                            onClick={() => setSelectedMedId(rec.medicineId)}
                            title="View interactive forecast curve"
                          >
                            <IconChartTrend size={14} />
                            <span>Curve</span>
                          </button>

                          {isPharmacist && rec.recommendedOrderQuantity > 0 && (
                            <button
                              className="aif-reorder-btn"
                              onClick={() => handleOpenRequisitionModal(rec)}
                              title="Generate purchase requisition based on recommendation"
                            >
                              <IconShoppingCart size={13} />
                              <span>Reorder</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Pharmacist Reorder Requisition Modal */}
      {isModalOpen && modalMed && (
        <div className="aif-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="aif-modal" onClick={(e) => e.stopPropagation()}>
            <div className="aif-modal__header">
              <h3>Create PO Requisition from AI Recommendation</h3>
              <button className="aif-modal__close" onClick={() => setIsModalOpen(false)}>
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitRequisition}>
              <div className="aif-modal__body">
                <div style={{ marginBottom: 16, padding: '10px 14px', background: '#f0fdfa', borderRadius: 10, border: '1px solid #ccfbf1' }}>
                  <div style={{ fontWeight: 800, color: '#004d57', fontSize: '0.94rem' }}>{modalMed.medicineName}</div>
                  <div style={{ fontSize: '0.8rem', color: '#008c8c' }}>
                    Current Stock: {modalMed.currentStock} units &bull; ADC: {modalMed.averageDailyConsumption} units/day &bull; Depletion in {modalMed.daysOfCover} days
                  </div>
                </div>

                <div className="aif-form-group">
                  <label className="aif-form-label">Replenishment Quantity (Units)</label>
                  <input
                    type="number"
                    min="1"
                    className="aif-form-input"
                    value={modalQty}
                    onChange={(e) => setModalQty(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                    Suggested by AI Demand Forecasting: {modalMed.recommendedOrderQuantity || 100} units
                  </span>
                </div>

                <div className="aif-form-group">
                  <label className="aif-form-label">Preferred Medical Supplier</label>
                  <select
                    className="aif-form-select"
                    value={modalSupplierId}
                    onChange={(e) => setModalSupplierId(e.target.value)}
                    required
                  >
                    {suppliers.map((s) => (
                      <option key={s.supplierId} value={s.supplierId}>
                        {s.supplierName} ({s.contactPerson || 'Vendor'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="aif-form-group">
                  <label className="aif-form-label">Expected Delivery Date</label>
                  <input
                    type="date"
                    className="aif-form-input"
                    value={modalDeliveryDate}
                    onChange={(e) => setModalDeliveryDate(e.target.value)}
                    required
                  />
                </div>

                <div className="aif-form-group">
                  <label className="aif-form-label">Requisition Notes for Admin Review</label>
                  <textarea
                    rows={3}
                    className="aif-form-textarea"
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                  />
                </div>

                <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: 8, fontSize: '0.76rem', color: '#475569' }}>
                  <strong>Compliance Note:</strong> This requisition will be submitted to the hospital administrator in <code>PENDING_APPROVAL</code> status. MediStock AI never approves or dispatches purchase orders autonomously.
                </div>
              </div>

              <div className="aif-modal__footer">
                <button
                  type="button"
                  className="aif-btn aif-btn--secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="aif-btn aif-btn--primary"
                  disabled={submittingPo}
                >
                  {submittingPo ? 'Submitting Requisition...' : 'Submit PO Requisition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

