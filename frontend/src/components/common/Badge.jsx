import React from 'react';

export const Badge = ({ children, variant = 'default', size = 'md', className = '' }) => {
  const getVariantStyles = () => {
    switch (variant.toLowerCase()) {
      case 'success':
      case 'active':
      case 'available':
      case 'approved':
      case 'completed':
      case 'delivered':
      case 'paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80 ring-1 ring-emerald-500/10';
      case 'warning':
      case 'pending':
      case 'near_expiry':
      case 'low_stock':
      case 'shipped':
      case 'partially_received':
      case 'partial':
        return 'bg-amber-50 text-amber-700 border-amber-200/80 ring-1 ring-amber-500/10';
      case 'danger':
      case 'error':
      case 'expired':
      case 'out_of_stock':
      case 'rejected':
      case 'cancelled':
      case 'suspended':
      case 'archived':
        return 'bg-rose-50 text-rose-700 border-rose-200/80 ring-1 ring-rose-500/10';
      case 'info':
      case 'accepted':
      case 'pharmacist':
        return 'bg-sky-50 text-sky-700 border-sky-200/80 ring-1 ring-sky-500/10';
      case 'admin':
        return 'bg-purple-50 text-purple-700 border-purple-200/80 ring-1 ring-purple-500/10';
      case 'staff':
        return 'bg-blue-50 text-blue-700 border-blue-200/80 ring-1 ring-blue-500/10';
      case 'supplier':
        return 'bg-teal-50 text-teal-700 border-teal-200/80 ring-1 ring-teal-500/10';
      case 'draft':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200/80 ring-1 ring-slate-500/10';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-0.5 text-xs';
      case 'lg':
        return 'px-3.5 py-1.5 text-sm font-semibold';
      case 'md':
      default:
        return 'px-2.5 py-1 text-xs font-medium';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-xs tracking-wide uppercase font-semibold ${getVariantStyles()} ${getSizeStyles()} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
      {children}
    </span>
  );
};

export default Badge;
