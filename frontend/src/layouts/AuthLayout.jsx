import React from 'react';
import { Outlet } from 'react-router-dom';
import { Activity, ShieldCheck, HeartPulse, CheckCircle2 } from 'lucide-react';
import { ToastContainer } from '../components/common/Toast';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-slate-100/70 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
        {/* Left Side: Brand & Feature Highlights */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-brand-950 to-slate-900 text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-500 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight">MediStock</h1>
                <p className="text-xs text-brand-300 font-medium">Inventory Intelligence Platform</p>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug mb-4">
              Real-time Medical Stock & Supplier Intelligence
            </h2>
            <p className="text-sm text-slate-300/90 leading-relaxed mb-8">
              Secure, role-based platform designed for hospitals, clinical pharmacies, and authorized pharmaceutical suppliers.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                <span>Automated batch & expiry date monitoring with early warnings</span>
              </div>
              <div className="flex items-start gap-3 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                <span>End-to-end purchase order workflow with strict supplier data isolation</span>
              </div>
              <div className="flex items-start gap-3 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                <span>Live audit logging and compliant PDF & Excel reporting</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/80 mt-8 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> HIPAA & GMP Compliant
            </span>
            <span>v1.0.0</span>
          </div>
        </div>

        {/* Right Side: Form Container */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          <Outlet />
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};
