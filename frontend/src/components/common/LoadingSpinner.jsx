import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ label = 'Loading...', message, size = 'md', className = '' }) => {
  const displayLabel = message || label;
  const sizeMap = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 gap-3 text-slate-500 ${className}`}>
      <Loader2 className={`${sizeMap[size] || sizeMap.md} animate-spin text-emerald-600`} />
      {displayLabel && <p className="text-xs font-medium text-slate-500 tracking-wide">{displayLabel}</p>}
    </div>
  );
};

export default LoadingSpinner;
