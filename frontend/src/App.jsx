
import { useState } from "react";
import "./App.css";
import Login from "./Login";

const menuItems = [
  { name: "Dashboard", icon: "▦" },
  { name: "Medicines", icon: "✚" },
  { name: "Categories", icon: "◈" },
  { name: "Inventory", icon: "▤" },
  { name: "Expiry Management", icon: "◷" },
  { name: "Suppliers", icon: "♙" },
  { name: "Purchase Orders", icon: "⇄" },
  { name: "Billing / POS", icon: "▣" },
  { name: "Sales History", icon: "↗" },
  { name: "Stock Logs", icon: "☷" },
  { name: "Users & Roles", icon: "♧" },
  { name: "Reports", icon: "▥" },
  { name: "Notifications", icon: "♧" },
  { name: "Messages", icon: "✉" },
];

const medicines = [
  { name: "Paracetamol 500mg", category: "Pain Relief", batch: "PCM2401", stock: 240, expiry: "2027-05-20", price: 2.5, status: "In Stock" },
  { name: "Amoxicillin 250mg", category: "Antibiotic", batch: "AMX2308", stock: 18, expiry: "2027-01-12", price: 8, status: "Low Stock" },
  { name: "Cetirizine 10mg", category: "Antihistamine", batch: "CTZ2410", stock: 125, expiry: "2026-12-18", price: 3, status: "In Stock" },
  { name: "Vitamin C 500mg", category: "Supplement", batch: "VTC2205", stock: 8, expiry: "2026-11-05", price: 5, status: "Low Stock" },
  { name: "Omeprazole 20mg", category: "Gastric Care", batch: "OMP2402", stock: 76, expiry: "2027-08-30", price: 6, status: "In Stock" },
];

const initialOrders = [
  { id: "PO-1001", supplier: "HealthPlus Distributors", date: "2026-10-10", amount: 12500, status: "Received" },
  { id: "PO-1002", supplier: "MediCare Supplies", date: "2026-10-11", amount: 8750, status: "Pending" },
  { id: "PO-1003", supplier: "Apollo Wholesale", date: "2026-10-12", amount: 6400, status: "Processing" },
];

function formatRole(role) {
  const roles = {
    admin: "Administrator",
    staff: "Staff",
    supplier: "Supplier",
    pharmasist: "Pharmacist",
    pharmacist: "Pharmacist",
  };
  return roles[String(role || "").toLowerCase()] || "User";
}

const rolePages = {
  admin: menuItems.map((item) => item.name),
  staff: ["Dashboard", "Medicines", "Inventory", "Expiry Management", "Billing / POS", "Sales History", "Stock Logs", "Notifications", "Messages"],
  supplier: ["Dashboard", "Suppliers", "Purchase Orders", "Inventory", "Messages", "Notifications"],
  pharmasist: ["Dashboard", "Medicines", "Categories", "Inventory", "Expiry Management", "Billing / POS", "Sales History", "Notifications", "Messages"],
  pharmacist: ["Dashboard", "Medicines", "Categories", "Inventory", "Expiry Management", "Billing / POS", "Sales History", "Notifications", "Messages"],
};

function money(value) {
  return "₹" + Number(value).toLocaleString("en-IN");
}

function Header({ page, onSearch, user, onLogout }) {
  return (
    <header className="topbar">
      <div className="mobile-brand">
        <span className="brand-symbol">✚</span>
        <strong>MediStock</strong>
      </div>
      <div className="breadcrumb">
        <span>Workspace</span><span className="crumb-separator">/</span>
        <strong>{page}</strong>
      </div>
      <div className="topbar-right">
        <label className="search-box">
          <span>⌕</span>
          <input placeholder="Search medicines..." onChange={(e) => onSearch(e.target.value)} />
          <kbd>⌕</kbd>
        </label>
        <button className="icon-button" title="Notifications" onClick={() => alert("You are viewing the notification preview.")}>♧<i /></button>
        <div className="profile">
          <div className="avatar">
            {(user?.name || user?.email || "U")
              .split(/\\s+/)
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="profile-info">
            <strong>{user?.name || user?.email || "User"}</strong>
            <span>{formatRole(user?.role)}</span>
          </div>
          <button className="icon-button" type="button" title="Sign out" onClick={onLogout}>↪</button>
        </div>
      </div>
    </header>
  );
}

function StatCard({ icon, title, value, change, tone, note }) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <div className={`stat-icon ${tone}`}>{icon}</div>
        <span className={`trend ${change.startsWith("-") ? "negative" : ""}`}>{change}</span>
      </div>
      <p className="stat-title">{title}</p>
      <div className="stat-value">{value}</div>
      <p className="stat-note">{note}</p>
    </article>
  );
}

function InventoryChart() {
  const bars = [
    { month: "May", stock: 45, sales: 27 },
    { month: "Jun", stock: 61, sales: 35 },
    { month: "Jul", stock: 53, sales: 40 },
    { month: "Aug", stock: 76, sales: 44 },
    { month: "Sep", stock: 66, sales: 39 },
    { month: "Oct", stock: 88, sales: 54 },
  ];

  return (
    <div className="chart-area">
      <div className="chart-y-labels"><span>400</span><span>300</span><span>200</span><span>100</span><span>0</span></div>
      <div className="chart-main">
        <div className="chart-grid">
          {[0, 1, 2, 3, 4].map((n) => <div key={n} />)}
        </div>
        <div className="bar-groups">
          {bars.map((bar) => (
            <div className="bar-group" key={bar.month}>
              <div className="bar-pair">
                <div className="bar stock-bar" style={{ height: `${bar.stock}%` }} title="Stock level" />
                <div className="bar sales-bar" style={{ height: `${bar.sales}%` }} title="Sales" />
              </div>
              <span>{bar.month}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Dashboard({ onNavigate, onAdd, search, user, canAddMedicine }) {
  const filtered = medicines.filter((m) =>
    `${m.name} ${m.category} ${m.batch}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">OVERVIEW</div>
          <h1>Hello, {(user?.name || "there").split(" ")[0]} <span className="wave">✦</span></h1>
          <p>Here's what's happening with your medical inventory today.</p>
        </div>
        {canAddMedicine && <button className="primary-button" onClick={onAdd}><span>＋</span> Add Medicine</button>}
      </div>

      <section className="stats-grid">
        <StatCard icon="✚" title="Total Medicines" value="1,284" change="+12.5%" tone="green" note="Compared with last month" />
        <StatCard icon="▤" title="Total Stock Units" value="8,642" change="+8.2%" tone="purple" note="Across all medicine batches" />
        <StatCard icon="⚠" title="Low Stock Items" value="18" change="+3 items" tone="orange" note="Require restocking" />
        <StatCard icon="◷" title="Expiring Soon" value="07" change="Next 30 days" tone="red" note="Check these batches" />
      </section>

      <section className="dashboard-grid">
        <article className="panel chart-panel">
          <div className="panel-heading">
            <div><h2>Inventory Overview</h2><p>Stock levels and sales performance</p></div>
            <select aria-label="Chart period" className="select-small" defaultValue="6 months">
              <option>6 months</option><option>12 months</option>
            </select>
          </div>
          <div className="chart-legend">
            <span><i className="legend-stock" /> Stock levels</span>
            <span><i className="legend-sales" /> Sales</span>
          </div>
          <InventoryChart />
        </article>

        <article className="panel alerts-panel">
          <div className="panel-heading">
            <div><h2>Expiry Alerts</h2><p>Medicines requiring attention</p></div>
            <button className="text-button" onClick={() => onNavigate("Expiry Management")}>View all ↗</button>
          </div>
          <div className="alert-list">
            <div className="alert-row">
              <div className="medicine-avatar red-avatar">Rx</div>
              <div className="alert-details"><strong>Vitamin C 500mg</strong><span>Batch VTC2205</span></div>
              <div className="alert-date"><b>24 days</b><span>Nov 05, 2026</span></div>
            </div>
            <div className="alert-row">
              <div className="medicine-avatar orange-avatar">Rx</div>
              <div className="alert-details"><strong>Cetirizine 10mg</strong><span>Batch CTZ2410</span></div>
              <div className="alert-date"><b>67 days</b><span>Dec 18, 2026</span></div>
            </div>
            <div className="alert-row">
              <div className="medicine-avatar purple-avatar">Rx</div>
              <div className="alert-details"><strong>Amoxicillin 250mg</strong><span>Batch AMX2308</span></div>
              <div className="alert-date"><b>92 days</b><span>Jan 12, 2027</span></div>
            </div>
          </div>
          <button className="outline-button full-button" onClick={() => onNavigate("Expiry Management")}>Manage Expiry Dates <span>→</span></button>
        </article>
      </section>

      <section className="panel table-panel">
        <div className="panel-heading">
          <div><h2>Medicine Inventory</h2><p>Monitor stock levels across your catalogue</p></div>
          <button className="text-button" onClick={() => onNavigate("Medicines")}>View all medicines ↗</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>MEDICINE</th><th>CATEGORY</th><th>BATCH NO.</th><th>STOCK</th><th>UNIT PRICE</th><th>STATUS</th></tr></thead>
            <tbody>
              {filtered.slice(0, 5).map((m) => (
                <tr key={m.batch}>
                  <td><div className="medicine-cell"><div className="table-pill">Rx</div><strong>{m.name}</strong></div></td>
                  <td>{m.category}</td><td className="muted-cell">{m.batch}</td>
                  <td><strong>{m.stock}</strong> <span className="muted-cell">units</span></td>
                  <td>{money(m.price)}</td>
                  <td><span className={`status ${m.status === "Low Stock" ? "status-low" : "status-good"}`}><i />{m.status}</span></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan="6" className="empty-state">No medicines match your search.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel orders-panel">
        <div className="panel-heading">
          <div><h2>Recent Purchase Orders</h2><p>Latest supplier orders</p></div>
          <button className="text-button" onClick={() => onNavigate("Purchase Orders")}>All orders ↗</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>ORDER ID</th><th>SUPPLIER</th><th>ORDER DATE</th><th>AMOUNT</th><th>STATUS</th></tr></thead>
            <tbody>{initialOrders.map((o) => (
              <tr key={o.id}><td className="order-id">{o.id}</td><td>{o.supplier}</td><td>{o.date}</td><td>{money(o.amount)}</td>
                <td><span className={`status ${o.status === "Received" ? "status-good" : o.status === "Pending" ? "status-low" : "status-processing"}`}><i />{o.status}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>
      <p className="demo-note">Demo preview · Sample data only · Not connected to your database</p>
    </>
  );
}

function MedicinePage({ onAdd, search }) {
  const [filter, setFilter] = useState("All");
  const filtered = medicines.filter((m) =>
    `${m.name} ${m.category} ${m.batch}`.toLowerCase().includes(search.toLowerCase()) &&
    (filter === "All" || m.status === filter)
  );

  return (
    <>
      <div className="page-heading">
        <div><div className="eyebrow">INVENTORY</div><h1>Medicines Catalogue</h1><p>View and manage the medicines in your catalogue.</p></div>
        <button className="primary-button" onClick={onAdd}>＋ Add Medicine</button>
      </div>
      <div className="mini-stats">
        <div className="panel mini-stat"><span>Total medicines</span><strong>1,284</strong></div>
        <div className="panel mini-stat"><span>In stock</span><strong>1,259</strong></div>
        <div className="panel mini-stat"><span>Low stock</span><strong>18</strong></div>
      </div>
      <section className="panel table-panel">
        <div className="panel-heading"><div><h2>All Medicines</h2><p>Search and filter medicine records</p></div>
          <select className="select-small" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option>All</option><option>In Stock</option><option>Low Stock</option>
          </select>
        </div>
        <div className="table-wrap"><table>
          <thead><tr><th>MEDICINE</th><th>CATEGORY</th><th>BATCH NO.</th><th>STOCK</th><th>EXPIRY DATE</th><th>PRICE</th><th>STATUS</th></tr></thead>
          <tbody>{filtered.map((m) => <tr key={m.batch}><td><strong>{m.name}</strong></td><td>{m.category}</td><td>{m.batch}</td><td>{m.stock} units</td><td>{m.expiry}</td><td>{money(m.price)}</td><td><span className={`status ${m.status === "Low Stock" ? "status-low" : "status-good"}`}><i />{m.status}</span></td></tr>)}</tbody>
        </table></div>
      </section>
      <p className="demo-note">Demo preview · Sample data only</p>
    </>
  );
}

function AddMedicine({ onCancel, onSave }) {
  const [form, setForm] = useState({ name: "", generic: "", category: "Pain Relief", dosage: "", batch: "", quantity: "", purchasePrice: "", sellingPrice: "", expiry: "", rack: "" });
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  function submit(e) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <>
      <div className="page-heading"><div><div className="eyebrow">INVENTORY / MEDICINES</div><h1>Add Medicine</h1><p>Enter the medicine and batch details below.</p></div><button className="outline-button" onClick={onCancel}>← Back</button></div>
      <form className="panel medicine-form" onSubmit={submit}>
        <div className="form-section-heading"><div className="section-icon">✚</div><div><h2>Medicine Information</h2><p>Basic details about the medicine</p></div></div>
        <div className="form-grid">
          <label>Medicine Name *<input name="name" required value={form.name} onChange={update} placeholder="e.g. Paracetamol 500mg" /></label>
          <label>Generic Name<input name="generic" value={form.generic} onChange={update} placeholder="e.g. Paracetamol" /></label>
          <label>Category *<select name="category" value={form.category} onChange={update}><option>Pain Relief</option><option>Antibiotic</option><option>Antihistamine</option><option>Supplement</option><option>Gastric Care</option><option>Other</option></select></label>
          <label>Dosage / Strength<input name="dosage" value={form.dosage} onChange={update} placeholder="e.g. 500 mg" /></label>
          <label className="wide-field">Description<textarea placeholder="Additional medicine information (optional)" rows="3" /></label>
        </div>
        <div className="form-section-heading second-section"><div className="section-icon purple-section-icon">▤</div><div><h2>Batch & Stock Details</h2><p>Inventory tracking information</p></div></div>
        <div className="form-grid">
          <label>Batch Number *<input name="batch" required value={form.batch} onChange={update} placeholder="e.g. PCM2401" /></label>
          <label>Initial Quantity *<input name="quantity" type="number" min="0" required value={form.quantity} onChange={update} placeholder="Enter units" /></label>
          <label>Purchase Price (₹) *<input name="purchasePrice" type="number" min="0" step="0.01" required value={form.purchasePrice} onChange={update} placeholder="0.00" /></label>
          <label>Selling Price (₹) *<input name="sellingPrice" type="number" min="0" step="0.01" required value={form.sellingPrice} onChange={update} placeholder="0.00" /></label>
          <label>Expiry Date *<input name="expiry" type="date" required value={form.expiry} onChange={update} /></label>
          <label>Rack / Shelf Location<input name="rack" value={form.rack} onChange={update} placeholder="e.g. A-02" /></label>
        </div>
        <div className="form-actions"><button type="button" className="outline-button" onClick={onCancel}>Cancel</button><button type="submit" className="primary-button">Save Medicine ↗</button></div>
        <p className="demo-note">This demo stores entries in the current browser session only. Database saving is not connected yet.</p>
      </form>
    </>
  );
}

function GenericPage({ page, onNavigate }) {
  const descriptions = {
    "Categories": ["Organize medicines by category.", "Category name, description, and medicine count."],
    "Inventory": ["Monitor available stock across batches.", "Batch quantity, rack location, and stock status."],
    "Expiry Management": ["Identify batches that are expired or expiring soon.", "Batch number, expiry date, quantity, and expiry status."],
    "Suppliers": ["Manage your medicine suppliers.", "Supplier name, contact number, email, and address."],
    "Purchase Orders": ["Create and track supplier orders.", "Order ID, supplier, order date, amount, and status."],
    "Billing / POS": ["Prepare a medicine bill.", "Select a medicine batch, enter quantity, and preview the invoice."],
    "Sales History": ["Review completed sales.", "Invoice number, date, user, payment method, and total."],
    "Stock Logs": ["Track changes in inventory.", "Batch, change type, quantity changed, user, and date."],
    "Users & Roles": ["Manage users and access roles.", "Name, email, phone, and assigned role."],
    "Reports": ["Review inventory and sales reports.", "Report type, generated date, and file."],
    "Notifications": ["View stock and expiry alerts.", "Notification type, message, date, and read status."],
    "Messages": ["View communication between users.", "Sender, receiver, message, and sent time."],
  };
  const details = descriptions[page] || ["Manage your MediStock workspace.", "Records and actions will appear here."];
  const [selected, setSelected] = useState("");
  const [query, setQuery] = useState("");

  return (
    <>
      <div className="page-heading"><div><div className="eyebrow">MEDISTOCK WORKSPACE</div><h1>{page}</h1><p>{details[0]}</p></div>
        <button className="outline-button" onClick={() => onNavigate("Dashboard")}>← Dashboard</button></div>
      <section className="panel placeholder-panel">
        <div className="placeholder-icon">{menuItems.find((m) => m.name === page)?.icon || "▦"}</div>
        <h2>{page} Management</h2><p>{details[1]}</p>
        <div className="placeholder-search"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${page.toLowerCase()}...`} /><button className="outline-button" onClick={() => setSelected(query || "All records")}>Search</button></div>
        {selected && <p className="search-feedback">Search preview: <strong>{selected}</strong></p>}
        <div className="preview-label">PLANNED PAGE CONTENT</div>
        <div className="planned-items"><span>✓ Search & filter</span><span>✓ Data table</span><span>✓ Add / edit actions</span><span>✓ Role-based access</span></div>
        <p className="demo-note">UI frame preview · This module is not connected to the database.</p>
      </section>
    </>
  );
}

function DashboardApp({ user, onLogout })  {
  const role = String(user?.role || "").toLowerCase();
  const allowedPages = rolePages[role] || rolePages.staff;
  const visibleMenuItems = menuItems.filter((item) => allowedPages.includes(item.name));
  const canAddMedicine = role === "admin" || role === "pharmasist" || role === "pharmacist";
  const [page, setPage] = useState("Dashboard");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [saved, setSaved] = useState([]);

  function saveMedicine(form) {
    setSaved([...saved, form]);
    setShowAdd(false);
    setPage("Medicines");
    alert("Medicine added to the temporary UI preview. It has not been saved to MySQL.");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-symbol">✚</div>
          <div><strong>MediStock</strong><span>MEDICAL INVENTORY</span></div>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav">
          {visibleMenuItems.map((item) => (
            <button key={item.name} className={`nav-item ${page === item.name && !showAdd ? "active" : ""}`} onClick={() => { setPage(item.name); setShowAdd(false); setSearch(""); }}>
              <span className="nav-icon">{item.icon}</span><span>{item.name}</span>
              {item.name === "Notifications" && <span className="nav-count">3</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="online-dot" />
          <div><strong>System status</strong><span>UI preview mode</span></div>
          <span className="version">v1.0</span>
        </div>
      </aside>

      <main className="main-area">
        <Header page={showAdd ? "Add Medicine" : page} onSearch={setSearch} user={user} onLogout={onLogout} />
        <div className="page-content">
          {showAdd ? (
            <AddMedicine onCancel={() => setShowAdd(false)} onSave={saveMedicine} />
          ) : page === "Dashboard" ? (
            <Dashboard onNavigate={setPage} onAdd={() => setShowAdd(true)} search={search} user={user} canAddMedicine={canAddMedicine} />
          ) : page === "Medicines" ? (
            <MedicinePage onAdd={() => setShowAdd(true)} search={search} />
          ) : allowedPages.includes(page) ? (
            <GenericPage key={page} page={page} onNavigate={setPage} />
          ) : (
            <GenericPage key="Dashboard" page="Dashboard" onNavigate={setPage} />
          )}
          {saved.length > 0 && <p className="demo-note">{saved.length} medicine form(s) added during this session; sample preview only.</p>}
          <footer className="footer"><span>© 2026 MediStock</span><span>Medical Inventory Management Platform</span></footer>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);

  function handleLogin(data) {
    const loggedInUser = {
      userId: data.userId,
      name: data.name,
      email: data.email,
      role: data.role,
    };

    localStorage.setItem("user", JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return <DashboardApp user={user} onLogout={handleLogout} />;
}
