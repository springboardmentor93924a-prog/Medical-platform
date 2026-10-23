import { API_BASE } from "../../services/api";

import { useCallback, useEffect, useState } from "react";
import {
  ShoppingCart,
  Package,
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

const API = `${API_BASE}`;

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

  const request = useCallback(
    async (url, options = {}) => {
      if (!token) throw new Error("Please log in to continue.");

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
        const body = await response.text();
        throw new Error(
          body || `Request failed with status ${response.status}`
        );
      }

      if (response.status === 204) return null;
      return response.json();
    },
    [token]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [orderData, supplierData, medicineData] = await Promise.all([
        request(`${API}/admin/purchase-orders`),
        request(`${API}/admin/suppliers`),
        request(`${API}/admin/medicines`),
      ]);

      setOrders(orderData);
      setSuppliers(supplierData);
      setMedicines(medicineData);
    } catch (err) {
      setError(err.message || "Unable to load purchase orders.");
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
    suppliers.find((supplier) => supplier.supplierId === id)?.supplierName ||
    `Supplier #${id}`;

  const medicineName = (id) =>
    medicines.find((medicine) => medicine.medicineId === id)?.medicineName ||
    `Medicine #${id}`;

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
      sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
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

    if (
      items.some(
        (item) =>
          !item.medicineId ||
          !Number.isInteger(Number(item.quantity)) ||
          Number(item.quantity) <= 0 ||
          item.unitPrice === "" ||
          !Number.isFinite(Number(item.unitPrice)) ||
          Number(item.unitPrice) < 0 ||
          !Number.isFinite(Number(item.unitPrice) * Number(item.quantity))
      )
    ) {
      setError("Select a medicine and enter a valid quantity and unit price for every item.");
      return;
    }

    setSaving(true);

    try {
      await request(`${API}/admin/purchase-orders`, {
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
        `${API}/admin/purchase-orders/${order.purchaseOrderId}/items`
      );
      setOrderItems(data);
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
      PENDING: "bg-amber-100 text-amber-800",
      APPROVED: "bg-blue-100 text-blue-800",
      RECEIVED: "bg-emerald-100 text-emerald-800",
      CANCELLED: "bg-rose-100 text-rose-800",
    };
    return themes[status] || "bg-slate-100 text-slate-700";
  };

  return (
    <div className="min-h-full space-y-7 bg-gradient-to-br from-slate-50 via-white to-teal-50/40 p-4 md:p-7 lg:p-8">
      <header className="relative overflow-hidden rounded-3xl border border-teal-100 bg-gradient-to-r from-teal-50 via-white to-cyan-50 p-6 shadow-sm md:p-8">
        <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-teal-100/70 blur-3xl" />

        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 p-4 text-white shadow-lg shadow-teal-600/20">
              <ShoppingCart size={30} />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-teal-700">
                MediStock / Procurement
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
                Purchase Orders
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Create supplier orders and track your purchase history.
              </p>
            </div>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-teal-700 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertTriangle size={20} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-bold">Action failed</p>
            <p className="mt-1 break-words">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div role="status" className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
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
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 p-5 md:p-6">
          <div className="rounded-xl bg-teal-100 p-3 text-teal-700">
            <Plus size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Create Purchase Order
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Choose a supplier and add the medicines you want to order.
            </p>
          </div>
        </div>

        <form onSubmit={createOrder} className="space-y-5 p-5 md:p-6">
          <div className="max-w-xl">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Supplier <span className="text-rose-500">*</span>
            </label>
            <select
              value={supplierId}
              onChange={(event) => setSupplierId(event.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
            >
              <option value="">Select supplier</option>
              {suppliers
                .filter((supplier) => supplier.active !== false && supplier.active !== 0)
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
                className="grid grid-cols-1 items-end gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:grid-cols-2 xl:grid-cols-4"
              >
                <label className="text-sm font-semibold text-slate-700">
                  Medicine
                  <select
                    value={item.medicineId}
                    onChange={(event) =>
                      updateItem(index, "medicineId", event.target.value)
                    }
                    required
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-normal outline-none focus:border-teal-500"
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

                <label className="text-sm font-semibold text-slate-700">
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
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-teal-500"
                  />
                </label>

                <label className="text-sm font-semibold text-slate-700">
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
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-teal-500"
                  />
                </label>

                <button
                  type="button"
                  disabled={items.length === 1}
                  onClick={() => removeItem(index)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-40"
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
              className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-800 hover:bg-teal-100"
            >
              <Plus size={17} />
              Add medicine
            </button>

            <div className="flex flex-wrap items-center gap-4">
              <div className="text-right">
                <p className="text-xs font-medium text-slate-500">
                  Estimated total
                </p>
                <p className="mt-1 text-xl font-extrabold text-slate-900">
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

      {/* History */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="space-y-4 border-b border-slate-100 p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Purchase History
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Review existing orders and their current status.
              </p>
            </div>
            <span className="rounded-full border border-teal-100 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700">
              {filteredOrders.length} orders
            </span>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search order or supplier..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-teal-500 focus:bg-white"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-teal-500"
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
          <div className="p-10 text-center text-slate-500">
            <RefreshCw size={24} className="mx-auto mb-3 animate-spin text-teal-600" />
            Loading purchase history...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <div className="rounded-2xl bg-teal-50 p-4 text-teal-600">
              <ShoppingCart size={30} />
            </div>
            <h3 className="mt-4 font-bold text-slate-900">
              No purchase orders found
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Create an order or change your search filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">Order</th>
                  <th className="px-5 py-4">Supplier</th>
                  <th className="px-5 py-4">Order Date</th>
                  <th className="px-5 py-4">Total Amount</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => (
                  <tr key={order.purchaseOrderId} className="hover:bg-teal-50/50">
                    <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-800">
                      #{order.purchaseOrderId}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-slate-100 p-2 text-slate-500">
                          <Truck size={16} />
                        </span>
                        {supplierName(order.supplierId)}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                      {order.orderDate
                        ? new Date(order.orderDate).toLocaleString()
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-800">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${statusTheme(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <button
                        onClick={() => viewItems(order)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-white px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <section className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <header className="flex items-center justify-between gap-4 border-b border-slate-100 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-teal-700">
                  Purchase details
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  Order #{selectedOrder.purchaseOrderId}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {supplierName(selectedOrder.supplierId)}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedOrder(null);
                  setOrderItems([]);
                }}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                aria-label="Close order details"
              >
                <X size={20} />
              </button>
            </header>

            <div className="max-h-[60vh] overflow-auto p-5">
              {orderItems.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  No order items found.
                </p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="p-3">Medicine</th>
                      <th className="p-3">Quantity</th>
                      <th className="p-3">Unit Price</th>
                      <th className="p-3">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orderItems.map((item) => (
                      <tr key={item.itemId}>
                        <td className="p-3 font-medium text-slate-800">
                          {medicineName(item.medicineId)}
                        </td>
                        <td className="p-3 text-slate-600">{item.quantity}</td>
                        <td className="p-3 text-slate-600">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="p-3 font-semibold text-slate-800">
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

            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 p-5">
              <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${statusTheme(selectedOrder.status)}`}>
                {selectedOrder.status}
              </span>
              <p className="text-lg font-extrabold text-slate-900">
                Total: {formatCurrency(selectedOrder.totalAmount)}
              </p>
            </footer>
          </section>
        </div>
      )}

      <p className="text-xs leading-5 text-slate-400">
        New orders are saved as PENDING. This page does not yet approve or receive
        orders or update inventory quantities.
      </p>
    </div>
  );
}

function Metric({ title, value, icon: Icon, color }) {
  const themes = {
    teal: "border-teal-100 from-teal-50 to-white",
    amber: "border-amber-100 from-amber-50 to-white",
    blue: "border-blue-100 from-blue-50 to-white",
    purple: "border-purple-100 from-purple-50 to-white",
  };

  const iconThemes = {
    teal: "bg-teal-100 text-teal-700",
    amber: "bg-amber-100 text-amber-700",
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
  };

  return (
    <article className={`group rounded-2xl border bg-gradient-to-br p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg ${themes[color]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <p className="mt-3 break-words text-2xl font-extrabold text-slate-900">
            {value}
          </p>
        </div>
        <div className={`rounded-2xl p-3 transition group-hover:scale-105 ${iconThemes[color]}`}>
          <Icon size={23} />
        </div>
      </div>
    </article>
  );
}
