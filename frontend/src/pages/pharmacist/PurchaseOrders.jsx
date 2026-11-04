
import { API_BASE } from "../../services/api.js";
import { useCallback, useEffect, useState } from "react";
import {
  ShoppingCart,
  Truck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  Eye,
  X,
  Receipt,
} from "lucide-react";

const API = API_BASE.replace(/\/+$/, "");

export default function PurchaseOrders() {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [supplierId, setSupplierId] = useState("");
  const [items, setItems] = useState([
    { medicineId: "", quantity: "1", unitPrice: "" },
  ]);

  const token = sessionStorage.getItem("medistock_token");

  // Common API request helper
  const request = useCallback(
    async (url, options = {}) => {
      if (!token) {
        throw new Error("Please log in to continue.");
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(options.body
            ? { "Content-Type": "application/json" }
            : {}),
          ...options.headers,
        },
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        let message = "";

        try {
          const parsed = JSON.parse(body);
          message = parsed.message || parsed.error || body;
        } catch {
          message = body;
        }

        throw new Error(
          message || `Request failed with status ${response.status}`
        );
      }

      if (response.status === 204) return null;

      return response.json();
    },
    [token]
  );

  // Load each resource independently so one failed API
  // does not prevent the other resources from loading.
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    const endpoints = [
      {
        name: "Purchase orders",
        url: `${API}/purchase-orders`,
        setter: setOrders,
      },
      {
        name: "Suppliers",
        url: `${API}/pharmacist/suppliers`,
        setter: setSuppliers,
      },
      {
        name: "Medicines",
        url: `${API}/pharmacist/medicines`,
        setter: setMedicines,
      },
    ];

    try {
      const results = await Promise.all(
        endpoints.map(async (endpoint) => {
          try {
            const data = await request(endpoint.url);

            endpoint.setter(Array.isArray(data) ? data : []);

            return {
              name: endpoint.name,
              error: null,
            };
          } catch (err) {
            console.error(
              `${endpoint.name} API failed (${endpoint.url}):`,
              err.message
            );

            endpoint.setter([]);

            return {
              name: endpoint.name,
              error: `${endpoint.name}: ${err.message}`,
            };
          }
        })
      );

      const failures = results.filter((result) => result.error);

      if (failures.length > 0) {
        setError(failures.map((result) => result.error).join(" | "));
      }
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);

  const supplierName = (id) =>
    suppliers.find(
      (supplier) => Number(supplier.supplierId) === Number(id)
    )?.supplierName || `Supplier #${id}`;

  const medicineName = (id) =>
    medicines.find(
      (medicine) => Number(medicine.medicineId) === Number(id)
    )?.medicineName || `Medicine #${id}`;

  function updateItem(index, field, value) {
    setItems((current) =>
      current.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  }

  function addItem() {
    setItems((current) => [
      ...current,
      { medicineId: "", quantity: "1", unitPrice: "" },
    ]);
  }

  function removeItem(index) {
    setItems((current) =>
      current.length > 1
        ? current.filter((_, i) => i !== index)
        : current
    );
  }

  const estimatedTotal = items.reduce(
    (sum, item) =>
      sum +
      (Number(item.quantity) || 0) *
        (Number(item.unitPrice) || 0),
    0
  );

  async function createOrder(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!supplierId) {
      setError("Please select a supplier.");
      return;
    }

    const invalidItem = items.some((item) => {
      const quantity = Number(item.quantity);
      const price = Number(item.unitPrice);

      return (
        !item.medicineId ||
        !Number.isInteger(quantity) ||
        quantity <= 0 ||
        item.unitPrice === "" ||
        !Number.isFinite(price) ||
        price < 0 ||
        !Number.isFinite(quantity * price)
      );
    });

    if (invalidItem) {
      setError(
        "Select a medicine and enter a valid quantity and unit price for every item."
      );
      return;
    }

    setSaving(true);

    try {
      await request(`${API}/purchase-orders`, {
        method: "POST",
        body: JSON.stringify({
          supplierId: Number(supplierId),
          items: items.map((item) => ({
            medicineId: Number(item.medicineId),
            quantity: Number(item.quantity),
            unitPrice: Number(Number(item.unitPrice).toFixed(2)),
          })),
        }),
      });

      setSupplierId("");
      setItems([{ medicineId: "", quantity: "1", unitPrice: "" }]);
      setSuccess("Purchase order created successfully.");

      await loadData();
    } catch (err) {
      setError(err.message || "Unable to create purchase order.");
    } finally {
      setSaving(false);
    }
  }

  async function viewItems(order) {
    setError("");
    setSelectedOrder(order);
    setOrderItems([]);

    try {
      const data = await request(
        `${API}/purchase-orders/${order.purchaseOrderId}/items`
      );

      setOrderItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load order items.");
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesText = `${order.purchaseOrderId} ${supplierName(
      order.supplierId
    )} ${order.status}`
      .toLowerCase()
      .includes(search.toLowerCase());

    return (
      matchesText &&
      (statusFilter === "ALL" || order.status === statusFilter)
    );
  });

  const pendingCount = orders.filter(
    (order) => order.status === "PENDING"
  ).length;

  const totalValue = orders.reduce(
    (sum, order) => sum + Number(order.totalAmount || 0),
    0
  );

  const statusTheme = (status) => {
    const themes = {
      PENDING:
        "bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-200",
      APPROVED:
        "bg-blue-100 dark:bg-blue-500/15 text-blue-800 dark:text-blue-200",
      RECEIVED:
        "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
      PARTIALLY_RECEIVED:
        "bg-cyan-100 dark:bg-cyan-500/15 text-cyan-800 dark:text-cyan-200",
      REJECTED:
        "bg-rose-100 dark:bg-rose-500/15 text-rose-800 dark:text-rose-200",
      CANCELLED:
        "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200",
    };

    return (
      themes[status] ||
      "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
    );
  };

  return (
    <div className="min-h-full space-y-7 bg-gradient-to-br from-slate-50 via-white to-teal-50/40 p-4 transition-colors dark:from-slate-950 dark:via-slate-900 dark:to-teal-950/20 md:p-7 lg:p-8">
      <header className="relative overflow-hidden rounded-3xl border border-teal-100 bg-gradient-to-r from-white via-teal-50 to-cyan-50 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-teal-950/40 md:p-8">
        <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-teal-100/70 blur-3xl" />

        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 p-4 text-white shadow-lg shadow-teal-600/20">
              <ShoppingCart size={30} />
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-teal-700 dark:text-teal-300">
                MediStock / Procurement
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-4xl">
                Purchase Orders
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Create supplier orders and track your purchase history.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-teal-700 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
        >
          <AlertTriangle size={20} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-bold">Action failed</p>
            <p className="mt-1 break-words">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
        >
          <CheckCircle2 size={20} />
          {success}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Total Orders" value={orders.length} icon={ShoppingCart} color="teal" />
        <Metric title="Pending Orders" value={pendingCount} icon={Clock} color="amber" />
        <Metric title="Suppliers" value={suppliers.length} icon={Truck} color="blue" />
        <Metric title="Total Order Value" value={formatCurrency(totalValue)} icon={Receipt} color="purple" />
      </section>

      {/* Create order */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3 border-b border-slate-100 p-5 dark:border-slate-800 md:p-6">
          <div className="rounded-xl bg-teal-100 p-3 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300">
            <Plus size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Create Purchase Order
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Choose a supplier and add the medicines you want to order.
            </p>
          </div>
        </div>

        <form onSubmit={createOrder} className="space-y-5 p-5 md:p-6">
          <div className="max-w-xl">
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Supplier <span className="text-rose-500">*</span>
            </label>

            <select
              value={supplierId}
              onChange={(event) => setSupplierId(event.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="">Select supplier</option>
              {suppliers
                .filter(
                  (supplier) =>
                    supplier.active !== false && supplier.active !== 0
                )
                .map((supplier) => (
                  <option
                    key={supplier.supplierId}
                    value={supplier.supplierId}
                  >
                    {supplier.supplierName}
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-1 items-end gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40 md:grid-cols-2 xl:grid-cols-4"
              >
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Medicine
                  <select
                    value={item.medicineId}
                    onChange={(event) =>
                      updateItem(index, "medicineId", event.target.value)
                    }
                    required
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-normal outline-none focus:border-teal-500 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <option value="">Select medicine</option>
                    {medicines.map((medicine) => (
                      <option
                        key={medicine.medicineId}
                        value={medicine.medicineId}
                      >
                        {medicine.medicineName}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Quantity
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={item.quantity}
                    onChange={(event) =>
                      updateItem(index, "quantity", event.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-teal-500 dark:border-slate-800 dark:bg-slate-900"
                  />
                </label>

                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Unit Price (₹)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={item.unitPrice}
                    onChange={(event) =>
                      updateItem(index, "unitPrice", event.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-teal-500 dark:border-slate-800 dark:bg-slate-900"
                  />
                </label>

                <button
                  type="button"
                  disabled={items.length === 1}
                  onClick={() => removeItem(index)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-40 dark:border-rose-500/30 dark:bg-slate-900 dark:text-rose-400 dark:hover:bg-rose-500/10"
                >
                  <Trash2 size={16} />
                  Remove item
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-800 hover:bg-teal-100 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-200 dark:hover:bg-teal-500/15"
            >
              <Plus size={17} />
              Add medicine
            </button>

            <div className="flex flex-wrap items-center gap-4">
              <div className="text-right">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Estimated total
                </p>
                <p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
                  {formatCurrency(estimatedTotal)}
                </p>
              </div>

              <button
                type="submit"
                disabled={saving || loading}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-teal-600/20 hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50"
              >
                <ShoppingCart size={17} />
                {saving ? "Creating order..." : "Create order"}
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* Purchase history */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="space-y-4 border-b border-slate-100 p-5 dark:border-slate-800 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Purchase History
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Review existing orders and their current status.
              </p>
            </div>

            <span className="rounded-full border border-teal-100 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
              {filteredOrders.length} orders
            </span>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search order or supplier..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-teal-500 focus:bg-white dark:border-slate-800 dark:bg-slate-800/50"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-teal-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <option value="ALL">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="RECEIVED">Received</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-500 dark:text-slate-400">
            <RefreshCw
              size={24}
              className="mx-auto mb-3 animate-spin text-teal-600"
            />
            Loading purchase history...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <div className="rounded-2xl bg-teal-50 p-4 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400">
              <ShoppingCart size={30} />
            </div>
            <h3 className="mt-4 font-bold text-slate-900 dark:text-white">
              No purchase orders found
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Create an order or change your search filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-4">Order</th>
                  <th className="px-5 py-4">Supplier</th>
                  <th className="px-5 py-4">Order Date</th>
                  <th className="px-5 py-4">Total Amount</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Details</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.purchaseOrderId}
                    className="hover:bg-teal-50/50 dark:hover:bg-teal-500/5"
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-800 dark:text-slate-200">
                      #{order.purchaseOrderId}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-slate-100 p-2 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          <Truck size={16} />
                        </span>
                        {supplierName(order.supplierId)}
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-500 dark:text-slate-400">
                      {order.orderDate
                        ? new Date(order.orderDate).toLocaleString()
                        : "—"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-800 dark:text-slate-200">
                      {formatCurrency(order.totalAmount)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-bold ${statusTheme(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <button
                        type="button"
                        onClick={() => viewItems(order)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-white px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-50 dark:border-teal-500/30 dark:bg-slate-900 dark:text-teal-300"
                      >
                        <Eye size={15} />
                        View items
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Order details modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedOrder(null);
              setOrderItems([]);
            }
          }}
        >
          <section className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <header className="flex items-center justify-between gap-4 border-b border-slate-100 p-5 dark:border-slate-800">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-teal-700 dark:text-teal-300">
                  Purchase details
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                  Order #{selectedOrder.purchaseOrderId}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {supplierName(selectedOrder.supplierId)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedOrder(null);
                  setOrderItems([]);
                }}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                aria-label="Close order details"
              >
                <X size={20} />
              </button>
            </header>

            <div className="max-h-[60vh] overflow-auto p-5">
              {orderItems.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  No order items found.
                </p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                    <tr>
                      <th className="p-3">Medicine</th>
                      <th className="p-3">Quantity</th>
                      <th className="p-3">Unit Price</th>
                      <th className="p-3">Line Total</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {orderItems.map((item) => (
                      <tr key={item.itemId}>
                        <td className="p-3 font-medium text-slate-800 dark:text-slate-200">
                          {medicineName(item.medicineId)}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">
                          {item.quantity}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                          {formatCurrency(
                            Number(item.quantity) * Number(item.unitPrice)
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/50">
              <span
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${statusTheme(
                  selectedOrder.status
                )}`}
              >
                {selectedOrder.status}
              </span>
              <p className="text-lg font-extrabold text-slate-900 dark:text-white">
                Total: {formatCurrency(selectedOrder.totalAmount)}
              </p>
            </footer>
          </section>
        </div>
      )}

      <p className="text-xs leading-5 text-slate-400 dark:text-slate-500">
        New orders are saved as PENDING. This page does not yet approve or
        receive orders or update inventory quantities.
      </p>
    </div>
  );
}

function Metric({ title, value, icon: Icon, color }) {
  const themes = {
    teal: "border-teal-200 from-white to-teal-50 dark:border-teal-900 dark:from-slate-900 dark:to-teal-950/40",
    amber: "border-amber-200 from-white to-amber-50 dark:border-amber-900 dark:from-slate-900 dark:to-amber-950/40",
    blue: "border-blue-200 from-white to-blue-50 dark:border-blue-900 dark:from-slate-900 dark:to-blue-950/40",
    purple: "border-purple-200 from-white to-purple-50 dark:border-purple-900 dark:from-slate-900 dark:to-purple-950/40",
  };

  const iconThemes = {
    teal: "bg-teal-100 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300",
    amber: "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300",
    blue: "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300",
    purple: "bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300",
  };

  return (
    <article
      className={`group rounded-2xl border bg-gradient-to-br p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg ${themes[color]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <p className="mt-3 break-words text-2xl font-extrabold text-slate-900 dark:text-white">
            {value}
          </p>
        </div>

        <div
          className={`rounded-2xl p-3 transition group-hover:scale-105 ${iconThemes[color]}`}
        >
          <Icon size={23} />
        </div>
      </div>
    </article>
  );
}
