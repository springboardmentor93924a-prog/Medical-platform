import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Pill,
  Search,
  ClipboardCheck,
  Truck,
  CalendarClock,
  Bell,
  User,
  LogOut,
} from "lucide-react";

const staffMenu = [
  {
    name: "Dashboard",
    path: "/staff",
    icon: LayoutDashboard,
    end: true,
  },
  {
    name: "View Medicines",
    path: "/staff/medicines",
    icon: Pill,
  },
  {
    name: "Search Medicines",
    path: "/staff/search",
    icon: Search,
  },
  {
    name: "Stock Checking",
    path: "/staff/stock-checking",
    icon: ClipboardCheck,
  },
  {
    name: "Receive Medicines",
    path: "/staff/receive",
    icon: Truck,
  },
  {
    name: "Expiry Checking",
    path: "/staff/expiry",
    icon: CalendarClock,
  },
  {
    name: "Notifications",
    path: "/staff/notifications",
    icon: Bell,
  },
  {
    name: "My Profile",
    path: "/staff/profile",
    icon: User,
  },
];

export default function StaffLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="px-6 py-5 border-b border-slate-700">
          <h1 className="text-2xl font-bold text-blue-400">
            MediStock
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Staff Panel
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {staffMenu.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-slate-800"
                  }`
                }
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 p-4 text-gray-300 hover:bg-red-600"
        >
          <LogOut size={20} />
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <header className="bg-white shadow-sm px-8 py-5">
          <h2 className="text-xl font-semibold text-gray-800">
            Staff Portal
          </h2>
        </header>

        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
