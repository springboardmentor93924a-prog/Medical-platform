// Mock data only. Replace with Spring Boot API calls (Axios) later.
const d = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
export const today = d(0);
export const MY_SUPPLIER = "MediSource Pharma"; // orders shown to Supplier logins
export const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
export const daysTo = (date) => Math.ceil((new Date(date) - Date.now()) / 864e5);
export const stockStatus = (m) => (m.qty === 0 ? "Out of stock" : m.qty <= m.reorder ? "Low stock" : "In stock");
export const expiryStatus = (m) => {
  const n = daysTo(m.expiry);
  return n < 0 ? "Expired" : n <= 90 ? "Near expiry" : "Safe";
};
export const categories = ["Antibiotic", "Analgesic", "Antacid", "Antidiabetic", "Cardiac", "Vitamin", "Antiallergic"];

export const suppliersSeed = [
  { id: 1, name: "MediSource Pharma", phone: "+91 98765 43210", email: "sales@medisource.example", address: "12 Industrial Estate, Chennai", onTime: 96, rating: 4.8 },
  { id: 2, name: "CarePlus Distributors", phone: "+91 98400 11223", email: "orders@careplus.example", address: "45 Market Road, Bengaluru", onTime: 88, rating: 4.3 },
  { id: 3, name: "HealthBridge Labs", phone: "+91 90030 55667", email: "supply@healthbridge.example", address: "7 Pharma Park, Hyderabad", onTime: 92, rating: 4.5 },
  { id: 4, name: "Nova Wellness", phone: "+91 99620 88990", email: "hello@novawellness.example", address: "29 Lake View, Pune", onTime: 79, rating: 3.9 },
];

const m = (id, name, batch, category, supplier, qty, reorder, mfg, exp, price) =>
  ({ id, name, batch, category, supplier, qty, reorder, mfg: d(mfg), expiry: d(exp), price });
export const medicinesSeed = [
  m(1, "Amoxicillin 500mg", "B-2301", "Antibiotic", "MediSource Pharma", 240, 100, -300, 420, 8.5),
  m(2, "Paracetamol 650mg", "B-2302", "Analgesic", "CarePlus Distributors", 35, 80, -200, 45, 2.2),
  m(3, "Pantoprazole 40mg", "B-2303", "Antacid", "HealthBridge Labs", 0, 50, -150, 300, 6.4),
  m(4, "Metformin 500mg", "B-2304", "Antidiabetic", "MediSource Pharma", 180, 90, -250, 200, 3.1),
  m(5, "Atorvastatin 10mg", "B-2305", "Cardiac", "CarePlus Distributors", 60, 70, -400, 75, 9.8),
  m(6, "Vitamin D3 60K", "B-2306", "Vitamin", "HealthBridge Labs", 320, 100, -700, -12, 14),
  m(7, "Azithromycin 250mg", "B-2307", "Antibiotic", "MediSource Pharma", 90, 60, -120, 150, 18.5),
  m(8, "Ibuprofen 400mg", "B-2308", "Analgesic", "Nova Wellness", 410, 120, -90, 520, 2.9),
  m(9, "Amlodipine 5mg", "B-2309", "Cardiac", "Nova Wellness", 25, 60, -500, 30, 4.6),
  m(10, "Cetirizine 10mg", "B-2310", "Antiallergic", "HealthBridge Labs", 150, 50, -60, 260, 1.8),
];

export const ordersSeed = [
  { id: "PO-1001", supplier: "MediSource Pharma", medicine: "Amoxicillin 500mg", qty: 200, date: d(-1), status: "Pending" },
  { id: "PO-1002", supplier: "CarePlus Distributors", medicine: "Paracetamol 650mg", qty: 300, date: d(-3), status: "Accepted" },
  { id: "PO-1003", supplier: "HealthBridge Labs", medicine: "Pantoprazole 40mg", qty: 150, date: d(-5), status: "Dispatched" },
  { id: "PO-1004", supplier: "MediSource Pharma", medicine: "Metformin 500mg", qty: 120, date: d(-12), status: "Received" },
  { id: "PO-1005", supplier: "MediSource Pharma", medicine: "Azithromycin 250mg", qty: 100, date: d(0), status: "Pending" },
  { id: "PO-1006", supplier: "Nova Wellness", medicine: "Amlodipine 5mg", qty: 200, date: d(-4), status: "Dispatched" },
];

export const logsSeed = [
  { id: 1, text: "Stock updated: Ibuprofen 400mg 380 → 410", by: "staff1", time: "Today, 09:12" },
  { id: 2, text: "PO-1004 marked Received", by: "pharma1", time: "Yesterday, 17:40" },
  { id: 3, text: "Added Cetirizine 10mg (batch B-2310)", by: "pharma1", time: "Yesterday, 11:05" },
  { id: 4, text: "Role changed: staff2 → Pharmacist", by: "admin", time: "2 days ago" },
];

export const usersSeed = [
  { id: 1, username: "admin", name: "Asha Raman", email: "admin@medistock.example", role: "Admin", active: true },
  { id: 2, username: "pharma1", name: "Karthik Menon", email: "karthik@medistock.example", role: "Pharmacist", active: true },
  { id: 3, username: "staff1", name: "Divya Nair", email: "divya@medistock.example", role: "Staff", active: true },
  { id: 4, username: "staff2", name: "Rahul Iyer", email: "rahul@medistock.example", role: "Staff", active: false },
  { id: 5, username: "supplier1", name: "MediSource Pharma", email: "sales@medisource.example", role: "Supplier", active: true },
];