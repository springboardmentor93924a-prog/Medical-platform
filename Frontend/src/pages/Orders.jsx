import { useState } from "react";
import { Plus } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import { Badge, Label, Modal, PageHeader, Tag, TableWrap, btn, fld, ghost, td, th } from "../components/ui.jsx";
import { MY_SUPPLIER, today } from "../data/mock.js";

// Who moves an order to the next status
const ACTIONS = {
  Pending: { label: "Accept", to: "Accepted", role: "Supplier" },
  Accepted: { label: "Mark dispatched", to: "Dispatched", role: "Supplier" },
  Dispatched: { label: "Receive stock", to: "Received", role: "Pharmacist" },
};

export default function Orders() {
  const { user, orders, setOrders, medicines, setMedicines, log } = useApp();
  const list = user.role === "Supplier" ? orders.filter((o) => o.supplier === MY_SUPPLIER) : orders;
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ medicine: "", qty: "" });

  const create = (e) => {
    e.preventDefault();
    const m = medicines.find((x) => x.name === f.medicine);
    setOrders((l) => [{ id: `PO-${1001 + l.length}`, supplier: m.supplier, medicine: m.name, qty: +f.qty, date: today, status: "Pending" }, ...l]);
    log(`Purchase order created: ${f.qty} × ${m.name}`); setOpen(false);
  };
  const move = (o, status) => {
    setOrders((l) => l.map((x) => (x.id === o.id ? { ...x, status } : x)));
    log(`${o.id} marked ${status}`);
    if (status === "Received") setMedicines((l) => l.map((m) => (m.name === o.medicine ? { ...m, qty: m.qty + o.qty } : m))); // automatic stock update
  };

  return (
    <>
      <PageHeader title="Purchase orders" sub={user.role === "Supplier" ? "Orders placed with you" : "Create, track and receive orders"}>
        {user.role === "Pharmacist" && <button className={btn} onClick={() => { setF({ medicine: medicines[0]?.name, qty: "" }); setOpen(true); }}><Plus className="size-4" />New order</button>}
      </PageHeader>
      <div className="mb-4 flex flex-wrap gap-2">
        {["Pending", "Accepted", "Dispatched", "Received"].map((s) => <Badge key={s} tone="slate">{s}: {list.filter((o) => o.status === s).length}</Badge>)}
      </div>
      <div className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-teal-900/5">
        <TableWrap>
          <thead><tr>{["Order", "Supplier", "Medicine", "Qty", "Date", "Status", ""].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
          <tbody>
            {list.map((o) => {
              const a = ACTIONS[o.status];
              return (
                <tr key={o.id}>
                  <td className={`${td} font-semibold`}>{o.id}</td><td className={td}>{o.supplier}</td><td className={td}>{o.medicine}</td>
                  <td className={td}>{o.qty}</td><td className={td}>{o.date}</td><td className={td}><Tag s={o.status} /></td>
                  <td className={td}>{a && a.role === user.role && <button className={ghost} onClick={() => move(o, a.to)}>{a.label}</button>}</td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      </div>
      {open && (
        <Modal title="New purchase order" onClose={() => setOpen(false)}>
          <form onSubmit={create} className="space-y-3">
            <Label text="Medicine">
              <select value={f.medicine} onChange={(e) => setF({ ...f, medicine: e.target.value })} className={fld}>
                {medicines.map((m) => <option key={m.id} value={m.name}>{m.name} ({m.supplier})</option>)}
              </select>
            </Label>
            <Label text="Quantity"><input required type="number" min="1" value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} className={fld} /></Label>
            <button className={`${btn} w-full`}>Place order</button>
          </form>
        </Modal>
      )}
    </>
  );
}