import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loading = false,
  disabled = false,
  onClick,
  className = '',
  icon: Icon,
  ...props
}) => {
  const isBusy = isLoading || loading;

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30 active:bg-emerald-800 focus-visible:ring-emerald-500';
      case 'secondary':
        return 'bg-slate-100 hover:bg-slate-200 text-slate-700 active:bg-slate-300 focus-visible:ring-slate-400';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30 active:bg-emerald-800 focus-visible:ring-emerald-500';
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/30 active:bg-rose-800 focus-visible:ring-rose-500';
      case 'outline':
        return 'border border-slate-300 hover:bg-slate-100/80 text-slate-700 active:bg-slate-200 focus-visible:ring-slate-400';
      case 'ghost':
        return 'hover:bg-slate-100 text-slate-600 hover:text-slate-900 active:bg-slate-200 focus-visible:ring-slate-400';
      default:
        return 'bg-emerald-600 hover:bg-emerald-700 text-white';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-xs rounded-lg gap-1.5';
      case 'lg':
        return 'px-5 py-2.5 text-base rounded-xl gap-2.5';
      case 'md':
      default:
        return 'px-4 py-2 text-sm rounded-xl gap-2';
    }
  };

  return (
    <button
      type={type}
      disabled={disabled || isBusy}
      onClick={onClick}
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed select-none cursor-pointer ${getVariantStyles()} ${getSizeStyles()} ${className}`}
      {...props}
    >
      {isBusy ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
