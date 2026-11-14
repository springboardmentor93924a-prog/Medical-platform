import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../common/Sidebar';
import { Navbar } from '../common/Navbar';
import { Toast } from '../common/Toast';
import { useNotification } from '../../context/NotificationContext';

export const MainLayout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { toast, hideToast } = useNotification();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Toast notifications */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={hideToast}
        />
      )}

      {/* Sidebar navigation */}
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header Navbar */}
        <Navbar setIsMobileOpen={setIsMobileOpen} />

        {/* Page View Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
