
import { useCallback, useEffect, useState } from "react";
import {
  getMedicines,
  getStockMonitoring,
  getSuppliers,
  getPurchaseOrders,
} from "../../api/pharmacistApi.js";

import {
  Activity,
  AlertTriangle,
  CalendarClock,
  Package,
  RefreshCw,
  ShoppingCart,
  Truck,
  Wallet,
} from "lucide-react";

// Extract Axios response or normal response
function unwrap(response) {
  return response?.data ?? response;
}

// Extract arrays from different response formats
function extractList(response, keys = []) {
  let data = unwrap(response);

  for (let i = 0; i < 5 && data && !Array.isArray(data); i++) {
    if (Array.isArray(data.content)) return data.content;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.results)) return data.results;

    const key = keys.find((item) => Array.isArray(data[item]));

    if (key) return data[key];

    if (data.data && typeof data.data === "object") {
      data = data.data;
    } else {
      break;
    }
  }

  return Array.isArray(data) ? data : [];
}

function getNumber(data, keys, fallback = 0) {
  for (const key of keys) {
    if (data?.[key] !== undefined && data?.[key] !== null) {
      const value = Number(data[key]);

      if (Number.isFinite(value)) return value;
    }
  }

  return fallback;
}

function getQuantity(item) {
  return Number(
    item.quantity ??
    item.stockQuantity ??
    item.stock ??
    item.units ??
    0
  );
}

function getThreshold(item) {
  return Number(
    item.reorderLevel ??
    item.minimumStock ??
    item.minStock ??
    10
  );
}

function getDate(item) {
  const value =
    item.expiryDate ??
    item.expirationDate ??
    item.expiry_date ??
    item.expiration_date;

  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getMedicineName(item, medicines) {
  if (
    item.medicineName ||
    item.name
  ) {
    return item.medicineName || item.name;
  }

  const medicineId =
    item.medicineId ??
    item.medicine?.medicineId ??
    item.medicine?.id;

  const medicine = medicines.find(
    (medicine) =>
      String(medicine.medicineId ?? medicine.id) ===
      String(medicineId)
  );

  return medicine?.medicineName ?? medicine?.name ?? "Unknown medicine";
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

function getSupplierName(supplier, supplierId) {
  if (supplier) {
    return (
      supplier.supplierName ??
      supplier.name ??
      supplier.companyName ??
      supplier.businessName ??
      `Supplier #${supplierId}`
    );
  }

  return `Supplier #${supplierId ?? "Unknown"}`;
}

function StatCard({ title, value, description, icon: Icon, color }) {
  const colors = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    amber: "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    orange: "bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
    green: "bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400",
    red: "bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400",
    violet: "bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {title}
        </p>

        <div className={`rounded-xl p-3 ${colors[color] || colors.blue}`}>
          <Icon size={21} />
        </div>
      </div>

      <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </article>
  );
}

function SectionTitle({ icon: Icon, title, count }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Icon size={20} className="text-blue-600 dark:text-blue-400" />

        <h3 className="font-semibold text-slate-900 dark:text-white">
          {title}
        </h3>
      </div>

      {count !== undefined && (
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {count}
        </span>
      )}
    </div>
  );
}

export default function DashboardOverview() {
  const [medicines, setMedicines] = useState([]);
  const [batches, setBatches] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);

  const [stockSummary, setStockSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    const results = await Promise.allSettled([
      getMedicines(),
      getStockMonitoring(),
      getSuppliers(),
      getPurchaseOrders(),
    ]);

    const errors = [];

    // Medicines
    if (results[0].status === "fulfilled") {
      const list = extractList(results[0].value, ["medicines"]);
      setMedicines(list);
    } else {
      setMedicines([]);
      errors.push("Unable to load medicines.");
      console.error("Medicine API error:", results[0].reason);
    }

    // Stock monitoring
    if (results[1].status === "fulfilled") {
      const stockData = unwrap(results[1].value);

      const list = extractList(stockData, [
        "batches",
        "inventory",
        "inventoryItems",
        "stockItems",
      ]);

      setBatches(list);
      setStockSummary(Array.isArray(stockData) ? {} : stockData ?? {});
    } else {
      setBatches([]);
      setStockSummary({});
      errors.push("Unable to load stock monitoring.");
      console.error("Stock API error:", results[1].reason);
    }

    // Suppliers
    if (results[2].status === "fulfilled") {
      const list = extractList(results[2].value, ["suppliers"]);
      setSuppliers(list);
    } else {
      setSuppliers([]);
      errors.push("Unable to load suppliers.");
      console.error("Supplier API error:", results[2].reason);
    }

    // Purchase orders
    if (results[3].status === "fulfilled") {
      const list = extractList(results[3].value, [
        "purchaseOrders",
        "orders",
      ]);
      setPurchaseOrders(list);
    } else {
      setPurchaseOrders([]);
      errors.push("Unable to load purchase orders.");
      console.error("Purchase order API error:", results[3].reason);
    }

    setError(errors.join(" "));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Inventory calculations
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const thirtyDaysLater = new Date(now);
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

  const lowStockItems = batches.filter((item) => {
    const quantity = getQuantity(item);

    return quantity > 0 && quantity <= getThreshold(item);
  });

  const outOfStockItems = batches.filter(
    (item) => getQuantity(item) <= 0
  );

  const expiredItems = batches.filter((item) => {
    const expiry = getDate(item);
    return expiry && expiry < now;
  });

  const expiringItems = batches.filter((item) => {
    const expiry = getDate(item);

    return (
      expiry &&
      expiry >= now &&
      expiry <= thirtyDaysLater
    );
  });

  const totalStockUnits = batches.length
    ? batches.reduce(
        (sum, item) => sum + Math.max(0, getQuantity(item)),
        0
      )
    : getNumber(stockSummary, [
        "totalStockUnits",
        "totalUnits",
        "totalQuantity",
      ]);

  const totalBatches = batches.length
    ? batches.length
    : getNumber(stockSummary, [
        "totalBatches",
        "totalInventoryBatches",
      ]);

  const lowStockCount = batches.length
    ? lowStockItems.length
    : getNumber(stockSummary, [
        "lowStockBatches",
        "lowStockItems",
        "lowStockCount",
      ]);

  const outOfStockCount = batches.length
    ? outOfStockItems.length
    : getNumber(stockSummary, [
        "outOfStockBatches",
        "outOfStockItems",
        "outOfStockCount",
      ]);

  const expiredCount = batches.length
    ? expiredItems.length
    : getNumber(stockSummary, [
        "expiredBatches",
        "expiredItems",
        "expiredCount",
      ]);

  const expiringCount = batches.length
    ? expiringItems.length
    : getNumber(stockSummary, [
        "expiringSoonBatches",
        "expiringSoonItems",
        "expiringCount",
      ]);

  // Purchase order calculations
  const getStatus = (order) =>
    String(order.status ?? "").toUpperCase();

  const pendingOrders = purchaseOrders.filter(
    (order) => getStatus(order) === "PENDING"
  );

  const approvedOrders = purchaseOrders.filter(
    (order) => getStatus(order) === "APPROVED"
  );

  const receivedOrders = purchaseOrders.filter(
    (order) => getStatus(order) === "RECEIVED"
  );

  const cancelledOrders = purchaseOrders.filter(
    (order) => getStatus(order) === "CANCELLED"
  );

  const totalPurchaseAmount = purchaseOrders.reduce(
    (sum, order) => sum + Number(order.totalAmount || 0),
    0
  );

  // Supplier insights from actual supplier and order data
  const supplierOrderMap = {};

  purchaseOrders.forEach((order) => {
    const supplierId = order.supplierId ?? order.supplier?.supplierId;

    if (supplierId == null) return;

    const key = String(supplierId);

    if (!supplierOrderMap[key]) {
      supplierOrderMap[key] = {
        supplierId,
        orderCount: 0,
        totalAmount: 0,
      };
    }

    supplierOrderMap[key].orderCount += 1;
    supplierOrderMap[key].totalAmount += Number(
      order.totalAmount || 0
    );
  });

  const topSuppliers = Object.values(supplierOrderMap)
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 5);

  const filteredMedicines = medicines.filter((medicine) => {
    const query = search.trim().toLowerCase();

    if (!query) return true;

    return [
      medicine.medicineName,
      medicine.name,
      medicine.category,
      medicine.description,
    ].some((value) =>
      String(value ?? "").toLowerCase().includes(query)
    );
  });

  const stats = [
    {
      title: "Total Medicines",
      value: medicines.length,
      description: "Registered medicine records",
      icon: Package,
      color: "blue",
    },
    {
      title: "Low-Stock Batches",
      value: lowStockCount,
      description: "At or below reorder level",
      icon: AlertTriangle,
      color: "amber",
    },
    {
      title: "Expiring Medicines",
      value: expiringCount,
      description: "Expiring within 30 days",
      icon: CalendarClock,
      color: "orange",
    },
    {
      title: "Total Stock Units",
      value: totalStockUnits,
      description: "Units across inventory batches",
      icon: Activity,
      color: "green",
    },
    {
      title: "Out of Stock",
      value: outOfStockCount,
      description: "Batches with zero stock",
      icon: AlertTriangle,
      color: "red",
    },
    {
      title: "Expired Batches",
      value: expiredCount,
      description: "Batches past expiry date",
      icon: CalendarClock,
      color: "red",
    },
    {
      title: "Inventory Batches",
      value: totalBatches,
      description: "Recorded inventory batches",
      icon: Package,
      color: "violet",
    },
    {
      title: "Total Suppliers",
      value: suppliers.length,
      description: "Registered suppliers",
      icon: Truck,
      color: "blue",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 p-10 text-slate-600 dark:text-slate-300">
        <RefreshCw size={22} className="animate-spin" />
        Loading pharmacist dashboard...
      </div>
    );
  }

  return (
    <section className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Pharmacist Dashboard
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Monitor inventory, expiry dates, purchases and suppliers.
          </p>
        </div>

        <button
          type="button"
          onClick={loadDashboard}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <RefreshCw size={16} />
          Refresh Dashboard
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {/* Inventory overview */}
      <div>
        <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
          Inventory Overview
        </h3>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>
      </div>

      {/* Purchase summary */}
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <SectionTitle
          icon={ShoppingCart}
          title="Purchase Summary"
          count={`${purchaseOrders.length} orders`}
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Orders"
            value={purchaseOrders.length}
            description="All purchase orders"
            icon={ShoppingCart}
            color="blue"
          />

          <StatCard
            title="Pending Orders"
            value={pendingOrders.length}
            description="Waiting for processing"
            icon={Activity}
            color="amber"
          />

          <StatCard
            title="Approved Orders"
            value={approvedOrders.length}
            description="Approved purchase orders"
            icon={CheckIcon}
            color="green"
          />

          <StatCard
            title="Received Orders"
            value={receivedOrders.length}
            description="Successfully received"
            icon={Package}
            color="violet"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-blue-50 p-4 dark:bg-blue-500/10">
          <div className="flex items-center gap-3">
            <Wallet className="text-blue-600 dark:text-blue-400" />

            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Total Purchase Amount
              </p>

              <p className="text-xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(totalPurchaseAmount)}
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400">
            Cancelled orders: {cancelledOrders.length}
          </p>
        </div>
      </div>

      {/* Low stock */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <SectionTitle
          icon={AlertTriangle}
          title="Low-Stock Items"
          count={lowStockItems.length}
        />

        {lowStockItems.length === 0 ? (
          <p className="py-5 text-center text-sm text-slate-500 dark:text-slate-400">
            No low-stock batches found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  <th className="px-3 py-3">Medicine</th>
                  <th className="px-3 py-3">Batch</th>
                  <th className="px-3 py-3">Available</th>
                  <th className="px-3 py-3">Minimum Stock</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {lowStockItems.map((item, index) => (
                  <tr
                    key={item.inventoryId ?? item.id ?? index}
                    className="border-b border-slate-100 dark:border-slate-800"
                  >
                    <td className="px-3 py-3 font-medium text-slate-800 dark:text-slate-200">
                      {getMedicineName(item, medicines)}
                    </td>

                    <td className="px-3 py-3 text-slate-600 dark:text-slate-400">
                      {item.batchNumber ?? "—"}
                    </td>

                    <td className="px-3 py-3 text-slate-700 dark:text-slate-300">
                      {getQuantity(item)}
                    </td>

                    <td className="px-3 py-3 text-slate-700 dark:text-slate-300">
                      {getThreshold(item)}
                    </td>

                    <td className="px-3 py-3">
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                        Low stock
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Expiring medicines */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <SectionTitle
          icon={CalendarClock}
          title="Expiring Medicines"
          count={expiringItems.length}
        />

        {expiringItems.length === 0 ? (
          <p className="py-5 text-center text-sm text-slate-500 dark:text-slate-400">
            No medicines expiring within 30 days.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  <th className="px-3 py-3">Medicine</th>
                  <th className="px-3 py-3">Batch</th>
                  <th className="px-3 py-3">Quantity</th>
                  <th className="px-3 py-3">Expiry Date</th>
                </tr>
              </thead>

              <tbody>
                {expiringItems.map((item, index) => (
                  <tr
                    key={item.inventoryId ?? item.id ?? index}
                    className="border-b border-slate-100 dark:border-slate-800"
                  >
                    <td className="px-3 py-3 font-medium text-slate-800 dark:text-slate-200">
                      {getMedicineName(item, medicines)}
                    </td>

                    <td className="px-3 py-3 text-slate-600 dark:text-slate-400">
                      {item.batchNumber ?? "—"}
                    </td>

                    <td className="px-3 py-3 text-slate-700 dark:text-slate-300">
                      {getQuantity(item)}
                    </td>

                    <td className="px-3 py-3 text-orange-600 dark:text-orange-400">
                      {formatDate(getDate(item))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Supplier insights */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <SectionTitle
          icon={Truck}
          title="Supplier Insights"
          count={`${suppliers.length} suppliers`}
        />

        <div className="mb-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Registered Suppliers
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {suppliers.length}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Suppliers with Orders
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {Object.keys(supplierOrderMap).length}
            </p>
          </div>
        </div>

        <h4 className="mb-3 font-semibold text-slate-800 dark:text-slate-200">
          Top Suppliers by Purchase Amount
        </h4>

        {topSuppliers.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500 dark:text-slate-400">
            No supplier purchase records available.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  <th className="px-3 py-3">Supplier</th>
                  <th className="px-3 py-3">Orders</th>
                  <th className="px-3 py-3">Purchase Amount</th>
                </tr>
              </thead>

              <tbody>
                {topSuppliers.map((item) => {
                  const supplier = suppliers.find(
                    (supplier) =>
                      String(
                        supplier.supplierId ?? supplier.id
                      ) === String(item.supplierId)
                  );

                  return (
                    <tr
                      key={item.supplierId}
                      className="border-b border-slate-100 dark:border-slate-800"
                    >
                      <td className="px-3 py-3 font-medium text-slate-800 dark:text-slate-200">
                        {getSupplierName(supplier, item.supplierId)}
                      </td>

                      <td className="px-3 py-3 text-slate-600 dark:text-slate-400">
                        {item.orderCount}
                      </td>

                      <td className="px-3 py-3 font-semibold text-slate-800 dark:text-slate-200">
                        {formatCurrency(item.totalAmount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* All medicines */}
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              All Medicines
            </h3>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {medicines.length} registered medicine records
            </p>
          </div>

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search medicines..."
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white sm:max-w-xs"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <th className="px-3 py-3">#</th>
                <th className="px-3 py-3">Medicine Name</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Description</th>
              </tr>
            </thead>

            <tbody>
              {filteredMedicines.map((medicine, index) => (
                <tr
                  key={medicine.medicineId ?? medicine.id ?? index}
                  className="border-b border-slate-100 text-slate-700 dark:border-slate-800 dark:text-slate-300"
                >
                  <td className="px-3 py-3">{index + 1}</td>

                  <td className="px-3 py-3 font-medium">
                    {medicine.medicineName ?? medicine.name ?? "—"}
                  </td>

                  <td className="px-3 py-3">
                    {medicine.category ?? "—"}
                  </td>

                  <td className="px-3 py-3">
                    {medicine.description ?? "—"}
                  </td>
                </tr>
              ))}

              {filteredMedicines.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-6 text-center text-slate-500"
                  >
                    No medicines found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// Small icon component used by the purchase summary
function CheckIcon({ size = 21 }) {
  return <Activity size={size} />;
}
