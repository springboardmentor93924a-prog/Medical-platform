
import { useEffect, useMemo, useState } from "react";
import {
  Truck,
  PackageCheck,
  Search,
  RefreshCw,
  Calendar,
  Hash,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";

import { apiFetch } from "../../api/api.js";

const EMPTY_RECEIPT = {
  receivedQuantity: "",
  batchNumber: "",
  manufacturingDate: "",
  expiryDate: "",
};

export default function ReceiveMedicines() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [receiptForms, setReceiptForms] = useState({});

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiFetch(
        "/purchase-orders/ready-to-receive"
      );

      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load purchase orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const status = (order.status || "").toUpperCase();

      const matchesStatus =
        filter === "ALL" || status === filter;

      const searchText = [
        order.purchaseOrderId,
        order.supplierId,
        order.status,
        order.orderDate,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        matchesStatus &&
        searchText.includes(search.toLowerCase())
      );
    });
  }, [orders, filter, search]);

  const openReceipt = async (order) => {
    try {
      setSelectedOrder(order);
      setOrderItems([]);
      setReceiptForms({});
      setError("");
      setSuccess("");
      setLoadingItems(true);

      const data = await apiFetch(
        `/purchase-orders/${order.purchaseOrderId}/items`
      );

      const items = Array.isArray(data) ? data : [];

      setOrderItems(items);

      const initialForms = {};

      items.forEach((item) => {
        initialForms[item.itemId] = {
          ...EMPTY_RECEIPT,
        };
      });

      setReceiptForms(initialForms);
    } catch (err) {
      setSelectedOrder(null);
      setError(err.message || "Unable to load purchase order items.");
    } finally {
      setLoadingItems(false);
    }
  };

  const closeReceipt = () => {
    if (submitting) return;

    setSelectedOrder(null);
    setOrderItems([]);
    setReceiptForms({});
    setError("");
  };

  const handleItemChange = (itemId, field, value) => {
    setReceiptForms((previous) => ({
      ...previous,
      [itemId]: {
        ...previous[itemId],
        [field]: value,
      },
    }));
  };

  const getRemainingQuantity = (item) => {
    const ordered = Number(item.quantity || 0);
    const received = Number(item.receivedQuantity || 0);

    return Math.max(0, ordered - received);
  };

  const submitReceipt = async (event) => {
    event.preventDefault();

    if (!selectedOrder) return;

    setError("");
    setSuccess("");

    const receiptItems = [];

    for (const item of orderItems) {
      const form = receiptForms[item.itemId];

      if (!form) continue;

      const quantity = Number(form.receivedQuantity);

      // Skip items not being received in this submission.
      if (!form.receivedQuantity || quantity === 0) {
        continue;
      }

      const remaining = getRemainingQuantity(item);

      if (!Number.isInteger(quantity) || quantity < 0) {
        setError("Enter a valid whole-number quantity.");
        return;
      }

      if (quantity > remaining) {
        setError(
          `Received quantity cannot exceed the remaining quantity for item #${item.itemId}.`
        );
        return;
      }

      if (!form.batchNumber.trim()) {
        setError(`Batch number is required for item #${item.itemId}.`);
        return;
      }

      if (
        !form.manufacturingDate ||
        !form.expiryDate
      ) {
        setError(
          `Manufacturing date and expiry date are required for item #${item.itemId}.`
        );
        return;
      }

      if (form.expiryDate < form.manufacturingDate) {
        setError(
          `Expiry date cannot be earlier than manufacturing date for item #${item.itemId}.`
        );
        return;
      }

      receiptItems.push({
        itemId: item.itemId,
        receivedQuantity: quantity,
        batchNumber: form.batchNumber.trim(),
        manufacturingDate: form.manufacturingDate,
        expiryDate: form.expiryDate,
      });
    }

    if (receiptItems.length === 0) {
      setError("Enter a received quantity for at least one medicine.");
      return;
    }

    try {
      setSubmitting(true);

      await apiFetch(
        `/purchase-orders/${selectedOrder.purchaseOrderId}/receive`,
        {
          method: "POST",
          body: JSON.stringify({
            items: receiptItems,
          }),
        }
      );

      setSuccess(
        `Purchase Order #${selectedOrder.purchaseOrderId} received successfully. Inventory has been updated.`
      );

      setSelectedOrder(null);
      setOrderItems([]);
      setReceiptForms({});

      await loadOrders();
    } catch (err) {
      setError(err.message || "Failed to record medicine receipt.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusStyle = (status) => {
    switch ((status || "").toUpperCase()) {
      case "RECEIVED":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";

      case "PARTIALLY_RECEIVED":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";

      case "CANCELLED":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";

      default:
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Receive Medicines
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Verify approved purchase orders and record received medicines.
          </p>
        </div>

        <button
          onClick={loadOrders}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-400">
          <CheckCircle size={18} className="mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Purchase Order List */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 p-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Truck className="h-6 w-6 text-blue-600" />

            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Purchase Orders Ready for Receiving
              </h3>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                {filteredOrders.length} purchase orders
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search purchase order or supplier ID..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              <option value="ALL">All statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="PARTIALLY_RECEIVED">
                Partially Received
              </option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500">
            <RefreshCw size={18} className="animate-spin" />
            Loading purchase orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 text-center">
            <PackageCheck className="mb-3 h-10 w-10 text-slate-300" />

            <p className="font-medium text-slate-700 dark:text-slate-200">
              No purchase orders ready for receiving
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Approved purchase orders will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950/50">
                <tr>
                  <th className="px-5 py-3">Purchase Order</th>
                  <th className="px-5 py-3">Supplier ID</th>
                  <th className="px-5 py-3">Order Date</th>
                  <th className="px-5 py-3">Total Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.purchaseOrderId}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-5 py-4 font-medium text-slate-900 dark:text-white">
                      PO #{order.purchaseOrderId}
                    </td>

                    <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                      #{order.supplierId ?? "—"}
                    </td>

                    <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                      {order.orderDate || "—"}
                    </td>

                    <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                      ₹{Number(order.totalAmount || 0).toFixed(2)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusStyle(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <button
                        onClick={() => openReceipt(order)}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        Verify Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Receipt Form */}
      {selectedOrder && (
        <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm dark:border-blue-900 dark:bg-slate-900">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Receive Purchase Order #{selectedOrder.purchaseOrderId}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Enter the physical quantity and batch details for each medicine.
              </p>
            </div>

            <button
              onClick={closeReceipt}
              disabled={submitting}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close receipt form"
            >
              <X size={18} />
            </button>
          </div>

          {loadingItems ? (
            <div className="flex items-center justify-center gap-2 p-8 text-sm text-slate-500">
              <RefreshCw size={18} className="animate-spin" />
              Loading purchase order items...
            </div>
          ) : orderItems.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              No items found in this purchase order.
            </p>
          ) : (
            <form onSubmit={submitReceipt} className="space-y-5">
              {orderItems.map((item) => {
                const form = receiptForms[item.itemId] || EMPTY_RECEIPT;
                const remaining = getRemainingQuantity(item);

                return (
                  <div
                    key={item.itemId}
                    className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                  >
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">
                          Medicine ID: {item.medicineId}
                        </h4>

                        <p className="mt-1 text-xs text-slate-500">
                          Item #{item.itemId} · Unit price: ₹
                          {Number(item.unitPrice || 0).toFixed(2)}
                        </p>
                      </div>

                      <div className="text-xs text-slate-600 dark:text-slate-300">
                        Ordered: <strong>{item.quantity}</strong>
                        {" · "}
                        Received: <strong>{item.receivedQuantity || 0}</strong>
                        {" · "}
                        Remaining: <strong>{remaining}</strong>
                      </div>
                    </div>

                    {remaining === 0 ? (
                      <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
                        This medicine has been fully received.
                      </p>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Received Quantity
                          </label>

                          <input
                            type="number"
                            min="0"
                            max={remaining}
                            step="1"
                            value={form.receivedQuantity}
                            onChange={(event) =>
                              handleItemChange(
                                item.itemId,
                                "receivedQuantity",
                                event.target.value
                              )
                            }
                            placeholder={`Max ${remaining}`}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Batch Number
                          </label>

                          <div className="relative">
                            <Hash
                              size={16}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                              value={form.batchNumber}
                              onChange={(event) =>
                                handleItemChange(
                                  item.itemId,
                                  "batchNumber",
                                  event.target.value
                                )
                              }
                              placeholder="Enter batch number"
                              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Manufacturing Date
                          </label>

                          <div className="relative">
                            <Calendar
                              size={16}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                              type="date"
                              value={form.manufacturingDate}
                              onChange={(event) =>
                                handleItemChange(
                                  item.itemId,
                                  "manufacturingDate",
                                  event.target.value
                                )
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Expiry Date
                          </label>

                          <div className="relative">
                            <Calendar
                              size={16}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                              type="date"
                              value={form.expiryDate}
                              onChange={(event) =>
                                handleItemChange(
                                  item.itemId,
                                  "expiryDate",
                                  event.target.value
                                )
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || loadingItems}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <PackageCheck size={18} />
                  {submitting ? "Recording..." : "Record Receipt"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
