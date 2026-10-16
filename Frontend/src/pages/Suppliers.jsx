import { useState } from "react";
import { Mail, MapPin, Phone, Plus } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import { BarList, Card, Label, Modal, PageHeader, Row, Tag, btn, fld } from "../components/ui.jsx";

const blank = { name: "", phone: "", email: "", address: "" };

export default function Suppliers() {
  const { suppliers, setSuppliers, medicines, orders, log } = useApp();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(blank);
  const add = (e) => {
    e.preventDefault();
    setSuppliers((l) => [...l, { ...f, id: Date.now(), onTime: 100, rating: 5 }]);
    log(`Added supplier ${f.name}`); setOpen(false); setF(blank);
  };

  return (
    <>
      <PageHeader title="Suppliers" sub="Contacts, supplied medicines, purchase history and performance">
        <button className={btn} onClick={() => setOpen(true)}><Plus className="size-4" />Add supplier</button>
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2">
        {suppliers.map((s) => {
          const meds = medicines.filter((m) => m.supplier === s.name);
          const hist = orders.filter((o) => o.supplier === s.name);
          return (
            <Card key={s.id} title={s.name} action={<span className="text-sm font-semibold text-amber-600">★ {s.rating}</span>}>
              <ul className="space-y-1 text-sm text-slate-600">
                <li className="flex items-center gap-2"><Phone className="size-4 shrink-0" aria-hidden="true" />{s.phone}</li>
                <li className="flex items-center gap-2"><Mail className="size-4 shrink-0" aria-hidden="true" /><span className="truncate">{s.email}</span></li>
                <li className="flex items-center gap-2"><MapPin className="size-4 shrink-0" aria-hidden="true" />{s.address}</li>
              </ul>
              <div className="my-4"><BarList max={100} items={[{ label: "On-time delivery", value: s.onTime, text: `${s.onTime}%` }]} /></div>
              <p className="text-sm font-semibold">Supplied medicines</p>
              <p className="text-sm text-slate-600">{meds.map((m) => m.name).join(", ") || "None yet"}</p>
              <p className="mt-3 text-sm font-semibold">Purchase history ({hist.length})</p>
              <ul>{hist.slice(0, 3).map((o) => <Row key={o.id} left={`${o.id} · ${o.medicine}`} sub={o.date} right={<Tag s={o.status} />} />)}</ul>
            </Card>
          );
        })}
      </div>
      {open && (
        <Modal title="Add supplier" onClose={() => setOpen(false)}>
          <form onSubmit={add} className="space-y-3">
            {[["name", "Supplier name", "text"], ["phone", "Contact number", "tel"], ["email", "Email", "email"], ["address", "Address", "text"]].map(([k, label, type]) => (
              <Label key={k} text={label}><input required type={type} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className={fld} /></Label>
            ))}
            <button className={`${btn} w-full`}>Save supplier</button>
          </form>
        </Modal>
      )}
    </>
  );
}